'use client'

import { useState, useRef } from 'react'
import { X, Plus, Trash2, Edit2 } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import ColorPicker from '@/components/UI/ColorPicker'

interface CalendarTypeEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalendarTypeEditModal({ isOpen, onClose }: CalendarTypeEditModalProps) {
  const { calendarTypes, addCalendarType, updateCalendarType, deleteCalendarType } = useCalendarStore()
  
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeColor, setNewTypeColor] = useState('#4A9B4E')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [showNewTypeColorPicker, setShowNewTypeColorPicker] = useState(false)
  
  const newColorButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  
  if (!isOpen) return null
  
  const handleAdd = () => {
    if (newTypeName.trim()) {
      addCalendarType(newTypeName.trim(), newTypeColor)
      setNewTypeName('')
      setNewTypeColor('#4A9B4E')
      setShowNewTypeColorPicker(false)
    }
  }
  
  const startEdit = (type: any) => {
    setEditingId(type.id)
    setEditingName(type.name)
    setShowColorPicker(null)
  }
  
  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      const type = calendarTypes.find(t => t.id === editingId)
      if (type) {
        updateCalendarType(editingId, editingName.trim(), type.color)
      }
      setEditingId(null)
      setEditingName('')
    }
  }
  
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }
  
  const handleColorSelect = (typeId: string, color: string) => {
    const type = calendarTypes.find(t => t.id === typeId)
    if (type) {
      updateCalendarType(typeId, type.name, color)
    }
    setShowColorPicker(null)
  }
  
  const handleDelete = (typeId: string) => {
    if (confirm('Delete this calendar type? Events will remain but lose their calendar association.')) {
      deleteCalendarType(typeId)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Manage Calendar Types</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Add New Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Calendar Type
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Calendar name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              />
              <button
                ref={newColorButtonRef}
                onClick={() => setShowNewTypeColorPicker(!showNewTypeColorPicker)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: newTypeColor }}
              />
              <ColorPicker
                isOpen={showNewTypeColorPicker}
                onClose={() => setShowNewTypeColorPicker(false)}
                onSelect={(color) => setNewTypeColor(color)}
                currentColor={newTypeColor}
                triggerRef={newColorButtonRef}
              />
              <button
                onClick={handleAdd}
                disabled={!newTypeName.trim()}
                className="px-4 py-2 bg-squarage-green hover:bg-squarage-green/90 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>
          
          {/* Calendar Types List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing Calendar Types
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {calendarTypes.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No calendar types yet</p>
              ) : (
                calendarTypes.map(type => (
                  <div
                    key={type.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <button
                      ref={el => { colorButtonRefs.current[type.id] = el; }}
                      onClick={() => setShowColorPicker(showColorPicker === type.id ? null : type.id)}
                      className="w-8 h-8 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <ColorPicker
                      isOpen={showColorPicker === type.id}
                      onClose={() => setShowColorPicker(null)}
                      onSelect={(color) => handleColorSelect(type.id, color)}
                      currentColor={type.color}
                      triggerRef={{ current: colorButtonRefs.current[type.id] }}
                    />
                    
                    {editingId === type.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        onBlur={saveEdit}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-gray-800">{type.name}</span>
                    )}
                    
                    <div className="flex items-center gap-1">
                      {editingId === type.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(type)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}