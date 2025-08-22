'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import TodoFullPage from '@/components/TodoList/TodoFullPage'
import TodoListMobile from '@/components/Mobile/Todo/TodoListMobile'

export default function TodoPage() {
  const isMobile = useIsMobile()

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