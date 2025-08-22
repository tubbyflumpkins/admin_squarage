'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import TodoFullPage from '@/components/TodoList/TodoFullPage'
import TodoListMobile from '@/components/Mobile/Todo/TodoListMobile'

export default function TodoPage() {
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
    return <TodoListMobile />
  }

  // Desktop view - existing layout
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <TodoFullPage />
    </div>
  )
}