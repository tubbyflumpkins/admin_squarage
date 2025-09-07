'use client'

import { useState } from 'react'
import { ExternalLink, Trash2, GripVertical, Edit2 } from 'lucide-react'
import { QuickLink } from '@/lib/quickLinksTypes'
import QuickLinkItemEditable from './QuickLinkItemEditable'
import Image from 'next/image'

interface QuickLinkItemProps {
  quickLink: QuickLink
  onUpdate?: (id: string, updates: Partial<QuickLink>) => void
  onDelete?: (id: string) => void
  onEdit?: (quickLink: QuickLink) => void
  isDragging?: boolean
  isReadOnly?: boolean
  isCompact?: boolean
  dragListeners?: any
}

export default function QuickLinkItem({
  quickLink,
  onUpdate,
  onDelete,
  onEdit,
  isDragging = false,
  isReadOnly = false,
  isCompact = false,
  dragListeners,
}: QuickLinkItemProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleOpenLink = () => {
    window.open(quickLink.url, '_blank', 'noopener,noreferrer')
  }

  if (isCompact) {
    // Compact view for widget
    return (
      <div
        onClick={handleOpenLink}
        className="flex flex-col items-center p-3 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-105 transition-all duration-200 cursor-pointer group"
      >
        <div className="w-10 h-10 mb-2 relative">
          {quickLink.faviconUrl && !imageError ? (
            <Image
              src={quickLink.faviconUrl}
              alt={quickLink.name}
              width={40}
              height={40}
              className="rounded"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-10 h-10 bg-white/30 rounded flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-squarage-black/60" />
            </div>
          )}
        </div>
        <span className="text-xs text-center text-squarage-black font-medium line-clamp-2">
          {quickLink.name}
        </span>
      </div>
    )
  }

  // Full view for management page
  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg
        ${isDragging 
          ? 'opacity-50 bg-white/40' 
          : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
        }
        transition-all duration-200 group
      `}
    >
      {!isReadOnly && (
        <div 
          className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragListeners}
        >
          <GripVertical className="w-5 h-5 text-squarage-black/60" />
        </div>
      )}

      <div className="w-12 h-12 flex-shrink-0 relative">
        {quickLink.faviconUrl && !imageError ? (
          <Image
            src={quickLink.faviconUrl}
            alt={quickLink.name}
            width={48}
            height={48}
            className="rounded"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 bg-white/30 rounded flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-squarage-black/60" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isEditingName && !isReadOnly ? (
          <QuickLinkItemEditable
            value={quickLink.name}
            onSave={(value) => {
              onUpdate?.(quickLink.id, { name: value })
              setIsEditingName(false)
            }}
            onCancel={() => setIsEditingName(false)}
            className="mb-1"
            placeholder="Link name"
          />
        ) : (
          <div
            className="font-medium text-squarage-black mb-1 cursor-pointer"
            onDoubleClick={() => !isReadOnly && setIsEditingName(true)}
          >
            {quickLink.name}
          </div>
        )}

        {isEditingUrl && !isReadOnly ? (
          <QuickLinkItemEditable
            value={quickLink.url}
            onSave={(value) => {
              onUpdate?.(quickLink.id, { url: value })
              setIsEditingUrl(false)
            }}
            onCancel={() => setIsEditingUrl(false)}
            placeholder="https://example.com"
          />
        ) : (
          <div
            className="text-sm text-squarage-black/70 truncate cursor-pointer"
            onDoubleClick={() => !isReadOnly && setIsEditingUrl(true)}
          >
            {quickLink.url}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isReadOnly && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(quickLink)
              }}
              className="p-2 rounded hover:bg-white/20 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-squarage-black/80" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(quickLink.id)
              }}
              className="p-2 rounded hover:bg-squarage-red/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-squarage-black/80 hover:text-squarage-red" />
            </button>
          </>
        )}
        <button
          onClick={handleOpenLink}
          className="p-2 rounded hover:bg-white/20 transition-colors"
          title="Open link"
        >
          <ExternalLink className="w-4 h-4 text-squarage-black/80" />
        </button>
      </div>
    </div>
  )
}