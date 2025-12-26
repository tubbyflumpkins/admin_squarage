'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import ColorPicker from '@/components/UI/ColorPicker'
import type { ExpenseTagOption } from '@/lib/expenseTypes'

interface ExpenseTagManagerProps {
  title: string
  itemLabel: string
  items: ExpenseTagOption[]
  onAdd: (name: string, color: string) => void
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
}

const defaultColors = [
  '#4A9B4E',
  '#F7901E',
  '#01BAD5',
  '#F04E23',
]

export default function ExpenseTagManager({
  title,
  itemLabel,
  items,
  onAdd,
  onUpdate,
  onDelete,
}: ExpenseTagManagerProps) {
  const [newItemName, setNewItemName] = useState('')
  const [newItemColor, setNewItemColor] = useState(defaultColors[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [showNewItemColorPicker, setShowNewItemColorPicker] = useState(false)
  const newColorButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  useEffect(() => {
    if (!editingId) {
      setEditingName('')
    }
  }, [editingId])

  const handleAdd = () => {
    if (!newItemName.trim()) return
    onAdd(newItemName.trim(), newItemColor)
    setNewItemName('')
    setNewItemColor(defaultColors[0])
    setShowNewItemColorPicker(false)
  }

  const startEdit = (item: ExpenseTagOption) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setShowColorPicker(null)
  }

  const saveEdit = (item: ExpenseTagOption) => {
    if (editingId && editingName.trim()) {
      onUpdate(item.id, editingName.trim(), item.color)
    }
    setEditingId(null)
  }

  const handleColorSelect = (itemId: string, color: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      onUpdate(itemId, item.name, color)
    }
    setShowColorPicker(null)
  }

  return (
    <div className="bg-white/35 backdrop-blur-md rounded-lg p-4 border border-white/40">
      <h3 className="text-sm font-medium text-white mb-3">{title}</h3>
      <div className="flex gap-2 mb-4">
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
            onSelect={setNewItemColor}
            currentColor={newItemColor}
            triggerRef={newColorButtonRef}
          />
        </div>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`${itemLabel} name...`}
          className="flex-1 px-3 py-2 bg-white/90 border border-white/30 rounded focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-white/30 hover:bg-white/40 rounded text-white font-medium transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto">
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
                      saveEdit(item)
                    } else if (e.key === 'Escape') {
                      setEditingId(null)
                    }
                  }}
                  onBlur={() => saveEdit(item)}
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
            No {itemLabel.toLowerCase()} tags yet
          </p>
        )}
      </div>
    </div>
  )
}
