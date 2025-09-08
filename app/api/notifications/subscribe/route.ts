import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Check if database is configured
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1)

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          lastUsed: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription updated',
        subscriptionId: existing[0].id
      })
    }

    // Create new subscription
    const subscriptionId = uuidv4()
    await db.insert(pushSubscriptions).values({
      id: subscriptionId,
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: request.headers.get('user-agent') || undefined,
      createdAt: new Date(),
      lastUsed: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription created',
      subscriptionId
    })
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to subscribe to push notifications' 
    }, { status: 500 })
  }
}