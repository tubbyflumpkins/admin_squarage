import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// GET - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.createdAt)

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new template
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
      subject,
      htmlContent,
      reactComponent,
      variables = {},
      category = 'marketing',
      isActive = true,
    } = body

    // Validate required fields
    if (!name || !subject) {
      return NextResponse.json(
        { success: false, message: 'Name and subject are required' },
        { status: 400 }
      )
    }

    // Create template
    const templateId = randomUUID()
    const now = new Date()

    await db.insert(emailTemplates).values({
      id: templateId,
      name,
      subject,
      htmlContent,
      reactComponent,
      variables,
      category,
      isActive,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      data: {
        id: templateId,
        name,
      },
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update template
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
        { success: false, message: 'Template ID required' },
        { status: 400 }
      )
    }

    // Update template
    await db
      .update(emailTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Template ID required' },
        { status: 400 }
      )
    }

    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id))

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}