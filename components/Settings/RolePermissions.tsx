'use client'

import { useState, useEffect } from 'react'
import { Shield, Save, Settings, Plus, Trash2 } from 'lucide-react'
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

// Roles that can't be deleted (always exist)
const PROTECTED_ROLES = new Set(['admin', 'user', 'creator'])

export default function RolePermissions() {
  const [roles, setRoles] = useState<Record<string, string[]>>({})
  const [roleNames, setRoleNames] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showManageRoles, setShowManageRoles] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  async function fetchRoles() {
    try {
      const res = await fetch('/api/admin/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
        setRoleNames(data.roleNames || Object.keys(data.roles))
        // Auto-select first non-admin role if nothing selected
        if (!selectedRole) {
          const nonAdmin = (data.roleNames || Object.keys(data.roles)).filter((r: string) => r !== ADMIN_ROLE)
          if (nonAdmin.length > 0) setSelectedRole(nonAdmin[0])
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load roles' })
    } finally {
      setIsLoading(false)
    }
  }

  function handleAddRole() {
    const name = newRoleName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name || roleNames.includes(name)) return
    setRoleNames(prev => [...prev, name])
    setRoles(prev => ({ ...prev, [name]: [] }))
    setSelectedRole(name)
    setNewRoleName('')
  }

  function handleDeleteRole(role: string) {
    if (PROTECTED_ROLES.has(role)) return
    setRoleNames(prev => prev.filter(r => r !== role))
    setRoles(prev => {
      const next = { ...prev }
      delete next[role]
      return next
    })
    if (selectedRole === role) {
      const remaining = roleNames.filter(r => r !== role && r !== ADMIN_ROLE)
      setSelectedRole(remaining[0] || '')
    }
    // Save empty permissions to remove from DB
    fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permissions: [] }),
    })
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
        setMessage({ type: 'success', text: `Permissions for "${selectedRole}" saved.` })
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
            {/* Role dropdown + manage button */}
            <div className="flex items-end gap-2 mb-5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-brown-medium mb-1.5 uppercase tracking-wide">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={e => { setSelectedRole(e.target.value); setMessage(null) }}
                  className="w-full px-3 py-2.5 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
                >
                  {roleNames.map(role => (
                    <option key={role} value={role}>
                      {role}{role === ADMIN_ROLE ? ' (full access)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowManageRoles(!showManageRoles)}
                className={`p-2.5 rounded-lg border transition-all ${
                  showManageRoles
                    ? 'bg-squarage-green text-white border-squarage-green'
                    : 'bg-white/60 text-brown-dark border-brown-light/30 hover:bg-white/90'
                }`}
                title="Manage roles"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Manage Roles Panel */}
            {showManageRoles && (
              <div className="mb-5 p-3 bg-white/40 rounded-lg border border-brown-light/20">
                <h3 className="text-xs font-medium text-brown-medium uppercase tracking-wide mb-2">Manage Roles</h3>
                <div className="space-y-1.5 mb-3">
                  {roleNames.map(role => (
                    <div key={role} className="flex items-center justify-between px-2 py-1.5 rounded">
                      <span className="text-sm text-brown-dark">
                        {role}
                        {PROTECTED_ROLES.has(role) && (
                          <span className="ml-1.5 text-xs text-brown-medium">(built-in)</span>
                        )}
                      </span>
                      {!PROTECTED_ROLES.has(role) && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddRole() }}
                    placeholder="New role name"
                    className="flex-1 px-3 py-1.5 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green"
                  />
                  <button
                    onClick={handleAddRole}
                    disabled={!newRoleName.trim()}
                    className="px-3 py-1.5 bg-squarage-green text-white rounded-lg text-sm font-medium hover:bg-squarage-green/90 disabled:opacity-40 transition-all flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Permission Toggles */}
            {selectedRole && (
              <>
                <div className="space-y-1">
                  {ALL_PERMISSIONS.map(permission => {
                    const enabled = isAdmin || currentPermissions.includes(permission)
                    return (
                      <div
                        key={permission}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <span className="text-sm text-brown-dark font-medium">
                          {PERMISSION_LABELS[permission]}
                        </span>
                        <button
                          onClick={() => togglePermission(permission)}
                          disabled={isAdmin}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            enabled ? 'bg-squarage-green' : 'bg-gray-300'
                          } ${isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
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
                      className="flex items-center gap-2 px-5 py-2.5 bg-squarage-green text-white rounded-lg text-sm font-semibold hover:bg-squarage-green/90 disabled:opacity-50 transition-all"
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
          </>
        )}
      </div>
    </div>
  )
}
