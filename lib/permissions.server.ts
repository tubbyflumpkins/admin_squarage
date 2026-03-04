import { db } from '@/lib/db'
import { rolePermissions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ADMIN_ROLE, ALL_PERMISSIONS, type Permission } from '@/lib/permissionKeys'

// In-memory cache: role -> { permissions, expiresAt }
const cache = new Map<string, { permissions: Permission[]; expiresAt: number }>()
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Returns the permissions for a given role.
 * Admin always gets all permissions (hardcoded bypass).
 * Results are cached for 60s per Vercel function instance.
 * If DB is unavailable, grants all permissions (graceful degradation).
 */
export async function getPermissionsForRole(role: string): Promise<Permission[]> {
  if (role === ADMIN_ROLE) {
    return [...ALL_PERMISSIONS]
  }

  // Check cache
  const cached = cache.get(role)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.permissions
  }

  // Query DB
  if (!db) {
    return [...ALL_PERMISSIONS] // graceful degradation
  }

  try {
    const rows = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role))

    const permissions = rows.map(r => r.permission) as Permission[]

    // Cache result
    cache.set(role, { permissions, expiresAt: Date.now() + CACHE_TTL_MS })

    return permissions
  } catch (error) {
    console.error('[permissions] Error fetching permissions for role:', role, error)
    return [...ALL_PERMISSIONS] // graceful degradation
  }
}

/**
 * Clears the permission cache for a specific role, or all roles if none specified.
 */
export function invalidatePermissionCache(role?: string) {
  if (role) {
    cache.delete(role)
  } else {
    cache.clear()
  }
}
