'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import useSalesStore from '@/lib/salesStore'
import MobileLayout from '../Layout/MobileLayout'
import SalesCardMobile from './SalesCardMobile'
import { Sale, SaleStatus } from '@/lib/salesTypes'

export default function SalesListMobile() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [newSale, setNewSale] = useState<Sale | null>(null)
  const [editableSaleId, setEditableSaleId] = useState<string | null>(null)
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false)
  
  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)
  
  const { 
    sales, 
    loadFromServer, 
    addSale,
    updateSale, 
    deleteSale 
  } = useSalesStore()

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [loadFromServer])

  // Handle click outside to save/close editable cards
  useEffect(() => {
    if (!editableSaleId) return

    const handleDocumentClick = (e: MouseEvent) => {
      // Don't do anything if a dropdown is open
      if (hasOpenDropdown) {
        return
      }

      const target = e.target as HTMLElement
      
      // Check if we clicked on the editable card or any of its children
      const editableCard = document.querySelector(`[data-sale-id="${editableSaleId}"]`)
      if (editableCard && editableCard.contains(target)) {
        return // Clicked inside the card, don't save
      }
      
      // At this point, we clicked outside the card and no dropdowns are open
      // Save new sale if it exists and has a name
      if (newSale && newSale.name.trim()) {
        const { id, ...saleData } = newSale
        addSale(saleData)
      }
      
      // Clear the new sale and exit edit mode
      setNewSale(null)
      setEditableSaleId(null)
    }

    // Use a small delay to let React render first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick)
    }, 50)
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [editableSaleId, newSale, addSale, hasOpenDropdown])

  // Handle pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current
    
    if (distance > 0 && scrollContainerRef.current?.scrollTop === 0) {
      // We'll handle preventDefault via CSS touch-action instead
      setPullDistance(Math.min(distance, 100))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.current) return
    
    isPulling.current = false
    
    if (pullDistance > 60) {
      setIsRefreshing(true)
      setPullDistance(60)
      
      try {
        await loadFromServer()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  const handleAddNew = () => {
    // Create a new blank sale
    const blankSale: Sale = {
      id: `temp-${Date.now()}`,
      name: '',
      productId: '',
      revenue: 0,
      placementDate: new Date(),
      deliveryMethod: 'shipping',
      status: 'not_started',
      channelId: undefined,
      notes: '',
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setNewSale(blankSale)
    setEditableSaleId(blankSale.id)
  }

  const handleEdit = (saleId: string) => {
    if (editableSaleId === saleId) {
      // Clicking edit again should save/close
      setEditableSaleId(null)
    } else {
      setEditableSaleId(saleId)
    }
  }


  const handleSaveNew = () => {
    if (newSale && newSale.name.trim()) {
      // Remove temp ID and add to store
      const { id, ...saleData } = newSale
      addSale(saleData)
      setNewSale(null)
      setEditableSaleId(null)
    }
  }

  const handleDelete = (saleId: string) => {
    // If it's the new sale being deleted, just remove it
    if (newSale && newSale.id === saleId) {
      setNewSale(null)
      setEditableSaleId(null)
      return
    }
    
    if (confirm('Are you sure you want to delete this sale?')) {
      deleteSale(saleId)
      if (editableSaleId === saleId) {
        setEditableSaleId(null)
      }
    }
  }

  const handleToggleStatus = (saleId: string, status: SaleStatus) => {
    if (newSale && newSale.id === saleId) {
      setNewSale({ ...newSale, status })
    } else {
      const sale = sales.find(s => s.id === saleId)
      if (sale) {
        updateSale(saleId, { ...sale, status })
      }
    }
  }

  const handleUpdateNewSale = (updates: Partial<Sale>) => {
    if (newSale) {
      setNewSale({ ...newSale, ...updates })
    }
  }

  // Sort sales: active first, then by placement date
  const sortedSales = [...sales].sort((a, b) => {
    // Status priority
    const statusOrder = { not_started: 0, in_progress: 1, fulfilled: 2, dead: 3 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff
    
    // Then by date (newest first)
    return new Date(b.placementDate).getTime() - new Date(a.placementDate).getTime()
  })

  // Combine new sale with existing sales
  const displaySales = newSale ? [newSale, ...sortedSales] : sortedSales

  const fulfilledRevenue = sales
    .filter(s => s.status === 'fulfilled')
    .reduce((sum, s) => sum + (s.revenue || 0), 0)

  const pipelineRevenue = sales
    .filter(s => s.status === 'not_started' || s.status === 'in_progress')
    .reduce((sum, s) => sum + (s.revenue || 0), 0)

  if (!isHydrated) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading sales...</div>
            <div className="text-white/70 text-sm">Please wait</div>
          </div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="relative h-full overflow-hidden">
        {/* Pull to refresh indicator */}
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center transition-all duration-200 z-10"
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            opacity: pullDistance > 20 ? 1 : 0
          }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <RefreshCw 
              size={20} 
              className={`text-white ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto px-4 pt-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isPulling.current ? 'none' : 'transform 0.2s',
            touchAction: pullDistance > 0 ? 'none' : 'auto'
          }}
        >
          {/* Stats Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">Revenue</p>
                <p className="text-white text-xl font-bold">
                  ${(fulfilledRevenue / 100).toLocaleString()}
                </p>
                <p className="text-white/50 text-xs">
                  Pipeline: ${(pipelineRevenue / 100).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleAddNew}
                className="p-2 rounded-lg bg-white hover:bg-white/90 transition-colors"
                disabled={!!newSale}
              >
                <Plus size={20} className="text-squarage-green" />
              </button>
            </div>
          </div>

          {/* Sales List */}
          <div className="space-y-2 pb-4">
            {displaySales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/70 mb-4">No sales yet</p>
                <button 
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-white rounded-lg text-squarage-green font-medium"
                >
                  Add Your First Sale
                </button>
              </div>
            ) : (
              displaySales.map((sale) => (
                <SalesCardMobile
                  key={sale.id}
                  sale={sale}
                  onEdit={() => handleEdit(sale.id)}
                  onDelete={() => handleDelete(sale.id)}
                  onToggleStatus={(status) => handleToggleStatus(sale.id, status)}
                  isEditable={editableSaleId === sale.id}
                  isNew={newSale?.id === sale.id}
                  onSave={handleSaveNew}
                  onUpdateNewSale={newSale?.id === sale.id ? handleUpdateNewSale : undefined}
                  onDropdownStateChange={setHasOpenDropdown}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}
