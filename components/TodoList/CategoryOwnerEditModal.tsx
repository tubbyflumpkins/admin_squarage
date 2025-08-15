'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Edit2 } from 'lucide-react'
import { CategoryOption, OwnerOption } from '@/lib/types'
import ColorPicker from '@/components/UI/ColorPicker'

interface CategoryOwnerEditModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'category' | 'owner'
  items: CategoryOption[] | OwnerOption[]
  onAdd: (name: string) => void
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
  isInline?: boolean
}

// Default colors
const defaultColors = [
  '#4A9B4E', // Squarage Green
  '#F7901E', // Squarage Orange
  '#01BAD5', // Squarage Blue
  '#F04E23', // Squarage Red
]

export default function CategoryOwnerEditModal({
  isOpen,
  onClose,
  type,
  items,
  onAdd,
  onUpdate,
  onDelete,
  isInline = false,
}: CategoryOwnerEditModalProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemColor, setNewItemColor] = useState(defaultColors[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [showNewItemColorPicker, setShowNewItemColorPicker] = useState(false)
  const [pendingNewItem, setPendingNewItem] = useState<{ name: string; color: string } | null>(null)
  const newColorButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Watch for new items and update their color
  useEffect(() => {
    if (pendingNewItem) {
      const newItem = items.find(item => item.name === pendingNewItem.name)
      if (newItem) {
        onUpdate(newItem.id, newItem.name, pendingNewItem.color)
        setPendingNewItem(null)
      }
    }
  }, [items, pendingNewItem, onUpdate])

  if (!isOpen) return null

  const handleAdd = () => {
    if (newItemName.trim()) {
      const trimmedName = newItemName.trim()
      onAdd(trimmedName)
      // Set pending item to update color after it's added
      setPendingNewItem({ name: trimmedName, color: newItemColor })
      setNewItemName('')
      setNewItemColor(defaultColors[0])
      setShowNewItemColorPicker(false)
    }
  }

  const startEdit = (item: CategoryOption | OwnerOption) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setShowColorPicker(null)
  }

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      const item = items.find(i => i.id === editingId)
      if (item) {
        onUpdate(editingId, editingName.trim(), item.color)
      }
      setEditingId(null)
      setEditingName('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleColorSelect = (itemId: string, color: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      onUpdate(itemId, item.name, color)
    }
    setShowColorPicker(null)
  }

  const title = type === 'category' ? 'Manage Categories' : 'Manage Owners'

  const modalContent = (
    <div className="bg-squarage-green/80 backdrop-blur-md rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-squarage-green/40">
        {/* Header - simple white text on green glass background */}
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Add new item section matching todo list container */}
          <div className="bg-white/35 backdrop-blur-md rounded-lg p-4 mb-6 border border-white/40">
            <h3 className="text-sm font-medium text-white mb-3">Add New {type === 'category' ? 'Category' : 'Owner'}</h3>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  ref={newColorButtonRef}
                  onClick={() => setShowNewItemColorPicker(!showNewItemColorPicker)}
                  className="w-10 h-10 rounded border-2 border-white/30 hover:border-white/50 transition-colors shadow-md"
                  style={{ backgroundColor: newItemColor }}
                />
                <ColorPicker
                  isOpen={showNewItemColorPicker}
                  onClose={() => setShowNewItemColorPicker(false)}
                  onSelect={(color) => setNewItemColor(color)}
                  currentColor={newItemColor}
                  triggerRef={newColorButtonRef}
                />
              </div>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`${type === 'category' ? 'Category' : 'Owner'} name...`}
                className="flex-1 px-3 py-2 bg-white/90 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-white/30 hover:bg-white/40 rounded text-white font-medium transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Items list matching todo list container */}
          <div className="bg-white/35 backdrop-blur-md rounded-lg p-4 border border-white/40">
            <h3 className="text-sm font-medium text-white mb-3">
              Existing {type === 'category' ? 'Categories' : 'Owners'}
            </h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id}>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 p-3 bg-white/50 backdrop-blur-sm rounded">
                      <div
                        className="w-6 h-6 rounded flex-shrink-0 shadow-md"
                        style={{ backgroundColor: item.color }}
                      />
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit()
                          } else if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                        onBlur={saveEdit}
                        className="flex-1 px-2 py-1 bg-white/80 border border-white/30 rounded text-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2 p-3 hover:bg-white/45 rounded group transition-colors">
                      <button
                        ref={(el) => { colorButtonRefs.current[item.id] = el }}
                        onClick={() => setShowColorPicker(showColorPicker === item.id ? null : item.id)}
                        className="w-6 h-6 rounded flex-shrink-0 border-2 border-transparent hover:border-white/50 transition-colors shadow-md"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex-1 text-sm text-white">{item.name}</span>
                      <button
                        onClick={() => startEdit(item)}
                        className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-yellow-300 transition-all p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      {/* Color picker using portal */}
                      <ColorPicker
                        isOpen={showColorPicker === item.id}
                        onClose={() => setShowColorPicker(null)}
                        onSelect={(color) => handleColorSelect(item.id, color)}
                        currentColor={item.color}
                        triggerRef={{ current: colorButtonRefs.current[item.id] }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-center text-white/60 py-4 text-sm">
                  No {type === 'category' ? 'categories' : 'owners'} yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  )

  // If inline mode, return just the modal content
  if (isInline) {
    return modalContent
  }

  // Otherwise, wrap in backdrop with glass-like blur
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {modalContent}
    </div>
  )
}