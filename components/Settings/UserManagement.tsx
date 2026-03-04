'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, X } from 'lucide-react'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function UserManagement({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      })
      const data = await res.json()

      if (res.ok) {
        setUsers(prev => [...prev, data.user])
        setShowAddForm(false)
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setNewRole('user')
        setMessage({ type: 'success', text: 'User created successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create user' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })
      const data = await res.json()

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setMessage({ type: 'success', text: 'User deleted' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete user' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete user' })
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">User Management</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 backdrop-blur-sm bg-squarage-green/50 rounded-lg border border-squarage-green/60 text-white text-sm font-medium hover:bg-squarage-green/70 transition-all"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
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

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-squarage-white/50 rounded-lg p-4 mb-4">
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="px-3 py-2 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="px-3 py-2 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="px-3 py-2 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green"
              />
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="px-3 py-2 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green"
              >
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-squarage-green text-white rounded-lg text-sm font-medium hover:bg-squarage-green/90 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-squarage-white/50 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-center text-brown-medium text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-brown-medium text-sm">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brown-light/20">
                <th className="text-left px-4 py-2 text-brown-medium font-medium">Name</th>
                <th className="text-left px-4 py-2 text-brown-medium font-medium">Email</th>
                <th className="text-left px-4 py-2 text-brown-medium font-medium">Role</th>
                <th className="text-right px-4 py-2 text-brown-medium font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-brown-light/10">
                  <td className="px-4 py-2 text-brown-dark">{user.name}</td>
                  <td className="px-4 py-2 text-brown-dark">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-squarage-orange/20 text-squarage-orange'
                        : user.role === 'creator'
                        ? 'bg-squarage-blue/20 text-squarage-blue'
                        : 'bg-squarage-green/20 text-squarage-green'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUserId || (user.role === 'admin' && adminCount <= 1)}
                      className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={
                        user.id === currentUserId
                          ? 'Cannot delete yourself'
                          : user.role === 'admin' && adminCount <= 1
                          ? 'Cannot delete the last admin'
                          : 'Delete user'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-xs text-white/60">
        Role changes require the user to log out and log back in.
      </p>
    </div>
  )
}
