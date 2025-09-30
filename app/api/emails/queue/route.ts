import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailQueue } from '@/lib/db/schema'
import { eq, lte, and, isNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET - Fetch queued emails
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch pending and recent emails from queue
    const queuedEmails = await db
      .select()
      .from(emailQueue)
      .orderBy(emailQueue.scheduledFor)
      .limit(100)

    return NextResponse.json({
      success: true,
      data: queuedEmails,
    })
  } catch (error) {
    console.error('Error fetching email queue:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add email to queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipient,
      templateId,
      variables = {},
      priority = 5,
      scheduledFor = new Date(),
      skipAuth = false,
    } = body

    // Check authentication unless system-generated
    if (!skipAuth) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Validate required fields
    if (!recipient || !templateId) {
      return NextResponse.json(
        { success: false, message: 'Recipient and template ID required' },
        { status: 400 }
      )
    }

    // Add to queue
    const queueId = randomUUID()
    await db.insert(emailQueue).values({
      id: queueId,
      recipientEmail: recipient,
      templateId,
      variables,
      priority,
      scheduledFor: new Date(scheduledFor),
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Email queued successfully',
      data: {
        id: queueId,
        recipient,
        scheduledFor,
      },
    })
  } catch (error) {
    console.error('Error queuing email:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process queue (called by cron or manually)
export async function PUT(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid cron secret' },
        { status: 401 }
      )
    }

    // Fetch emails ready to send
    const now = new Date()
    const pendingEmails = await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          lte(emailQueue.scheduledFor, now)
        )
      )
      .limit(10) // Process 10 at a time

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No emails to process',
        processed: 0,
      })
    }

    // Process each email
    let processed = 0
    let failed = 0

    for (const email of pendingEmails) {
      try {
        // Update status to processing
        await db
          .update(emailQueue)
          .set({ status: 'processing' })
          .where(eq(emailQueue.id, email.id))

        // Call send API
        const sendResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emails/send`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: email.recipientEmail,
              templateId: email.templateId,
              templateType: email.templateId === 'welcome-email' ? 'welcome' : undefined,
              variables: email.variables || {},
              skipAuth: true,
            }),
          }
        )

        if (sendResponse.ok) {
          // Mark as sent
          await db
            .update(emailQueue)
            .set({
              status: 'sent',
              processedAt: new Date(),
            })
            .where(eq(emailQueue.id, email.id))
          processed++
        } else {
          // Mark as failed and increment attempts
          const errorData = await sendResponse.json()
          await db
            .update(emailQueue)
            .set({
              status: email.attempts >= 2 ? 'failed' : 'pending',
              attempts: email.attempts + 1,
              errorMessage: errorData.message || 'Send failed',
            })
            .where(eq(emailQueue.id, email.id))
          failed++
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error)
        // Mark as failed
        await db
          .update(emailQueue)
          .set({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            errorMessage: (error as Error).message,
          })
          .where(eq(emailQueue.id, email.id))
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} emails, ${failed} failed`,
      processed,
      failed,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}