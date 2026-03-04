'use client'

import { useState, useEffect } from 'react'
import { Shield, Save } from 'lucide-react'
import { ALL_PERMISSIONS, ADMIN_ROLE, type Permission } from '@/lib/permissionKeys'

const PERMISSION_LABELS: Record<Permission, string> = {
  'todo': 'Todo List',
  'sales': 'Sales Tracker',
  'calendar': 'Calendar',
  'notes': 'Notes',
  'quick-links': 'Quick Links',
  'expenses': 'Expenses',
  'email': 'Email',
}

export default function RolePermissions() {
  const [roles, setRoles] = useState<Record<string, string[]>>({})
  const [selectedRole, setSelectedRole] = useState('user')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  async function fetchRoles() {
    try {
      const res = await fetch('/api/admin/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
        // Select first non-admin role
        const nonAdminRoles = Object.keys(data.roles).filter(r => r !== ADMIN_ROLE)
        if (nonAdminRoles.length > 0 && !nonAdminRoles.includes(selectedRole)) {
          setSelectedRole(nonAdminRoles[0])
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load roles' })
    } finally {
      setIsLoading(false)
    }
  }

  function togglePermission(permission: Permission) {
    if (selectedRole === ADMIN_ROLE) return
    setRoles(prev => {
      const current = prev[selectedRole] || []
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission]
      return { ...prev, [selectedRole]: updated }
    })
  }

  async function handleSave() {
    if (selectedRole === ADMIN_ROLE) return
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, permissions: roles[selectedRole] || [] }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Permissions saved. Changes take effect within ~60 seconds.' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save permissions' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save permissions' })
    } finally {
      setIsSaving(false)
    }
  }

  const roleNames = Object.keys(roles)
  const currentPermissions = roles[selectedRole] || []
  const isAdmin = selectedRole === ADMIN_ROLE

  return (
    <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-white" />
        <h2 className="text-xl font-semibold text-white">Role Permissions</h2>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500/50 text-green-700'
            : 'bg-red-500/20 border border-red-500/50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-squarage-white/50 rounded-lg p-4">
        {isLoading ? (
          <div className="text-center text-brown-medium text-sm py-4">Loading roles...</div>
        ) : (
          <>
            {/* Role Tabs */}
            <div className="flex gap-2 mb-4">
              {roleNames.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-squarage-green text-white'
                      : 'bg-white/50 text-brown-dark hover:bg-white/80'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Permission Toggles */}
            <div className="space-y-2">
              {ALL_PERMISSIONS.map(permission => {
                const enabled = isAdmin || currentPermissions.includes(permission)
                return (
                  <div
                    key={permission}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <span className="text-sm text-brown-dark font-medium">
                      {PERMISSION_LABELS[permission]}
                    </span>
                    <button
                      onClick={() => togglePermission(permission)}
                      disabled={isAdmin}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        enabled ? 'bg-squarage-green' : 'bg-gray-300'
                      } ${isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Save Button */}
            {!isAdmin && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-squarage-green text-white rounded-lg text-sm font-medium hover:bg-squarage-green/90 disabled:opacity-50 transition-all"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            )}
            {isAdmin && (
              <p className="mt-3 text-xs text-brown-medium">Admin role always has full access.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
