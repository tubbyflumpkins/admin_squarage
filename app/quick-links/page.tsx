'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/UI/Header'
import QuickLinksGrid from '@/components/QuickLinks/QuickLinksGrid'

export default function QuickLinksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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

  if (status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Quick Links</h1>
          <p className="text-white/80 mt-2">Manage your frequently accessed links and resources</p>
        </div>

        {/* Glass container */}
        <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <QuickLinksGrid />
        </div>
      </main>
    </div>
  )
}