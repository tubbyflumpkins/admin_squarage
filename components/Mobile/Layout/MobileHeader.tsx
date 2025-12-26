'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Home, ListTodo, TrendingUp, Receipt, Calendar, Settings, LogOut, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

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

  return (
    <header className="bg-squarage-green backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo_main_white_transparent.png"
            alt="Squarage Logo"
            width={140}
            height={47}
            className="h-10 w-auto"
            priority
          />
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
                
                {/* Dashboard Link */}
                <Link
                  href="/"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/' 
                      ? 'bg-squarage-green/10 text-squarage-green' 
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <Home size={18} className={pathname === '/' ? 'text-squarage-green' : 'text-gray-600'} />
                  <span className="font-medium">Dashboard</span>
                </Link>

                {/* Todo List Link */}
                <Link
                  href="/todo"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/todo' 
                      ? 'bg-squarage-green/10 text-squarage-green' 
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <ListTodo size={18} className={pathname === '/todo' ? 'text-squarage-green' : 'text-gray-600'} />
                  <span className="font-medium">Todo List</span>
                </Link>

                {/* Sales Tracker Link */}
                <Link
                  href="/sales"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/sales' 
                      ? 'bg-squarage-orange/10 text-squarage-orange' 
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <TrendingUp size={18} className={pathname === '/sales' ? 'text-squarage-orange' : 'text-gray-600'} />
                  <span className="font-medium">Sales Tracker</span>
                </Link>

                {/* Expenses Link */}
                <Link
                  href="/expenses"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/expenses'
                      ? 'bg-squarage-orange/10 text-squarage-orange'
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <Receipt size={18} className={pathname === '/expenses' ? 'text-squarage-orange' : 'text-gray-600'} />
                  <span className="font-medium">Expenses</span>
                </Link>

                {/* Calendar Link */}
                <Link
                  href="/calendar"
                  onClick={toggleMenu}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    pathname === '/calendar' 
                      ? 'bg-squarage-green/10 text-squarage-green' 
                      : 'hover:bg-gray-100 text-squarage-black'
                  }`}
                >
                  <Calendar size={18} className={pathname === '/calendar' ? 'text-squarage-green' : 'text-gray-600'} />
                  <span className="font-medium">Calendar</span>
                </Link>

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
