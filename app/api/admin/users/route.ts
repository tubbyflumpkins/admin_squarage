import { NextResponse } from 'next/server'
import { requireAdmin, getDb } from '@/lib/api/helpers'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json({ users: [] })
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)

  return NextResponse.json({ users: allUsers })
}

export async function POST(request: Request) {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { name, email, password, role } = await request.json() as {
    name: string
    email: string
    password: string
    role: string
  }

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role,
  }

  await db.insert(users).values(newUser)

  return NextResponse.json({
    user: { id: newUser.id, name, email, role, createdAt: new Date() },
  })
}

export async function DELETE(request: Request) {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { id } = await request.json() as { id: string }

  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  }

  // Cannot delete self
  if (id === result.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Check if this is the last admin
  const targetUser = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (targetUser.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (targetUser[0].role === 'admin') {
    const adminCount = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))

    if (adminCount.length <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 })
    }
  }

  await db.delete(users).where(eq(users.id, id))

  return NextResponse.json({ success: true })
}
