'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Send, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  Edit2, Trash2, Eye, Users, Mail, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import EmailTemplateViewer from './EmailTemplateViewer'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EmailCampaign {
  id: string
  name: string
  templateId: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduledAt: string | null
  sentAt: string | null
  recipientCount: number
  createdAt: string
  updatedAt: string
}

interface QueuedEmail {
  id: string
  recipientEmail: string
  templateId: string
  status: 'pending' | 'processing' | 'sent' | 'failed'
  scheduledFor: string
  attempts: number
  errorMessage: string | null
  createdAt: string
}

export default function EmailsTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [sendTestEmail, setSendTestEmail] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    fetchEmailData()
  }, [])

  const fetchEmailData = async () => {
    try {
      // Fetch templates
      const templatesRes = await fetch('/api/emails/templates')
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.data || [])
      }

      // Fetch campaigns
      const campaignsRes = await fetch('/api/emails/campaigns')
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData.data || [])
      }

      // Fetch queued emails
      const queueRes = await fetch('/api/emails/queue')
      if (queueRes.ok) {
        const queueData = await queueRes.json()
        setQueuedEmails(queueData.data || [])
      }
    } catch (error) {
      console.error('Error fetching email data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmailAddress) return

    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateType: selectedTemplate.id === 'welcome-email' ? 'welcome' : undefined,
          recipient: testEmailAddress,
          variables: selectedTemplate.id === 'welcome-email'
            ? { discountCode: 'TEST-CODE-10', customerEmail: testEmailAddress }
            : {},
          isTest: true
        })
      })

      if (response.ok) {
        alert('Test email sent successfully!')
        setTestEmailAddress('')
        setSendTestEmail(false)
      } else {
        alert('Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('Error sending test email')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'scheduled':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'sending':
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <Mail className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'failed':
      case 'bounced':
        return 'bg-red-100 text-red-800'
      case 'scheduled':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sending':
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="text-white mt-4">Loading email system...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowNewTemplate(true)}
          className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6
                   hover:bg-white/45 transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-white/80 text-sm font-medium">Create Template</p>
              <p className="text-2xl font-bold text-white mt-1">New Email</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </div>
        </button>

        <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Active Templates</p>
              <p className="text-2xl font-bold text-white mt-1">{templates.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Queued Emails</p>
              <p className="text-2xl font-bold text-white mt-1">
                {queuedEmails.filter(e => e.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Email Templates Section */}
      <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Email Templates
          </h2>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-white/50 mx-auto mb-3" />
            <p className="text-white/70">No email templates yet</p>
            <p className="text-white/50 text-sm mt-1">Templates will appear here once created</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/20 rounded-xl p-4 border border-white/30 hover:bg-white/30 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    template.isActive
                      ? "bg-green-500/20 text-green-100"
                      : "bg-gray-500/20 text-gray-100"
                  )}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-white/70 text-sm mb-3">{template.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 capitalize">{template.category}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setSendTestEmail(true)
                      }}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title="Send Test"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Queue Monitor */}
      <div className="backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Email Queue
          </h2>
          <button
            onClick={fetchEmailData}
            className="text-white/70 hover:text-white text-sm flex items-center gap-1"
          >
            Refresh
          </button>
        </div>

        {queuedEmails.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-white/50 mx-auto mb-3" />
            <p className="text-white/70">No emails in queue</p>
            <p className="text-white/50 text-sm mt-1">All emails have been processed</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queuedEmails.slice(0, 5).map((email) => (
              <div
                key={email.id}
                className="bg-white/20 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(email.status)}
                  <div>
                    <p className="text-white text-sm font-medium">{email.recipientEmail}</p>
                    <p className="text-white/50 text-xs">
                      Scheduled: {format(new Date(email.scheduledFor), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getStatusColor(email.status)
                )}>
                  {email.status}
                </span>
              </div>
            ))}
            {queuedEmails.length > 5 && (
              <p className="text-center text-white/50 text-sm pt-2">
                And {queuedEmails.length - 5} more...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Test Email Modal */}
      {sendTestEmail && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-squarage-black mb-4">Send Test Email</h3>
            <p className="text-squarage-black/70 mb-4">
              Testing: <strong>{selectedTemplate.name}</strong>
            </p>
            <input
              type="email"
              placeholder="Enter test email address"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-squarage-green"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSendTestEmail(false)
                  setTestEmailAddress('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                className="px-4 py-2 bg-squarage-green text-white rounded-lg hover:bg-squarage-green/90"
              >
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Viewer */}
      {previewTemplate && (
        <EmailTemplateViewer
          templateId={previewTemplate.id}
          templateName={previewTemplate.name}
          onClose={() => setPreviewTemplate(null)}
          onSendTest={() => {
            setSelectedTemplate(previewTemplate)
            setSendTestEmail(true)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}