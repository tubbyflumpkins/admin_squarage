import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markAllAsRead } from '@/lib/notifications'

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all notifications as read
    const result = await markAllAsRead(session.user.id)

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to mark all notifications as read' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ 
      error: 'Failed to mark all notifications as read' 
    }, { status: 500 })
  }
}

// Also support POST for compatibility
export async function POST(request: Request) {
  return PUT(request)
}