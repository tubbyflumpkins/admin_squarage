'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Download, Mail, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailSubscriber {
  id: string
  email: string
  source: string
  discountCode: string | null
  consentMarketing: boolean
  consentTimestamp: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
}

interface SubscriberStats {
  total: number
  newThisWeek: number
  consentRate: number
}

export default function DatabaseTab() {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([])
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    newThisWeek: 0,
    consentRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/email-capture/admin/list')
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers')
      }
      const data = await response.json()

      if (data.success && data.data) {
        setSubscribers(data.data)
        calculateStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (subs: EmailSubscriber[]) => {
    const total = subs.length

    // Calculate new this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newThisWeek = subs.filter(sub =>
      new Date(sub.createdAt) >= oneWeekAgo
    ).length

    // Calculate consent rate
    const consentCount = subs.filter(sub => sub.consentMarketing).length
    const consentRate = total > 0 ? Math.round((consentCount / total) * 100) : 0

    setStats({
      total,
      newThisWeek,
      consentRate
    })
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const response = await fetch(`/api/email-capture/admin/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the list
        await fetchSubscribers()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/email-capture/admin/export')
      if (!response.ok) {
        throw new Error('Failed to export')
      }

      // Get the filename from headers or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'email-subscribers.csv'

      // Download the CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4">Loading subscribers...</p>
      </div>
    )
  }

  return (
    <>
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Subscribers */}
        <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* New This Week */}
        <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">New This Week</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.newThisWeek}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Consent Rate */}
        <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Consent Rate</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.consentRate}%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Glass container for table - matching todo/sales design */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        {/* Header with export button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-white" />
            <h2 className="text-xl font-bold text-white">All Subscribers</h2>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl
                     border border-white/60 text-squarage-black font-medium hover:bg-white/65
                     hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all
                     duration-200 transform shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table Headers - matching todo/sales style */}
        <div className="bg-squarage-white/60 rounded-t-lg border border-brown-light/30">
          <div className="grid grid-cols-[2fr_120px_120px_150px_100px] text-xs font-medium text-brown-medium uppercase tracking-wider">
            <div className="px-3 py-1.5">Email</div>
            <div className="px-3 py-1.5 border-l border-brown-light/20">Source</div>
            <div className="px-3 py-1.5 border-l border-brown-light/20 text-center">Consent</div>
            <div className="px-3 py-1.5 border-l border-brown-light/20">Date</div>
            <div className="px-3 py-1.5 border-l border-brown-light/20 text-center">Actions</div>
          </div>
        </div>

        {/* Table Body - matching todo/sales style */}
        <div className="bg-squarage-white/50 rounded-b-lg border border-t-0 border-brown-light/30 overflow-hidden">
          {subscribers.length === 0 ? (
            <div className="px-6 py-12 text-center text-squarage-black/60">
              No subscribers yet
            </div>
          ) : (
            <div className="divide-y divide-brown-light/20">
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="grid grid-cols-[2fr_120px_120px_150px_100px] items-center hover:bg-white/40 transition-colors"
                >
                  <div className="px-3 py-1">
                    <div className="text-sm font-medium text-squarage-black">
                      {subscriber.email}
                    </div>
                    {subscriber.discountCode && (
                      <span className="text-xs text-squarage-black/60 ml-2">
                        [{subscriber.discountCode}]
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-1 border-l border-brown-light/20">
                    <div className="text-sm text-squarage-black capitalize">
                      {subscriber.source}
                    </div>
                  </div>
                  <div className="px-3 py-1 border-l border-brown-light/20 text-center">
                    <div className={cn(
                      "text-lg font-bold",
                      subscriber.consentMarketing ? "text-green-500" : "text-red-500"
                    )}>
                      {subscriber.consentMarketing ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="px-3 py-1 border-l border-brown-light/20">
                    <div className="text-sm text-squarage-black">
                      {format(new Date(subscriber.createdAt), 'MMM d')}
                      <span className="text-xs text-squarage-black/60 ml-1">
                        {format(new Date(subscriber.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 border-l border-brown-light/20 flex justify-center">
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-all",
                        deleteConfirm === subscriber.id
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-white/60 text-squarage-black hover:bg-white/80"
                      )}
                    >
                      <Trash2 className="h-3 w-3 mr-0.5" />
                      {deleteConfirm === subscriber.id ? 'Confirm' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}