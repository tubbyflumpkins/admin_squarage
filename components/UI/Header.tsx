'use client'

import Image from 'next/image'
import Link from 'next/link'
import UserAvatar from '@/components/UI/UserAvatar'
import { usePermissions } from '@/hooks/usePermissions'
import { NAV_LINKS } from '@/lib/permissionKeys'

export default function Header() {
  const { hasPermission } = usePermissions()

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
            {NAV_LINKS.filter(link => !link.permission || hasPermission(link.permission)).map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-squarage-white hover:text-squarage-yellow transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center space-x-3 ml-2">
              <UserAvatar />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
