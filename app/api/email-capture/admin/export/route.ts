import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailSubscribers } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  // Escape fields that contain commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    // Get all subscribers
    const subscribers = await db
      .select()
      .from(emailSubscribers)
      .orderBy(desc(emailSubscribers.createdAt))

    // Create CSV content
    const headers = [
      'Email',
      'Marketing Consent',
      'Source',
      'Discount Code',
      'IP Address',
      'User Agent',
      'Consent Timestamp',
      'Created At',
      'Updated At'
    ]

    const csvRows = [
      headers.join(','),
      ...subscribers.map(sub => [
        escapeCsvField(sub.email),
        escapeCsvField(sub.consentMarketing),
        escapeCsvField(sub.source),
        escapeCsvField(sub.discountCode),
        escapeCsvField(sub.ipAddress),
        escapeCsvField(sub.userAgent),
        escapeCsvField(sub.consentTimestamp ? new Date(sub.consentTimestamp).toISOString() : ''),
        escapeCsvField(new Date(sub.createdAt).toISOString()),
        escapeCsvField(new Date(sub.updatedAt).toISOString())
      ].join(','))
    ]

    const csv = csvRows.join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `email-subscribers-${timestamp}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('Error exporting email subscribers:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}