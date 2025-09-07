'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import TodoWidget from '@/components/TodoList/TodoWidget'
import SalesWidget from '@/components/SalesList/SalesWidget'
import CalendarWidget from '@/components/Calendar/CalendarWidget'
import QuickLinksWidget from '@/components/QuickLinks/QuickLinksWidget'
import MobileLayout from '@/components/Mobile/Layout/MobileLayout'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  // Show loading state while checking authentication
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

  // Redirect if not authenticated
  if (status === 'unauthenticated' || !session) {
    return null
  }

  // Mobile dashboard view
  if (isMobile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome
            </h1>
            <p className="text-xl text-white/80">
              Squarage Administrator
            </p>
          </div>
        </div>
      </MobileLayout>
    )
  }

  // Desktop view - existing layout
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Widgets grid - ready for future widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* READ-ONLY widget that cannot modify database */}
          <TodoWidget />
          <SalesWidget />
          <CalendarWidget />
          <QuickLinksWidget />
        </div>
      </main>
    </div>
  )
}