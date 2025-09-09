'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function UserAvatar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get user initial from first name
  const getUserInitial = () => {
    if (!session?.user?.name) return 'U'
    return session.user.name.charAt(0).toUpperCase()
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!session?.user) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-squarage-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white font-semibold hover:bg-squarage-white/30 transition-all duration-200 hover:scale-105"
        aria-label="User menu"
      >
        {getUserInitial()}
      </button>

      {/* Dropdown Menu with Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-50 transform transition-all duration-200 scale-100 animate-fadeIn">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-squarage-green/90 flex items-center justify-center text-white font-semibold">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brown-dark truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-brown-medium truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-brown-dark hover:bg-white/30 transition-colors duration-200"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => {
                // Clear service worker cache on mobile before logout
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
                }
                setIsOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-brown-dark hover:bg-red-500/20 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}