import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailCampaigns } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET - Fetch all campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .orderBy(emailCampaigns.createdAt)

    return NextResponse.json({
      success: true,
      data: campaigns,
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      templateId,
      scheduledAt,
      segmentRules = {},
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Campaign name is required' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    // Create campaign
    const campaignId = randomUUID()
    const now = new Date()

    await db.insert(emailCampaigns).values({
      id: campaignId,
      name,
      templateId,
      status: 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      recipientCount: 0,
      segmentRules,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        id: campaignId,
        name,
      },
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Campaign ID required' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      )
    }

    // Update campaign
    await db
      .update(emailCampaigns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, id))

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}