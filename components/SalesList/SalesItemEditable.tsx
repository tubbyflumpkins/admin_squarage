'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Sale, SaleStatus, DeliveryMethod } from '@/lib/salesTypes'
import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'
import SalesStatusDropdown from './SalesStatusDropdown'
import DeliveryMethodDropdown from './DeliveryMethodDropdown'
import ProductDropdown from './ProductDropdown'

interface SalesItemEditableProps {
  sale?: Sale
  isNew?: boolean
  onSave: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function SalesItemEditable({ sale, isNew = false, onSave, onCancel }: SalesItemEditableProps) {
  const orderRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const products = useSalesStore(state => state.products)
  
  const [formData, setFormData] = useState({
    name: sale?.name || '',
    productId: sale?.productId || undefined,
    revenue: sale?.revenue || undefined,
    status: sale?.status || 'not_started' as SaleStatus,
    placementDate: sale?.placementDate ? format(new Date(sale.placementDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    deliveryMethod: sale?.deliveryMethod || 'shipping' as DeliveryMethod,
    notes: sale?.notes || '',
  })

  // Check if sale is essentially blank (no meaningful data entered)
  const isSaleBlank = useCallback(() => {
    return !formData.name.trim()
  }, [formData])

  const handleSubmit = useCallback(() => {
    // If sale is blank, cancel instead of saving
    if (isNew && isSaleBlank()) {
      onCancel()
      return
    }
    
    // Only save if minimum required fields are filled
    if (formData.name.trim()) {
      onSave({
        ...formData,
        placementDate: new Date(formData.placementDate),
        notes: formData.notes || undefined,
        subtasks: sale?.subtasks || []
      })
    }
  }, [formData, onSave, onCancel, isNew, isSaleBlank, sale])

  useEffect(() => {
    if (isNew && orderRef.current) {
      orderRef.current.focus()
    }
  }, [isNew])

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSubmit()
      }
    }

    // Add event listener with a slight delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      // Always cancel on Escape (will auto-delete if blank)
      onCancel()
    }
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'bg-squarage-white transition-all duration-200',
        isNew && 'ring-2 ring-squarage-green'
      )}
    >
      <div className="grid grid-cols-[14px_110px_1fr_200px_80px_120px_100px_30px_32px] text-sm">
        {/* Drag handle (disabled) */}
        <div className="py-1 flex items-center justify-center text-gray-300">
          <span className="text-xs">⋮⋮</span>
        </div>

        {/* Status */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <SalesStatusDropdown
            value={formData.status}
            onChange={(status) => setFormData({ ...formData, status })}
            compact
          />
        </div>

        {/* Name */}
        <div className="px-2 py-1 flex items-center border-l border-brown-light/20">
          <input
            ref={orderRef}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Enter name..."
            className="w-full px-1 py-0.5 bg-transparent font-semibold text-squarage-black focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
            autoFocus={isNew}
          />
        </div>

        {/* Product */}
        <div className="px-2 py-1 flex items-center border-l border-brown-light/20">
          <ProductDropdown
            value={formData.productId}
            onChange={(productId) => {
              // When a product is selected, set its default revenue
              const product = productId ? products.find(p => p.id === productId) : undefined
              if (product) {
                setFormData({ ...formData, productId, revenue: product.revenue })
              } else {
                setFormData({ ...formData, productId, revenue: undefined })
              }
            }}
            compact
          />
        </div>

        {/* Revenue (display only) */}
        <div className="px-2 py-1 flex items-center justify-end border-l border-brown-light/20">
          <span className="text-sm text-gray-500">
            {formData.revenue ? `$${Math.round(formData.revenue / 100)}` : '-'}
          </span>
        </div>

        {/* Placement Date */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <input
            type="date"
            value={formData.placementDate}
            onChange={(e) => setFormData({ ...formData, placementDate: e.target.value })}
            onKeyDown={handleKeyDown}
            className="px-1 py-0.5 text-sm bg-transparent text-brown-medium focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>

        {/* Delivery Method */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <DeliveryMethodDropdown
            value={formData.deliveryMethod}
            onChange={(method) => setFormData({ ...formData, deliveryMethod: method })}
            compact
          />
        </div>

        {/* Subtask counter (empty for new) */}
        <div className="px-1 py-1 flex items-center justify-center border-l border-brown-light/20">
          <span className="text-xs text-gray-400">0</span>
        </div>

        {/* Delete (disabled for new) */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          {!isNew && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}