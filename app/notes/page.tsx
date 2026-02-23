'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import NotesFullPage from '@/components/Notes/NotesFullPage'

export default function NotesPage() {
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

  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      <Suspense>
        <NotesFullPage />
      </Suspense>
    </div>
  )
}
