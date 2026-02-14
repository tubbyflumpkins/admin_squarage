import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, desc, or, isNull } from 'drizzle-orm'

// GET - Fetch notes for the current user (+ optionally a shared note by ID)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json({ notes: [], sharedNote: null })
    }

    const userId = (session.user as { id?: string })?.id

    // Fetch notes belonging to this user OR notes without a userId (legacy)
    const userNotes = userId
      ? await db.select().from(notes)
          .where(or(eq(notes.userId, userId), isNull(notes.userId)))
          .orderBy(desc(notes.updatedAt))
      : await db.select().from(notes)
          .where(isNull(notes.userId))
          .orderBy(desc(notes.updatedAt))

    // If a specific noteId is requested (deep link), fetch that note too
    const { searchParams } = new URL(request.url)
    const sharedNoteId = searchParams.get('noteId')
    let sharedNote = null

    if (sharedNoteId) {
      // Check if the shared note is already in the user's notes
      const alreadyIncluded = userNotes.some(n => n.id === sharedNoteId)
      if (!alreadyIncluded) {
        const result = await db.select().from(notes).where(eq(notes.id, sharedNoteId)).limit(1)
        if (result.length > 0) {
          const n = result[0]
          sharedNote = {
            id: n.id,
            userId: n.userId,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
          }
        }
      }
    }

    return NextResponse.json({
      notes: userNotes.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      sharedNote,
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ notes: [], sharedNote: null })
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
    const userId = (session.user as { id?: string })?.id

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date()
    await db.insert(notes).values({
      id,
      userId: userId || null,
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

// PUT - Update an existing note
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

// DELETE - Delete a note (only own notes)
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
