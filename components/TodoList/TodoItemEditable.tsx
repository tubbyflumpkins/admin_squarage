'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Todo, TodoStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import useTodoStore from '@/lib/store'
import StatusDropdown from './StatusDropdown'
import CustomDropdown from '@/components/UI/CustomDropdown'
import PriorityDropdown from '@/components/UI/PriorityDropdown'

interface TodoItemEditableProps {
  todo?: Todo
  isNew?: boolean
  onSave: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

export default function TodoItemEditable({ todo, isNew = false, onSave, onCancel }: TodoItemEditableProps) {
  const { categories, owners } = useTodoStore()
  const titleRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    title: todo?.title || '',
    category: todo?.category || '',
    owner: todo?.owner || '',
    priority: todo?.priority || ('' as 'low' | 'medium' | 'high' | ''),
    status: todo?.status || (todo?.completed ? 'completed' : 'not_started') as TodoStatus,
    dueDate: todo?.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '',
    completed: todo?.completed || false,
  })

  // Check if task is essentially blank (no meaningful data entered)
  const isTaskBlank = useCallback(() => {
    return !formData.title.trim() && !formData.category && !formData.owner
  }, [formData])

  const handleSubmit = useCallback(() => {
    // If task is blank, cancel instead of saving
    if (isNew && isTaskBlank()) {
      onCancel()
      return
    }
    
    // Only save if minimum required fields are filled
    if (formData.title.trim() && formData.category && formData.owner && formData.priority) {
      let dueDate = null
      if (formData.dueDate) {
        // Parse the date string and create a date at noon local time to avoid timezone shifts
        const [year, month, day] = formData.dueDate.split('-').map(Number)
        dueDate = new Date(year, month - 1, day, 12, 0, 0) // month is 0-indexed, set to noon
      }
      
      onSave({
        ...formData,
        priority: formData.priority as 'low' | 'medium' | 'high',
        completed: formData.status === 'completed',
        dueDate,
      })
    }
  }, [formData, onSave, onCancel, isNew, isTaskBlank])

  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus()
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
      <div className="grid grid-cols-[14px_110px_1fr_30px_100px_100px_80px_120px_32px] text-sm">
        {/* Placeholder for drag handle */}
        <div className="px-2 py-1" />
        
        {/* Status dropdown */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <StatusDropdown
            value={formData.status}
            onChange={(status) => setFormData({ ...formData, status })}
            compact
          />
        </div>

        {/* Title input */}
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            ref={titleRef}
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Task name..."
            className={cn(
              'w-full text-squarage-black px-1 py-0.5 border rounded text-sm',
              'focus:outline-none focus:ring-1 focus:ring-squarage-green',
              !formData.title && 'text-brown-light'
            )}
          />
        </div>
        
        {/* Placeholder for subtask counter */}
        <div className="px-1 py-1 border-l border-brown-light/20" />

        {/* Category dropdown */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <CustomDropdown
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories}
            placeholder="Category"
            className="w-full"
            compact
          />
        </div>

        {/* Owner dropdown */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <CustomDropdown
            value={formData.owner}
            onChange={(value) => setFormData({ ...formData, owner: value })}
            options={owners}
            placeholder="Owner"
            className="w-full"
            compact
          />
        </div>

        {/* Priority dropdown */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <PriorityDropdown
            value={formData.priority}
            onChange={(priority) => setFormData({ ...formData, priority })}
            className="w-full"
            compact
            placeholder="Priority"
          />
        </div>

        {/* Due Date */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="text-sm text-brown-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-squarage-green rounded px-1 w-full"
          />
        </div>

        {/* Actions - Show trash for blank tasks */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          {isNew && (
            <button
              onClick={onCancel}
              className="text-brown-medium hover:text-squarage-red transition-colors"
              title="Cancel new task"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}