import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get unread count for user
    const count = await getUnreadCount(session.user.id)

    return NextResponse.json({
      count,
      userId: session.user.id
    })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch unread count' 
    }, { status: 500 })
  }
}