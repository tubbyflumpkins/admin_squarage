'use client'

import { useEffect, useState } from 'react'
import useQuickLinksStore from '@/lib/quickLinksStore'
import QuickLinkItem from './QuickLinkItem'
import { ExternalLink } from 'lucide-react'

interface QuickLinksGridReadOnlyProps {
  isWidget?: boolean
  maxItems?: number
}

export default function QuickLinksGridReadOnly({
  isWidget = false,
  maxItems = 8,
}: QuickLinksGridReadOnlyProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const { quickLinks, loadFromServer, getFilteredQuickLinks } = useQuickLinksStore()

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [loadFromServer])

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-squarage-black/60"></div>
      </div>
    )
  }

  const displayLinks = getFilteredQuickLinks().slice(0, maxItems)

  if (displayLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-squarage-black/60">
        <ExternalLink className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No quick links added yet</p>
        {isWidget && (
          <p className="text-xs mt-1">Click to add links</p>
        )}
      </div>
    )
  }

  return (
    <div className={`grid ${isWidget ? 'grid-cols-4' : 'grid-cols-6'} gap-3`}>
      {displayLinks.map((quickLink) => (
        <QuickLinkItem
          key={quickLink.id}
          quickLink={quickLink}
          isReadOnly={true}
          isCompact={true}
        />
      ))}
    </div>
  )
}