import { NextResponse } from 'next/server'
import { requireAdmin, getDb } from '@/lib/api/helpers'
import { rolePermissions, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ADMIN_ROLE, ALL_PERMISSIONS, DEFAULT_ROLES, type Permission } from '@/lib/permissionKeys'
import { invalidatePermissionCache } from '@/lib/permissions.server'
import { v4 as uuidv4 } from 'uuid'

function buildDefaultResponse() {
  const roles: Record<string, string[]> = {
    admin: [...ALL_PERMISSIONS],
    user: [...ALL_PERMISSIONS],
    creator: [],
  }
  return { roles, roleNames: [...DEFAULT_ROLES] }
}

export async function GET() {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result

  const db = getDb()
  if (!db) {
    return NextResponse.json(buildDefaultResponse())
  }

  // Query both tables, but handle errors gracefully (table may not exist yet)
  let permRows: { role: string; permission: string }[] = []
  let userRows: { role: string }[] = []

  try {
    ;[permRows, userRows] = await Promise.all([
      db.select({ role: rolePermissions.role, permission: rolePermissions.permission }).from(rolePermissions),
      db.select({ role: users.role }).from(users),
    ])
  } catch (error) {
    // role_permissions table may not exist yet — fall back to defaults + user roles
    console.warn('[admin/roles] DB query failed, using defaults:', error)
    try {
      userRows = await db.select({ role: users.role }).from(users)
    } catch {
      // users table also failed — return pure defaults
      return NextResponse.json(buildDefaultResponse())
    }
  }

  // Group permissions by role
  const roles: Record<string, string[]> = {}
  for (const row of permRows) {
    if (!roles[row.role]) roles[row.role] = []
    roles[row.role].push(row.permission)
  }

  // Collect all role names from: permission table, users table, and built-in defaults
  const roleNameSet = new Set<string>(DEFAULT_ROLES)
  for (const key of Object.keys(roles)) roleNameSet.add(key)
  for (const row of userRows) roleNameSet.add(row.role)

  // Ensure every role has an entry
  for (const name of roleNameSet) {
    if (!roles[name]) roles[name] = name === 'user' ? [...ALL_PERMISSIONS] : []
  }
  roles[ADMIN_ROLE] = [...ALL_PERMISSIONS]

  // Sorted: admin first, then alphabetical
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

  if (role === ADMIN_ROLE) {
    return NextResponse.json({ error: 'Cannot modify admin permissions' }, { status: 400 })
  }

  try {
    await db.delete(rolePermissions).where(eq(rolePermissions.role, role))

    if (permissions.length > 0) {
      const records = permissions.map(permission => ({
        id: uuidv4(),
        role,
        permission,
      }))
      await db.insert(rolePermissions).values(records)
    }

    invalidatePermissionCache(role)
    return NextResponse.json({ success: true, role, permissions })
  } catch (error) {
    console.error('[admin/roles] Error saving permissions:', error)
    return NextResponse.json({ error: 'Failed to save. The role_permissions table may need to be created (run drizzle-kit push).' }, { status: 500 })
  }
}
