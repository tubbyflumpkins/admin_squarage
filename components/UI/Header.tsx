'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-squarage-green border-b-4 border-squarage-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center cursor-pointer">
            <Image
              src="/images/logo_main_white_transparent.png"
              alt="Squarage Logo"
              width={180}
              height={60}
              className="h-12 w-auto cursor-pointer"
              priority
            />
          </Link>
          <nav className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/todo" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Todo List
            </Link>
            <Link 
              href="/sales" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Sales Tracker
            </Link>
            <Link 
              href="/calendar" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Calendar
            </Link>
            <Link 
              href="/settings" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Settings
            </Link>
            
            {/* Logout button only */}
            {session && (
              <div className="ml-8 pl-8 border-l border-white/20">
                <button
                  onClick={() => {
                    // Clear service worker cache on mobile before logout
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
                    }
                    signOut()
                  }}
                  className="flex items-center space-x-2 text-squarage-white/80 hover:text-squarage-yellow transition-colors duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}