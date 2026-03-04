import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/helpers'
import { getPermissionsForRole } from '@/lib/permissions.server'
import { ALL_PERMISSIONS, ADMIN_ROLE } from '@/lib/permissionKeys'

export async function GET() {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result

  const role = result.user.role || 'user'

  if (role === ADMIN_ROLE) {
    return NextResponse.json({ role, permissions: [...ALL_PERMISSIONS] })
  }

  const permissions = await getPermissionsForRole(role)
  return NextResponse.json({ role, permissions })
}
