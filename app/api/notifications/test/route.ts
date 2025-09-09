import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a test notification
    const result = await createNotification({
      userId: session.user.id,
      type: 'task_assigned',
      title: '🔔 Test Notification',
      message: 'This is a test notification from Squarage Admin Dashboard. If you see this, push notifications are working!',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    })

    if (!result || (typeof result === 'object' && !result.success)) {
      return NextResponse.json({ 
        error: 'Failed to create test notification',
        details: typeof result === 'object' ? result.error : 'Database not configured'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent',
      notificationId: typeof result === 'object' ? result.notificationId : undefined
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification' 
    }, { status: 500 })
  }
}