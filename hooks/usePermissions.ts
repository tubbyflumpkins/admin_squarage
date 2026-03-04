'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ALL_PERMISSIONS, ADMIN_ROLE, type Permission } from '@/lib/permissionKeys'

interface UsePermissionsReturn {
  permissions: Permission[]
  hasPermission: (key: Permission) => boolean
  isLoaded: boolean
  role: string
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const role = (session?.user as { role?: string })?.role || 'user'

  useEffect(() => {
    if (status !== 'authenticated') return

    // Admin always has all permissions — skip fetch
    if (role === ADMIN_ROLE) {
      setPermissions([...ALL_PERMISSIONS])
      setIsLoaded(true)
      return
    }

    let cancelled = false

    async function fetchPermissions() {
      try {
        const res = await fetch('/api/permissions')
        if (!res.ok) {
          // Graceful degradation: grant all on error
          setPermissions([...ALL_PERMISSIONS])
        } else {
          const data = await res.json()
          if (!cancelled) {
            setPermissions(data.permissions || [])
          }
        }
      } catch {
        // Graceful degradation
        setPermissions([...ALL_PERMISSIONS])
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    fetchPermissions()
    return () => { cancelled = true }
  }, [status, role])

  const hasPermission = (key: Permission) => {
    if (role === ADMIN_ROLE) return true
    return permissions.includes(key)
  }

  return { permissions, hasPermission, isLoaded, role }
}
