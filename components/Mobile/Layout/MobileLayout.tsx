'use client'

import { ReactNode } from 'react'
import MobileHeader from './MobileHeader'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-squarage-green to-squarage-green/90 relative">
      {/* Fixed header that won't move */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MobileHeader />
      </div>
      
      {/* Main content area with padding to account for fixed header */}
      <main className="h-screen pt-[60px]">
        {children}
      </main>
    </div>
  )
}