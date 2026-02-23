import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markAsRead } from '@/lib/notifications'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const result = await markAsRead(id, session.user.id)

    if (!result || (typeof result === 'object' && !result.success)) {
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
}
