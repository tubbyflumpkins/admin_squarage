'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AnimatedLogo, { hasAnimatedThisPageLoad } from '@/components/UI/AnimatedLogo'
import { Menu, X, Home, ListTodo, TrendingUp, Receipt, Calendar, Settings, LogOut, StickyNote, Link2, Mail } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/lib/permissionKeys'
import type { LucideIcon } from 'lucide-react'

interface MobileNavLink {
  href: string
  label: string
  icon: LucideIcon
  permission: Permission | null
  activeColor: string
}

const MOBILE_NAV_LINKS: MobileNavLink[] = [
  { href: '/', label: 'Dashboard', icon: Home, permission: null, activeColor: 'squarage-green' },
  { href: '/todo', label: 'Todo List', icon: ListTodo, permission: 'todo', activeColor: 'squarage-green' },
  { href: '/sales', label: 'Sales Tracker', icon: TrendingUp, permission: 'sales', activeColor: 'squarage-orange' },
  { href: '/expenses', label: 'Expenses', icon: Receipt, permission: 'expenses', activeColor: 'squarage-orange' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, permission: 'calendar', activeColor: 'squarage-green' },
  { href: '/notes', label: 'Notes', icon: StickyNote, permission: 'notes', activeColor: 'squarage-green' },
  { href: '/quick-links', label: 'Quick Links', icon: Link2, permission: 'quick-links', activeColor: 'squarage-green' },
  { href: '/email', label: 'Email', icon: Mail, permission: 'email', activeColor: 'squarage-green' },
]

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [adminVisible, setAdminVisible] = useState(hasAnimatedThisPageLoad)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()

  const handleLogoComplete = useCallback(() => {
    setAdminVisible(true)
  }, [])

  // Handle menu open/close with animation
  const toggleMenu = () => {
    if (isMenuOpen) {
      setIsAnimating(false)
      setTimeout(() => setIsMenuOpen(false), 300)
    } else {
      setIsMenuOpen(true)
      setTimeout(() => setIsAnimating(true), 10)
    }
  }

  // Close menu when route changes
  useEffect(() => {
    setIsAnimating(false)
    setTimeout(() => setIsMenuOpen(false), 300)
  }, [pathname])

  const visibleLinks = MOBILE_NAV_LINKS.filter(
    link => !link.permission || hasPermission(link.permission)
  )

  return (
    <header className="bg-squarage-green backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-end gap-1.5">
          <AnimatedLogo className="h-[22px]" instanceId="mobile-header" onAnimationComplete={handleLogoComplete} />
          <span
            className="text-white font-black text-[30px] leading-none transition-opacity duration-500"
            style={{ opacity: adminVisible ? 1 : 0, marginBottom: '-0.14em', fontFamily: 'var(--font-neue-haas)' }}
          >
            Admin
          </span>
        </Link>

        {/* Menu Button */}
        <button
          onClick={toggleMenu}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="relative w-5 h-5">
            <Menu
              size={20}
              className={`text-white absolute transition-all duration-300 ${
                isMenuOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'
              }`}
            />
            <X
              size={20}
              className={`text-white absolute transition-all duration-300 ${
                isMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 transition-opacity duration-300 z-40 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={toggleMenu}
          />

          {/* Menu content - cream colored card with animation */}
          <div
            className={`absolute top-full left-0 right-0 mt-2 mx-4 overflow-hidden rounded-xl transition-all duration-300 ease-out z-50 ${
              isAnimating
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}
          >
            <div className="bg-squarage-white shadow-xl">
              <div className="py-2">
                {/* User Info */}
                {session && (
                  <>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-squarage-green flex items-center justify-center text-white font-semibold">
                        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-squarage-black truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                    {/* Divider */}
                    <div className="mx-4 mb-2 border-t border-gray-200" />
                  </>
                )}

                {/* Nav Links */}
                {visibleLinks.map(link => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={toggleMenu}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                        isActive
                          ? `bg-${link.activeColor}/10 text-${link.activeColor}`
                          : 'hover:bg-gray-100 text-squarage-black'
                      }`}
                    >
                      <Icon size={18} className={isActive ? `text-${link.activeColor}` : 'text-gray-600'} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  )
                })}

                {/* Divider */}
                <div className="mx-4 my-2 border-t border-gray-200" />

                {/* Settings Link */}
                <Link
                  href="/settings"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/settings'
                      ? 'bg-squarage-green/10 text-squarage-green'
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <Settings size={18} className={pathname === '/settings' ? 'text-squarage-green' : 'text-gray-600'} />
                  <span className="font-medium">Settings</span>
                </Link>

                {/* Logout Button */}
                {session && (
                  <button
                    onClick={() => {
                      // Clear service worker cache before logout
                      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
                      }
                      signOut()
                      toggleMenu()
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-100 text-squarage-black"
                  >
                    <LogOut size={18} className="text-gray-600" />
                    <span className="font-medium">Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
