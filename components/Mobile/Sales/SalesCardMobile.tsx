'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Trash2, Edit2 } from 'lucide-react'
import { Sale, SaleStatus } from '@/lib/salesTypes'
import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'
import { format } from 'date-fns'

interface SalesCardMobileProps {
  sale: Sale
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (status: SaleStatus) => void
  isEditable?: boolean
  onSave?: () => void
  isNew?: boolean
  onUpdateNewSale?: (updates: Partial<Sale>) => void
  onDropdownStateChange?: (isOpen: boolean) => void
}

export default function SalesCardMobile({ 
  sale, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isEditable = false,
  onSave,
  isNew = false,
  onUpdateNewSale,
  onDropdownStateChange
}: SalesCardMobileProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesValue, setNotesValue] = useState(sale.notes || '')
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [nameValue, setNameValue] = useState(sale.name || '')
  const [isEditingName, setIsEditingName] = useState(isNew)
  const [showProductMenu, setShowProductMenu] = useState(false)
  const [showDeliveryMenu, setShowDeliveryMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [hasSelectedStatus, setHasSelectedStatus] = useState(!isNew)
  const { products, collections, updateSale, addSaleSubtask, toggleSaleSubtask, updateSaleNotes } = useSalesStore()
  
  const product = products.find(p => p.id === sale.productId)
  const collection = product ? collections.find(c => c.id === product.collectionId) : null

  // Track if any dropdown is open
  useEffect(() => {
    const isAnyDropdownOpen = showMenu || showStatusMenu || showProductMenu || showDeliveryMenu || showDatePicker
    if (onDropdownStateChange) {
      onDropdownStateChange(isAnyDropdownOpen)
    }
  }, [showMenu, showStatusMenu, showProductMenu, showDeliveryMenu, showDatePicker, onDropdownStateChange])

  const statusColors = {
    not_started: 'bg-gray-500',
    in_progress: 'bg-yellow-500',
    fulfilled: 'bg-green-500',
    dead: 'bg-red-500'
  }

  const statusBgColors = {
    not_started: '#F5F5F5',
    in_progress: '#FFF4E0',
    fulfilled: '#E8F5E8',
    dead: '#FFE5E5'
  }

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    fulfilled: 'Fulfilled',
    dead: 'Dead'
  }

  const deliveryLabels = {
    shipping: '📦 Ship',
    local: '🚚 Local'
  }

  const handleStatusChange = (newStatus: SaleStatus) => {
    if (isNew && onUpdateNewSale) {
      onUpdateNewSale({ status: newStatus })
    } else {
      onToggleStatus(newStatus)
    }
    setShowStatusMenu(false)
    setHasSelectedStatus(true)
  }

  const handleNotesBlur = () => {
    if (notesValue !== sale.notes) {
      updateSaleNotes(sale.id, notesValue)
    }
  }

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      addSaleSubtask(sale.id, newSubtaskText.trim())
      setNewSubtaskText('')
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') || 
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return
    }
    setIsExpanded(!isExpanded)
  }

  const handleNameSave = () => {
    if (nameValue.trim()) {
      if (isNew && onUpdateNewSale) {
        onUpdateNewSale({ name: nameValue.trim() })
      } else {
        updateSale(sale.id, { ...sale, name: nameValue.trim() })
      }
      setIsEditingName(false)
      if (isNew && onSave) {
        onSave()
      }
    }
  }


  const completedSubtasks = sale.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = sale.subtasks?.length || 0

  return (
    <div 
      data-sale-id={sale.id}
      className={cn(
        "sale-card rounded-xl shadow-sm overflow-visible transition-all relative",
        (sale.status === 'fulfilled' || sale.status === 'dead') && !isEditable && "opacity-75",
        isEditable && "ring-2 ring-white ring-opacity-80 shadow-xl shadow-white/40 animate-glow-white"
      )}
      style={{
        backgroundColor: (sale.status === 'fulfilled' || sale.status === 'dead') && !isEditable
          ? '#ffffff' 
          : isNew ? '#ffffff' : statusBgColors[sale.status]
      }}
    >
      {/* Main Card Content */}
      <div className="p-3 cursor-pointer" onClick={handleCardClick}>
        {/* Top Row: Status, Delivery Method, Date, and Menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Status */}
            <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStatusMenu(!showStatusMenu)
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer",
                isNew && !hasSelectedStatus ? "bg-gray-300 text-gray-600" : `${statusColors[sale.status]} text-white`,
                isEditable && "ring-1 ring-white/50"
              )}
            >
              {isNew && !hasSelectedStatus ? 'Status' : statusLabels[sale.status]}
            </button>
            
            {showStatusMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStatusMenu(false)
                  }}
                />
                <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[140px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('not_started')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      sale.status === 'not_started' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Not Started
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('in_progress')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      sale.status === 'in_progress' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    In Progress
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('fulfilled')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      sale.status === 'fulfilled' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Fulfilled
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('dead')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      sale.status === 'dead' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Dead
                  </button>
                </div>
              </>
            )}
            </div>
            
            {/* Delivery Method */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditable) {
                    setShowDeliveryMenu(!showDeliveryMenu)
                  }
                }}
                className={cn(
                  "text-xs",
                  isNew && !sale.deliveryMethod ? "text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded" : "text-gray-600",
                  isEditable && "cursor-pointer"
                )}
              >
                {deliveryLabels[sale.deliveryMethod] || 'Delivery'}
              </button>
              
              {showDeliveryMenu && isEditable && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeliveryMenu(false)
                    }}
                  />
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[100px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isNew && onUpdateNewSale) {
                          onUpdateNewSale({ deliveryMethod: 'shipping' })
                        } else {
                          updateSale(sale.id, { ...sale, deliveryMethod: 'shipping' })
                        }
                        setShowDeliveryMenu(false)
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                        sale.deliveryMethod === 'shipping' && "bg-gray-100"
                      )}
                    >
                      📦 Ship
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isNew && onUpdateNewSale) {
                          onUpdateNewSale({ deliveryMethod: 'local' })
                        } else {
                          updateSale(sale.id, { ...sale, deliveryMethod: 'local' })
                        }
                        setShowDeliveryMenu(false)
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                        sale.deliveryMethod === 'local' && "bg-gray-100"
                      )}
                    >
                      🚚 Local
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Date */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditable) {
                    setShowDatePicker(!showDatePicker)
                  }
                }}
                className={cn(
                  "text-xs",
                  isNew && !sale.placementDate ? "text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded" : "text-gray-600",
                  isEditable && "cursor-pointer"
                )}
              >
                {sale.placementDate ? format(new Date(sale.placementDate), 'MMM d') : 'Date'}
              </button>
              
              {showDatePicker && isEditable && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDatePicker(false)
                    }}
                  />
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-2">
                    <input
                      type="date"
                      value={sale.placementDate ? format(new Date(sale.placementDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : new Date()
                        if (isNew && onUpdateNewSale) {
                          onUpdateNewSale({ placementDate: newDate })
                        } else {
                          updateSale(sale.id, { ...sale, placementDate: newDate })
                        }
                        setShowDatePicker(false)
                      }}
                      className="text-sm p-2 border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {!isNew && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                        setShowMenu(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                      <span className="text-sm">{isEditable ? 'Done' : 'Edit'}</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left text-red-600"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer Name */}
        {isEditingName ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleNameSave()
              }
            }}
            placeholder="Enter customer name..."
            className="font-semibold text-gray-900 mb-2 text-sm w-full bg-transparent outline-none border-b border-gray-300 focus:border-squarage-blue"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className={cn(
              "font-semibold text-gray-900 mb-2 text-sm",
              (sale.status === 'fulfilled' || sale.status === 'dead') && !isEditable && "line-through",
              isEditable && "cursor-text hover:bg-gray-50 px-1 -mx-1 rounded"
            )}
            onDoubleClick={() => {
              if (isEditable) {
                setIsEditingName(true)
              }
            }}
          >
            {sale.name || 'Untitled Sale'}
          </h3>
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Product */}
          {(product || isNew) && (
            <div className="relative inline-block">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditable) {
                    setShowProductMenu(!showProductMenu)
                  }
                }}
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-medium",
                  isNew && !product ? "bg-gray-300 text-gray-600" : "text-white",
                  isEditable && "cursor-pointer ring-1 ring-white/50"
                )}
                style={{ 
                  backgroundColor: collection?.color || (isNew ? undefined : '#666')
                }}
              >
                {product?.name || 'Product'}
              </button>
              
              {showProductMenu && isEditable && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowProductMenu(false)
                    }}
                  />
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[150px] max-h-48 overflow-y-auto">
                    {collections.map((coll) => (
                      <div key={coll.id}>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                          {coll.name}
                        </div>
                        {products
                          .filter(p => p.collectionId === coll.id)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isNew && onUpdateNewSale) {
                                  onUpdateNewSale({ productId: p.id, revenue: p.revenue })
                                } else {
                                  updateSale(sale.id, { ...sale, productId: p.id, revenue: p.revenue })
                                }
                                setShowProductMenu(false)
                              }}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                                sale.productId === p.id && "bg-gray-100"
                              )}
                            >
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: coll.color }}
                              />
                              {p.name}
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Revenue */}
          <span className="px-1.5 py-0.5 bg-green-600 rounded text-xs font-medium text-white">
            ${sale.revenue ? (sale.revenue / 100).toFixed(0) : '0'}
          </span>
          
          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-700">
              ✓ {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100">
          {/* Subtasks - Always show */}
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Subtasks</p>
            <div className="space-y-1">
              {/* Existing subtasks */}
              {sale.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSaleSubtask(sale.id, subtask.id)}
                    className="w-4 h-4 rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(
                    "text-sm text-gray-700 flex-1",
                    subtask.completed && "line-through text-gray-400"
                  )}>
                    {subtask.text}
                  </span>
                </div>
              ))}
              
              {/* Add new subtask input */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300" />
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                  onBlur={handleAddSubtask}
                  placeholder="Add subtask..."
                  className="text-sm text-gray-700 flex-1 bg-transparent outline-none placeholder-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          
          {/* Notes - Always show with inline editing */}
          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none placeholder-gray-400 min-h-[60px]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}