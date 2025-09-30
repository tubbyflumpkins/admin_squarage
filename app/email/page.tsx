'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/UI/Header'
import DatabaseTab from '@/components/Email/DatabaseTab'
import EmailsTab from '@/components/Email/EmailsTab'
import { cn } from '@/lib/utils'
import { Database, Mail } from 'lucide-react'

type TabType = 'database' | 'emails'

export default function EmailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('database')

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Email Management</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('database')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
              "transform hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5",
              activeTab === 'database'
                ? "backdrop-blur-md bg-white/50 text-squarage-black shadow-lg border border-white/60"
                : "backdrop-blur-md bg-white/20 text-white hover:bg-white/30 border border-white/30"
            )}
          >
            <Database className="h-4 w-4" />
            <span>Database</span>
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
              "transform hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5",
              activeTab === 'emails'
                ? "backdrop-blur-md bg-white/50 text-squarage-black shadow-lg border border-white/60"
                : "backdrop-blur-md bg-white/20 text-white hover:bg-white/30 border border-white/30"
            )}
          >
            <Mail className="h-4 w-4" />
            <span>Emails</span>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'emails' && <EmailsTab />}
        </div>
      </div>
    </div>
  )
}