import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    // Check if database is configured
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Delete subscription
    const result = await db
      .delete(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, endpoint)
      ))

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed'
    })
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to unsubscribe from push notifications' 
    }, { status: 500 })
  }
}

// Also support POST for compatibility
export async function POST(request: Request) {
  return DELETE(request)
}