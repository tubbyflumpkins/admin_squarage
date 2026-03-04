import { NextResponse } from 'next/server'
import { requireAdmin, getDb } from '@/lib/api/helpers'
import { rolePermissions, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ADMIN_ROLE, ALL_PERMISSIONS, type Permission } from '@/lib/permissionKeys'
import { invalidatePermissionCache } from '@/lib/permissions.server'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json({ roles: {}, roleNames: ['admin', 'user', 'creator'] })
  }

  const [permRows, userRows] = await Promise.all([
    db.select().from(rolePermissions),
    db.select({ role: users.role }).from(users),
  ])

  // Group permissions by role
  const roles: Record<string, string[]> = {}
  for (const row of permRows) {
    if (!roles[row.role]) roles[row.role] = []
    roles[row.role].push(row.permission)
  }

  // Collect all role names from: permission table, users table, and hardcoded defaults
  const roleNameSet = new Set<string>(['admin', 'user', 'creator'])
  for (const key of Object.keys(roles)) roleNameSet.add(key)
  for (const row of userRows) roleNameSet.add(row.role)

  // Ensure every role has an entry (empty array if no permissions set)
  for (const name of roleNameSet) {
    if (!roles[name]) roles[name] = name === 'user' ? [...ALL_PERMISSIONS] : []
  }
  roles[ADMIN_ROLE] = [...ALL_PERMISSIONS]

  // Sorted role names: admin first, then alphabetical
  const roleNames = [ADMIN_ROLE, ...([...roleNameSet].filter(r => r !== ADMIN_ROLE).sort())]

  return NextResponse.json({ roles, roleNames })
}

export async function POST(request: Request) {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const { role, permissions } = await request.json() as { role: string; permissions: Permission[] }

  if (!role || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Block changes to admin role
  if (role === ADMIN_ROLE) {
    return NextResponse.json({ error: 'Cannot modify admin permissions' }, { status: 400 })
  }

  // Delete existing permissions for this role, then insert new ones
  await db.delete(rolePermissions).where(eq(rolePermissions.role, role))

  if (permissions.length > 0) {
    const records = permissions.map(permission => ({
      id: uuidv4(),
      role,
      permission,
    }))
    await db.insert(rolePermissions).values(records)
  }

  // Invalidate cache for this role
  invalidatePermissionCache(role)

  return NextResponse.json({ success: true, role, permissions })
}
