'use client'

import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Subtask } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SubtaskItemProps {
  subtask: Subtask
  onToggle: () => void
  onUpdate: (text: string) => void
  onDelete: () => void
  backgroundColor?: string
}

export default function SubtaskItem({ subtask, onToggle, onUpdate, onDelete, backgroundColor }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(subtask.text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(editText.trim())
    } else {
      setEditText(subtask.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditText(subtask.text)
      setIsEditing(false)
    }
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-4 py-1.5 transition-all hover:brightness-95",
        subtask.completed && "opacity-60"
      )}>
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 text-squarage-green focus:ring-squarage-green focus:ring-offset-0"
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-squarage-green"
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm cursor-text",
            subtask.completed && "line-through text-gray-500"
          )}
          onDoubleClick={() => setIsEditing(true)}
        >
          {subtask.text}
        </span>
      )}
      
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        title="Delete subtask"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}