import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { db } from '@/lib/db'
import { emailSends, emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { WelcomeEmail } from '@/components/Email/templates/WelcomeEmail'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@squarage.com'
const REPLY_TO = process.env.RESEND_REPLY_TO || 'hello@squarage.com'

export async function POST(request: NextRequest) {
  try {
    // Check authentication for admin-initiated sends
    const session = await getServerSession(authOptions)
    const isAuthenticated = !!session

    const body = await request.json()
    const {
      recipient,
      templateId,
      templateType,
      variables = {},
      isTest = false,
      campaignId = null,
      skipAuth = false // For system-generated emails like welcome emails
    } = body

    // Require auth for manual sends unless explicitly skipped
    if (!skipAuth && !isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate recipient email
    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipient email' },
        { status: 400 }
      )
    }

    let htmlContent: string
    let subject: string

    // Handle different template types
    if (templateType === 'welcome' || templateId === 'welcome-email') {
      // Use the React Email component for welcome emails
      htmlContent = await render(WelcomeEmail({
        discountCode: variables.discountCode,
        customerEmail: recipient,
      }))
      subject = 'Welcome to Squarage! Your 10% discount is inside'
    } else if (templateId) {
      // Fetch template from database for other types
      const template = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1)

      if (!template || template.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Template not found' },
          { status: 404 }
        )
      }

      // Process template with variables
      htmlContent = template[0].htmlContent || ''
      subject = template[0].subject

      // Simple variable replacement
      Object.keys(variables).forEach(key => {
        const value = variables[key]
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Template ID or type required' },
        { status: 400 }
      )
    }

    // Create email send record
    const sendId = randomUUID()
    const now = new Date()

    // Log the email send attempt
    await db.insert(emailSends).values({
      id: sendId,
      campaignId,
      recipientEmail: recipient,
      templateId: templateId || null,
      status: 'pending',
      metadata: {
        templateType,
        variables,
        isTest,
        sentBy: session?.user?.email || 'system',
      },
      createdAt: now,
    })

    try {
      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from: `Squarage <${FROM_EMAIL}>`,
        to: recipient,
        replyTo: REPLY_TO,
        subject,
        html: htmlContent,
        headers: {
          'X-Entity-Ref-ID': sendId,
        },
        tags: [
          {
            name: 'category',
            value: isTest ? 'test' : 'marketing',
          },
        ],
      })

      if (error) {
        // Update send record with error
        await db
          .update(emailSends)
          .set({
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
          })
          .where(eq(emailSends.id, sendId))

        console.error('Resend error:', error)
        return NextResponse.json(
          { success: false, message: 'Failed to send email', error: error.message },
          { status: 500 }
        )
      }

      // Update send record with success
      await db
        .update(emailSends)
        .set({
          status: 'sent',
          sentAt: now,
          resendId: data?.id || null,
        })
        .where(eq(emailSends.id, sendId))

      console.log(`Email sent successfully to ${recipient}`, data)

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          id: sendId,
          resendId: data?.id,
          recipient,
          subject,
        },
      })
    } catch (sendError: any) {
      // Update send record with error
      await db
        .update(emailSends)
        .set({
          status: 'failed',
          errorMessage: sendError.message || 'Send failed',
        })
        .where(eq(emailSends.id, sendId))

      throw sendError
    }
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    )
  }
}