import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { emailSubscribers } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and email permission
    const auth = await requirePermission('email')
    if (auth instanceof NextResponse) return auth

    // Optional query parameters for pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    // Get total count
    const allSubscribers = await db
      .select()
      .from(emailSubscribers)
    const total = allSubscribers.length

    // Get paginated results
    const subscribers = await db
      .select()
      .from(emailSubscribers)
      .orderBy(desc(emailSubscribers.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching email subscribers:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}