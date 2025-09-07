'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { QuickLink } from '@/lib/quickLinksTypes'
import Button from '@/components/UI/Button'

interface AddQuickLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quickLink: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex'>) => void
  editingQuickLink?: QuickLink | null
}

export default function AddQuickLinkModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingQuickLink 
}: AddQuickLinkModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    faviconUrl: '',
  })

  useEffect(() => {
    if (editingQuickLink) {
      setFormData({
        name: editingQuickLink.name,
        url: editingQuickLink.url,
        faviconUrl: editingQuickLink.faviconUrl || '',
      })
    } else {
      setFormData({
        name: '',
        url: '',
        faviconUrl: '',
      })
    }
  }, [editingQuickLink, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.url.trim()) {
      return
    }

    // Ensure URL has protocol
    let finalUrl = formData.url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    onSave({
      name: formData.name.trim(),
      url: finalUrl,
      faviconUrl: formData.faviconUrl.trim() || null,
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-squarage-green/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">
            {editingQuickLink ? 'Edit Quick Link' : 'Add Quick Link'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:border-white/50"
              placeholder="e.g., Google Analytics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              URL
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:border-white/50"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Favicon URL (Optional)
            </label>
            <input
              type="text"
              value={formData.faviconUrl}
              onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
              className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:border-white/50"
              placeholder="Leave empty to auto-detect"
            />
            <p className="text-xs text-white/60 mt-1">
              If left empty, the favicon will be automatically fetched from the website
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingQuickLink ? 'Save Changes' : 'Add Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}