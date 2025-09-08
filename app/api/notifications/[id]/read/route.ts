import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markAsRead } from '@/lib/notifications'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    // Mark notification as read
    const result = await markAsRead(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to mark notification as read' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read'
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ 
      error: 'Failed to mark notification as read' 
    }, { status: 500 })
  }
}

// Also support POST for compatibility
export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  return PUT(request, context)
}