'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import useSalesStore from '@/lib/salesStore'
import type { SaleSubtask } from '@/lib/salesTypes'

interface SaleSubtaskItemProps {
  subtask: SaleSubtask
  saleId: string
  backgroundColor?: string
}

export default function SaleSubtaskItem({ subtask, saleId, backgroundColor }: SaleSubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(subtask.text)
  
  const { toggleSubtask, updateSubtask, deleteSubtask } = useSalesStore()

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== subtask.text) {
      updateSubtask(saleId, subtask.id, { text: editText.trim() })
    } else {
      setEditText(subtask.text)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(subtask.text)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div 
      className="group flex items-center gap-2 px-4 py-1 hover:bg-gray-100/50 transition-colors"
      style={{ backgroundColor: isEditing ? 'white' : 'transparent' }}
    >
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={() => toggleSubtask(saleId, subtask.id)}
        className="rounded border-gray-300 text-squarage-green focus:ring-squarage-green"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-1 py-0.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-squarage-green"
          autoFocus
        />
      ) : (
        <span 
          className={`flex-1 text-sm cursor-text ${
            subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
          }`}
          onDoubleClick={() => setIsEditing(true)}
        >
          {subtask.text}
        </span>
      )}
      
      <button
        onClick={() => deleteSubtask(saleId, subtask.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}