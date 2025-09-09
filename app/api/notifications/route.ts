import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserNotifications } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get notifications for user
    const notifications = await getUserNotifications(session.user.id, limit, offset)

    return NextResponse.json({
      notifications,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 })
  }
}