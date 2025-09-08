'use client'

import Image from 'next/image'
import Link from 'next/link'
import NotificationBell from '@/components/Notifications/NotificationBell'
import UserAvatar from '@/components/UI/UserAvatar'

export default function Header() {

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
          <nav className="flex items-center space-x-6">
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
              href="/quick-links" 
              className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
            >
              Quick Links
            </Link>
            <div className="flex items-center space-x-3 ml-2">
              <UserAvatar />
              <NotificationBell />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}