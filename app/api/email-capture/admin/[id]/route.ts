import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Subscriber ID is required' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    // Check if subscriber exists
    const existing = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      )
    }

    // Delete the subscriber
    await db
      .delete(emailSubscribers)
      .where(eq(emailSubscribers.id, id))

    return NextResponse.json({
      success: true,
      message: 'Subscriber deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting email subscriber:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}