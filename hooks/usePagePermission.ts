'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from './usePermissions'
import type { Permission } from '@/lib/permissionKeys'

interface UsePagePermissionReturn {
  allowed: boolean
  isChecking: boolean
}

/**
 * Page-level permission guard.
 * Redirects to dashboard if the user lacks the given permission.
 */
export function usePagePermission(permission: Permission): UsePagePermissionReturn {
  const { hasPermission, isLoaded } = usePermissions()
  const router = useRouter()

  const allowed = isLoaded && hasPermission(permission)
  const denied = isLoaded && !hasPermission(permission)

  useEffect(() => {
    if (denied) {
      router.replace('/')
    }
  }, [denied, router])

  return { allowed, isChecking: !isLoaded }
}
