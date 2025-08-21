'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useSalesStore from '@/lib/salesStore'
import SalesStatusDropdown from './SalesStatusDropdown'
import DeliveryMethodDropdown from './DeliveryMethodDropdown'
import ProductDropdown from './ProductDropdown'
import SaleSubtaskList from './SaleSubtaskList'
import type { Sale, SaleStatus } from '@/lib/salesTypes'
import { cn, hexToPastel } from '@/lib/utils'

interface SalesItemProps {
  sale: Sale
  onEdit: (sale: Sale) => void
  onDelete: (id: string) => void
  isGlassView?: boolean
}

export default function SalesItem({ sale, onEdit, onDelete, isGlassView = false }: SalesItemProps) {
  const [editingOrder, setEditingOrder] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState(false)
  const [orderValue, setOrderValue] = useState(sale.name)
  const [dateValue, setDateValue] = useState(format(sale.placementDate, 'yyyy-MM-dd'))
  const [revenueValue, setRevenueValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const orderInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const revenueInputRef = useRef<HTMLInputElement>(null)
  
  const updateSale = useSalesStore(state => state.updateSale)
  const products = useSalesStore(state => state.products)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sale.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const currentStatus = sale.status

  // Calculate subtask completion
  const completedSubtasks = sale.subtasks?.filter(st => st.completed).length || 0
  const totalSubtasks = sale.subtasks?.length || 0

  // Status colors for background - matching Todo List priority colors approach
  const statusColors = {
    not_started: '#F87171', // Red-400
    in_progress: '#F5B74C', // squarage-yellow
    fulfilled: '#4A9B4E', // squarage-green
    dead: '#6B7280', // Gray-500
  }

  // Get pastel background color based on status
  const statusBgColor = hexToPastel(statusColors[currentStatus])

  const handleStatusChange = (newStatus: SaleStatus) => {
    updateSale(sale.id, { status: newStatus })
  }

  const handleDeliveryMethodChange = (newMethod: 'shipping' | 'local') => {
    updateSale(sale.id, { deliveryMethod: newMethod })
  }

  const handleOrderClick = () => {
    if (!editingOrder) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleOrderDoubleClick = () => {
    setEditingOrder(true)
    setOrderValue(sale.name)
  }

  const handleOrderSave = () => {
    if (orderValue.trim() && orderValue !== sale.name) {
      updateSale(sale.id, { name: orderValue.trim() })
    } else {
      setOrderValue(sale.name)
    }
    setEditingOrder(false)
  }

  const handleOrderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleOrderSave()
    } else if (e.key === 'Escape') {
      setOrderValue(sale.name)
      setEditingOrder(false)
    }
  }

  const handleDateDoubleClick = () => {
    setEditingDate(true)
    setDateValue(format(sale.placementDate, 'yyyy-MM-dd'))
  }

  const handleDateSave = () => {
    const newDate = new Date(dateValue)
    if (!isNaN(newDate.getTime())) {
      updateSale(sale.id, { placementDate: newDate })
    } else {
      setDateValue(format(sale.placementDate, 'yyyy-MM-dd'))
    }
    setEditingDate(false)
  }

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleDateSave()
    } else if (e.key === 'Escape') {
      setDateValue(format(sale.placementDate, 'yyyy-MM-dd'))
      setEditingDate(false)
    }
  }

  const handleRevenueDoubleClick = () => {
    // Get current revenue - either from sale or from product
    const currentRevenue = sale.revenue || 
      (sale.productId ? products.find(p => p.id === sale.productId)?.revenue : undefined)
    
    setRevenueValue(currentRevenue ? String(Math.round(currentRevenue / 100)) : '')
    setEditingRevenue(true)
  }

  const handleRevenueSave = () => {
    const newRevenue = parseFloat(revenueValue)
    if (!isNaN(newRevenue) && newRevenue >= 0) {
      // Save revenue in cents
      updateSale(sale.id, { revenue: Math.round(newRevenue * 100) })
    }
    setEditingRevenue(false)
  }

  const handleRevenueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRevenueSave()
    } else if (e.key === 'Escape') {
      setEditingRevenue(false)
    }
  }

  useEffect(() => {
    if (editingOrder && orderInputRef.current) {
      orderInputRef.current.focus()
      orderInputRef.current.select()
    }
  }, [editingOrder])

  useEffect(() => {
    if (editingDate && dateInputRef.current) {
      dateInputRef.current.focus()
    }
  }, [editingDate])

  useEffect(() => {
    if (editingRevenue && revenueInputRef.current) {
      revenueInputRef.current.focus()
      revenueInputRef.current.select()
    }
  }, [editingRevenue])

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          backgroundColor: currentStatus === 'fulfilled' ? undefined : 
                          currentStatus === 'dead' ? undefined : 
                          statusBgColor
        }}
        className={cn(
          'transition-all duration-200 relative',
          isDragging && 'opacity-50 shadow-lg',
          currentStatus === 'fulfilled' && 'bg-green-200/80',
          currentStatus === 'dead' && 'bg-red-200/80'
        )}
      >
        <div className="grid grid-cols-[14px_110px_1fr_200px_80px_120px_100px_30px_32px] text-sm relative">
          {/* Strike-through line for dead sales only */}
          {currentStatus === 'dead' && (
            <div 
              className={cn(
                "absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 pointer-events-none z-10",
                'bg-red-700'
              )}
            />
          )}
          
          {/* Drag handle */}
          <div className="py-1 flex items-center justify-center">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab hover:text-squarage-green transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} />
            </button>
          </div>

          {/* Status */}
          <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
            <SalesStatusDropdown
              value={currentStatus}
              onChange={handleStatusChange}
              compact
            />
          </div>

          {/* Name - Click to expand, Double-click to edit */}
          <div 
            className={cn(
              'px-2 py-1 flex items-center border-l border-brown-light/20 font-semibold cursor-pointer',
              currentStatus === 'fulfilled' && 'text-green-900',
              currentStatus === 'dead' && 'text-red-900',
              (currentStatus === 'not_started' || currentStatus === 'in_progress') && 'text-squarage-black'
            )}
            onClick={handleOrderClick}
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleOrderDoubleClick()
            }}
          >
            {editingOrder ? (
              <input
                ref={orderInputRef}
                type="text"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                onBlur={handleOrderSave}
                onKeyDown={handleOrderKeyDown}
                className="w-full px-1 py-0.5 bg-white border rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-squarage-green"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="w-full">{sale.name}</span>
            )}
          </div>

          {/* Product */}
          <div className="px-2 py-1 flex items-center border-l border-brown-light/20">
            <ProductDropdown
              value={sale.productId}
              onChange={(productId) => {
                // When a product is selected, set its default revenue
                const product = productId ? products.find(p => p.id === productId) : undefined
                if (product) {
                  // Always set the product's default revenue when selecting
                  updateSale(sale.id, { productId, revenue: product.revenue })
                } else {
                  // Clear revenue when no product is selected
                  updateSale(sale.id, { productId, revenue: undefined })
                }
              }}
              compact
            />
          </div>

          {/* Revenue - Double-click to edit */}
          <div 
            className="px-2 py-1 flex items-center justify-end border-l border-brown-light/20 cursor-text"
            onDoubleClick={handleRevenueDoubleClick}
          >
            {editingRevenue ? (
              <div className="flex items-center gap-1">
                <span className="text-sm">$</span>
                <input
                  ref={revenueInputRef}
                  type="number"
                  value={revenueValue}
                  onChange={(e) => setRevenueValue(e.target.value)}
                  onBlur={handleRevenueSave}
                  onKeyDown={handleRevenueKeyDown}
                  className="w-20 px-1 py-0.5 bg-white border rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-squarage-green"
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <span className={cn(
                "text-sm font-medium",
                currentStatus === 'fulfilled' && 'text-green-900',
                currentStatus === 'dead' && 'text-red-900'
              )}>
                {(() => {
                  // Use sale's revenue if it exists, otherwise use product's revenue
                  const revenue = sale.revenue || 
                    (sale.productId ? products.find(p => p.id === sale.productId)?.revenue : undefined)
                  
                  return revenue ? `$${Math.round(revenue / 100)}` : '-'
                })()}
              </span>
            )}
          </div>

          {/* Placement Date - Double-click to edit */}
          <div 
            className="px-2 py-1 flex items-center justify-center text-sm text-brown-medium border-l border-brown-light/20 cursor-text"
            onDoubleClick={handleDateDoubleClick}
          >
            {editingDate ? (
              <input
                ref={dateInputRef}
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                onBlur={handleDateSave}
                onKeyDown={handleDateKeyDown}
                className="px-1 py-0.5 bg-white border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
              />
            ) : (
              <span className={cn(
                currentStatus === 'fulfilled' && 'text-green-900',
                currentStatus === 'dead' && 'text-red-900'
              )}>
                {format(sale.placementDate, 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Delivery Method */}
          <div className={cn(
            "px-2 py-1 flex items-center justify-center border-l border-brown-light/20",
            currentStatus === 'fulfilled' && '[&_button]:!bg-green-600 [&_button]:opacity-80',
            currentStatus === 'dead' && '[&_button]:!bg-red-600 [&_button]:opacity-80'
          )}>
            <DeliveryMethodDropdown
              value={sale.deliveryMethod}
              onChange={handleDeliveryMethodChange}
              compact
            />
          </div>

          {/* Subtask counter */}
          <div className="px-1 py-1 flex items-center justify-center border-l border-brown-light/20">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-600 hover:text-squarage-green transition-colors font-medium"
            >
              {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '0'}
            </button>
          </div>

          {/* Delete */}
          <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
            <button
              onClick={() => onDelete(sale.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Section for Subtasks and Notes */}
      {isExpanded && (
        <SaleSubtaskList
          sale={sale}
          backgroundColor={statusBgColor}
        />
      )}
    </>
  )
}