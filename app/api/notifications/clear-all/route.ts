import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if database is configured
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Delete all notifications for the user
    await db
      .delete(notifications)
      .where(eq(notifications.userId, session.user.id))

    return NextResponse.json({ 
      success: true, 
      message: 'All notifications cleared'
    })
  } catch (error) {
    console.error('Error clearing all notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to clear all notifications' 
    }, { status: 500 })
  }
}

// Also support POST for compatibility
export async function POST(request: Request) {
  return DELETE(request)
}