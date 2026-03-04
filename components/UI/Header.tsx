'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import UserAvatar from '@/components/UI/UserAvatar'
import AnimatedLogo, { hasAnimatedThisPageLoad } from '@/components/UI/AnimatedLogo'
import { usePermissions } from '@/hooks/usePermissions'
import { NAV_LINKS } from '@/lib/permissionKeys'

export default function Header() {
  const { hasPermission } = usePermissions()
  const [adminVisible, setAdminVisible] = useState(hasAnimatedThisPageLoad)

  const handleLogoComplete = useCallback(() => {
    setAdminVisible(true)
  }, [])

  return (
    <header className="bg-squarage-green border-b-4 border-squarage-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-end gap-2 cursor-pointer">
            <AnimatedLogo className="h-[28px]" instanceId="header" onAnimationComplete={handleLogoComplete} />
            <span
              className="text-white font-black text-[39px] leading-none transition-opacity duration-500"
              style={{ opacity: adminVisible ? 1 : 0, marginBottom: '-0.18em', fontFamily: 'var(--font-neue-haas)' }}
            >
              Admin
            </span>
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
