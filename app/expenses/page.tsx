'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { usePagePermission } from '@/hooks/usePagePermission'
import Header from '@/components/UI/Header'
import ExpenseFullPage from '@/components/ExpensesList/ExpenseFullPage'
import ExpensesListMobile from '@/components/Mobile/Expenses/ExpensesListMobile'

export default function ExpensesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { allowed, isChecking } = usePagePermission('expenses')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen bg-squarage-green flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session || !allowed) {
    return null
  }

  if (isMobile) {
    return <ExpensesListMobile />
  }

  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <ExpenseFullPage />
    </div>
  )
}
