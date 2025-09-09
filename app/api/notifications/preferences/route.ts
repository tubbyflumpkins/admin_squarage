import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notificationPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
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

    // Get user preferences
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1)

    if (prefs.length === 0) {
      // Return default preferences if none exist
      return NextResponse.json({
        preferences: {
          pushEnabled: true,  // Default to true
          emailEnabled: false,
          taskCreated: true,
          taskAssigned: true,
          taskDue: true,
          statusChanged: true
        }
      })
    }

    return NextResponse.json({
      preferences: prefs[0]
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notification preferences' 
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json()
    const {
      pushEnabled = true,
      emailEnabled = false,
      taskCreated = true,
      taskAssigned = true,
      taskDue = true,
      statusChanged = true
    } = body

    // Check if preferences exist
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1)

    if (existing.length > 0) {
      // Update existing preferences
      await db
        .update(notificationPreferences)
        .set({
          pushEnabled,
          emailEnabled,
          taskCreated,
          taskAssigned,
          taskDue,
          statusChanged,
          updatedAt: new Date()
        })
        .where(eq(notificationPreferences.userId, session.user.id))
    } else {
      // Create new preferences
      await db.insert(notificationPreferences).values({
        userId: session.user.id,
        pushEnabled,
        emailEnabled,
        taskCreated,
        taskAssigned,
        taskDue,
        statusChanged,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification preferences' 
    }, { status: 500 })
  }
}