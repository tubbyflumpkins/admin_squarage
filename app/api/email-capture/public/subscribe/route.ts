import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emailSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { createDiscountCode } from '@/lib/shopify-admin'
import { validateEmail, getEmailErrorMessage } from '@/lib/email-validation'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 5 // 5 requests per minute per IP

// API key for authentication
const API_KEY = process.env.EMAIL_CAPTURE_API_KEY

// Allowed origins - defaults include localhost:3001 for customer site
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://squarage.com'
]


function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }

  if (limit.count >= MAX_REQUESTS) {
    return false
  }

  limit.count++
  return true
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)

function getCorsHeaders(origin: string | null) {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => {
    // Handle both exact match and wildcard subdomains
    if (allowed === '*') return true
    if (allowed === origin) return true
    if (allowed.includes('*.')) {
      const domain = allowed.replace('*.', '')
      return origin.endsWith(domain)
    }
    return false
  })

  // Always return proper CORS headers
  const selectedOrigin = allowedOrigin ? origin : ALLOWED_ORIGINS[0]

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': selectedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Remove Content-Type for OPTIONS response
  const { 'Content-Type': _, ...optionsHeaders } = corsHeaders

  return new NextResponse(null, {
    status: 200,
    headers: optionsHeaders,
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key')
    if (!API_KEY || apiKey !== API_KEY) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        {
          status: 401,
          headers: corsHeaders
        }
      )
    }

    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: corsHeaders
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { email, consentMarketing } = body

    // Comprehensive email validation
    const validationResult = validateEmail(email)

    if (!validationResult.isValid) {
      const errorMessage = getEmailErrorMessage(validationResult)

      // Log disposable email attempts for monitoring
      if (validationResult.isDisposable) {
        console.log(`Blocked disposable email attempt: ${validationResult.normalizedEmail}`)
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: errorMessage,
          errorCode: validationResult.isDisposable ? 'DISPOSABLE_EMAIL' : 'INVALID_EMAIL'
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Use the normalized (trimmed and lowercased) email
    const trimmedEmail = validationResult.normalizedEmail

    // Validate consent
    if (typeof consentMarketing !== 'boolean') {
      return new Response(
        JSON.stringify({ success: false, message: 'Marketing consent is required' }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Get additional data with sanitization
    const userAgent = request.headers.get('user-agent') || undefined
    const source = typeof body.source === 'string'
      ? body.source.trim().toLowerCase().substring(0, 50)
      : 'popup'
    const discountCode = typeof body.discountCode === 'string'
      ? body.discountCode.trim().toUpperCase().substring(0, 50)
      : null

    if (!db) {
      return new Response(
        JSON.stringify({ success: false, message: 'Database connection error' }),
        {
          status: 500,
          headers: corsHeaders
        }
      )
    }

    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.email, trimmedEmail))
      .limit(1)

    if (existingSubscriber.length > 0) {
      // For existing subscribers, return friendly message
      // Update their consent preference if it changed
      if (existingSubscriber[0].consentMarketing !== consentMarketing) {
        await db
          .update(emailSubscribers)
          .set({
            consentMarketing,
            consentTimestamp: consentMarketing ? new Date() : null,
            source,
            discountCode: discountCode || existingSubscriber[0].discountCode,
            ipAddress: ip,
            userAgent,
            updatedAt: new Date()
          })
          .where(eq(emailSubscribers.email, trimmedEmail))

        return new Response(
          JSON.stringify({
            success: true,
            message: consentMarketing
              ? "Welcome back! You've been resubscribed to our newsletter."
              : "You've been unsubscribed from our newsletter.",
            isExisting: true
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        )
      }

      // If consent hasn't changed, just return friendly message with existing discount code
      return new Response(
        JSON.stringify({
          success: true,
          message: "You're already subscribed! Thanks for your continued interest.",
          isExisting: true,
          discountCode: existingSubscriber[0].discountCode || undefined
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      )
    }

    // Generate unique ID using crypto.randomUUID
    const id = randomUUID()

    // Generate Shopify discount code for new subscriber
    let generatedDiscountCode: string | null = null

    if (consentMarketing) {
      // Only generate discount code if user consented to marketing
      try {
        generatedDiscountCode = await createDiscountCode(trimmedEmail)

        if (!generatedDiscountCode) {
          console.log('Failed to generate Shopify discount code, setting as PENDING')
          generatedDiscountCode = 'PENDING' // Mark for retry later
        }
      } catch (error) {
        console.error('Error generating discount code:', error)
        generatedDiscountCode = 'PENDING' // Mark for retry later
      }
    }

    // Use the generated code or the one provided (if any)
    const finalDiscountCode = generatedDiscountCode || discountCode

    // Insert new subscriber with discount code
    await db.insert(emailSubscribers).values({
      id,
      email: trimmedEmail,
      source,
      discountCode: finalDiscountCode,
      consentMarketing,
      consentTimestamp: consentMarketing ? new Date() : null,
      ipAddress: ip,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Send welcome email if discount code was generated and user consented
    if (consentMarketing && finalDiscountCode && finalDiscountCode !== 'PENDING') {
      try {
        // Queue welcome email
        const queueResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emails/queue`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: trimmedEmail,
              templateId: 'welcome-email', // We'll use a special ID for the welcome template
              variables: {
                discountCode: finalDiscountCode,
                customerEmail: trimmedEmail,
              },
              priority: 10, // High priority for welcome emails
              scheduledFor: new Date(), // Send immediately
              skipAuth: true,
            }),
          }
        )

        if (!queueResponse.ok) {
          console.error('Failed to queue welcome email:', await queueResponse.text())
        } else {
          console.log(`Welcome email queued for ${trimmedEmail}`)

          // Immediately process the queue for welcome emails
          fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emails/queue`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': process.env.CRON_SECRET || ''
              },
            }
          ).catch(error => {
            console.error('Failed to process email queue:', error)
          })
        }
      } catch (error) {
        console.error('Error sending welcome email:', error)
        // Don't fail the subscription if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully subscribed to newsletter',
        discountCode: finalDiscountCode === 'PENDING' ? undefined : finalDiscountCode
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    )

  } catch (error) {
    console.error('Email capture error:', error)

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Email already exists' }),
        {
          status: 409,
          headers: corsHeaders
        }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
}