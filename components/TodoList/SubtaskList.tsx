'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Subtask } from '@/lib/types'
import { cn } from '@/lib/utils'
import SubtaskItem from '@/components/UI/SubtaskItem'
import useTodoStore from '@/lib/store'

interface SubtaskListProps {
  todoId: string
  subtasks: Subtask[]
  notes?: string
  isExpanded: boolean
  backgroundColor?: string
}

export default function SubtaskList({ todoId, subtasks = [], notes = '', isExpanded, backgroundColor = '#f9f9f9' }: SubtaskListProps) {
  const { addSubtask, updateSubtask, deleteSubtask, toggleSubtask, updateNotes, todos } = useTodoStore()
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [notesValue, setNotesValue] = useState(notes)
  const inputRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Get the todo to access its notes
  const todo = todos.find(t => t.id === todoId)
  
  // Update local notes value when todo changes
  useEffect(() => {
    setNotesValue(todo?.notes || '')
  }, [todo?.notes])

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      addSubtask(todoId, newSubtaskText.trim())
      setNewSubtaskText('')
      setIsAddingNew(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask()
    } else if (e.key === 'Escape') {
      setNewSubtaskText('')
      setIsAddingNew(false)
    }
  }

  const startAdding = () => {
    setIsAddingNew(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNotesValue(newValue)
    updateNotes(todoId, newValue)
  }

  // Grid layout: [14px_110px_1fr_30px_100px_100px_80px_120px_32px]
  // Positions: drag(14) + status(110) + title(1fr) + counter(30) = left edge of category
  // Category(100) + Owner(100) + Priority(80) = 280px for notes section

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out relative",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div 
        className="border-t border-gray-200 relative"
        style={{ backgroundColor }}
      >
        {/* Column separator lines */}
        <div className="absolute top-0 bottom-0 border-l border-brown-light/20" style={{ left: '124px' }} />
        <div className="absolute top-0 bottom-0 border-r border-brown-light/20" style={{ right: '152px' }} />
        
        {/* Content container with grid matching parent */}
        <div className="grid grid-cols-[14px_110px_1fr_30px_100px_100px_80px_120px_32px]">
          {/* Empty cells for drag and status */}
          <div></div>
          <div></div>
          
          {/* Subtasks column - in title column */}
          <div className="py-2 pr-2">
            <div className="mb-1 px-4 text-xs font-semibold text-gray-600">Subtasks</div>
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={() => toggleSubtask(todoId, subtask.id)}
                onUpdate={(text) => updateSubtask(todoId, subtask.id, { text })}
                onDelete={() => deleteSubtask(todoId, subtask.id)}
              />
            ))}
            
            {isAddingNew ? (
              <div className="flex items-center gap-2 px-4 py-1.5">
                <div className="w-4 h-4" /> {/* Spacer for checkbox alignment */}
                <input
                  ref={inputRef}
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onBlur={() => {
                    if (!newSubtaskText.trim()) {
                      setIsAddingNew(false)
                    } else {
                      handleAddSubtask()
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Add subtask..."
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-squarage-green bg-white"
                />
              </div>
            ) : (
              <button
                onClick={startAdding}
                className="flex items-center gap-2 px-4 py-1.5 w-full text-left text-sm text-gray-500 hover:text-squarage-green transition-all"
              >
                <Plus size={14} />
                Add subtask
              </button>
            )}
          </div>
          
          {/* Empty cell for counter */}
          <div></div>
          
          {/* Notes column - spans category, owner, priority (3 columns) */}
          <div className="col-span-3 py-2 px-2 border-l border-gray-200">
            <div className="mb-1 px-2 text-xs font-semibold text-gray-600">Notes</div>
            <textarea
              ref={notesRef}
              value={notesValue}
              onChange={handleNotesChange}
              placeholder="Add notes..."
              className="w-full min-h-[100px] px-2 text-sm resize-none focus:outline-none bg-transparent"
              style={{ lineHeight: '1.5' }}
            />
          </div>
          
          {/* Empty cells for due date and actions */}
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  )
}