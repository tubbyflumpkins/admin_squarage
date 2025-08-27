'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import CalendarFullPage from '@/components/Calendar/CalendarFullPage'
import CalendarMobile from '@/components/Mobile/Calendar/CalendarMobile'

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()

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

  if (status === 'unauthenticated') {
    return null
  }

  // Mobile view - no header needed as MobileLayout has its own
  if (isMobile) {
    return <CalendarMobile />
  }

  // Desktop view
  return (
    <div className="h-screen bg-squarage-green flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <CalendarFullPage />
      </div>
    </div>
  )
}