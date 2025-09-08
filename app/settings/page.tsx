'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import MobileLayout from '@/components/Mobile/Layout/MobileLayout'
import NotificationSettings from '@/components/Notifications/NotificationSettings'
import { User, Lock, Save, Eye, EyeOff, Check, X, LogOut, Bell } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-squarage-green flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const content = (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* User Info Section */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">User Information</h2>
          </div>
          {/* Logout Button */}
          <button
            onClick={() => {
              // Clear service worker cache on mobile before logout
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
              }
              signOut()
            }}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-red-600/40 rounded-xl border border-red-600/50 text-white font-medium hover:bg-red-600/50 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
        <div className="bg-squarage-white/50 rounded-lg p-4">
          <div className="space-y-2 text-brown-dark">
            <p><span className="text-brown-medium">Name:</span> {session.user?.name}</p>
            <p><span className="text-brown-medium">Email:</span> {session.user?.email}</p>
            <p><span className="text-brown-medium">Role:</span> {session.user?.role || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Change Password</h2>
        </div>

        <div className="bg-squarage-white/50 rounded-lg p-4">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
                  placeholder="Enter current password"
                  required
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  ) : (
                    <Eye className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  ) : (
                    <Eye className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border border-brown-light/30 rounded-lg text-brown-dark placeholder-brown-light focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  ) : (
                    <Eye className="h-5 w-5 text-brown-medium hover:text-brown-dark" />
                  )}
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-700' 
                  : 'bg-red-500/20 border border-red-500/50 text-red-700'
              }`}>
                {message.type === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-squarage-green text-white font-semibold py-3 px-6 rounded-lg hover:bg-squarage-green/90 focus:outline-none focus:ring-2 focus:ring-squarage-green focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Changing...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Notification Settings Section */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
        </div>
        
        <NotificationSettings />
      </div>
    </div>
  )

  // Mobile view
  if (isMobile) {
    return (
      <MobileLayout>
        {content}
      </MobileLayout>
    )
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      {content}
    </div>
  )
}