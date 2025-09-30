'use client'

import { useState, useEffect } from 'react'
import { X, Maximize2, Minimize2, Code, Download, Send, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailTemplateViewerProps {
  templateId: string
  templateName: string
  onClose: () => void
  onSendTest?: () => void
}

export default function EmailTemplateViewer({
  templateId,
  templateName,
  onClose,
  onSendTest
}: EmailTemplateViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetchPreview()
  }, [templateId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Add custom styles for email content
    const style = document.createElement('style')
    style.textContent = `
      .email-content table {
        max-width: 100% !important;
      }
      .email-content img {
        max-width: 100% !important;
        height: auto !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const fetchPreview = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/emails/preview?templateId=${templateId}&format=html`)
      if (response.ok) {
        const html = await response.text()
        // Extract just the email content from the preview wrapper
        const match = html.match(/<div class="email-container">([\s\S]*?)<\/div>\s*<\/body>/i)
        if (match && match[1]) {
          setHtmlContent(match[1])
        } else {
          setHtmlContent(html)
        }
      }
    } catch (error) {
      console.error('Error fetching preview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateId}-email-template.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        "relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40",
        "transition-all duration-300 ease-out",
        isFullscreen ? "w-full h-full m-0" : "w-full max-w-6xl h-[90vh]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{templateName}</h2>
              <p className="text-sm text-white/70">Template Preview</p>
            </div>
            <button
              className="px-3 py-1.5 bg-white/20 rounded-lg text-white/70 hover:bg-white/25 hover:text-white transition-all flex items-center gap-2"
              title="Edit Template"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">Edit (Coming Soon)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-all",
                  viewMode === 'desktop'
                    ? "bg-white/30 text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-all",
                  viewMode === 'mobile'
                    ? "bg-white/30 text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                Mobile
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowCode(!showCode)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showCode
                  ? "bg-white/30 text-white"
                  : "bg-white/20 text-white/70 hover:bg-white/25 hover:text-white"
              )}
              title="View HTML"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white/20 rounded-lg text-white/70 hover:bg-white/25 hover:text-white transition-all"
              title="Download HTML"
            >
              <Download className="h-4 w-4" />
            </button>
            {onSendTest && (
              <button
                onClick={onSendTest}
                className="p-2 bg-white/20 rounded-lg text-white/70 hover:bg-white/25 hover:text-white transition-all"
                title="Send Test Email"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/20 rounded-lg text-white/70 hover:bg-white/25 hover:text-white transition-all"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg text-white/70 hover:bg-red-500/50 hover:text-white transition-all"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex h-[calc(100%-73px)]">
          {/* Email Preview */}
          <div className={cn(
            "flex-1 overflow-hidden",
            showCode && "w-1/2"
          )}>
            <div className="h-full overflow-auto p-6 flex justify-center">
              <div className={cn(
                "transition-all duration-300",
                viewMode === 'mobile' ? "w-[375px]" : "w-full max-w-[600px]"
              )}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                      <p className="text-white mt-4">Loading preview...</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    {/* Email Client Mock Header */}
                    <div className="bg-gray-100 border-b border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">From:</span>
                        <span className="text-xs text-gray-700">hello@squarage.com</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">To:</span>
                        <span className="text-xs text-gray-700">customer@example.com</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Subject:</span>
                        <span className="text-xs text-gray-700 font-medium">
                          {templateId === 'welcome-email'
                            ? "Welcome to Squarage! Your 10% discount is inside"
                            : "Email Preview"}
                        </span>
                      </div>
                    </div>

                    {/* Email Content */}
                    <div
                      className="email-content"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      style={{
                        zoom: viewMode === 'mobile' ? '0.6' : '1',
                        transformOrigin: 'top center'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code View */}
          {showCode && (
            <div className="w-1/2 border-l border-white/20 bg-black/20 overflow-hidden">
              <div className="h-full overflow-auto p-4">
                <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all">
                  <code>{htmlContent}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}