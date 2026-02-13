import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'

// GET - Fetch all notes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ notes: [] })
    }

    const allNotes = await db.select().from(notes).orderBy(desc(notes.updatedAt))

    return NextResponse.json({
      notes: allNotes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ notes: [] })
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { id, title, content } = body

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date()
    await db.insert(notes).values({
      id,
      title,
      content: content || '',
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

// PUT - Update an existing note (efficient single-note save)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { id, title, content } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    await db.update(notes).set(updates).where(eq(notes.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 })
    }

    await db.delete(notes).where(eq(notes.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
