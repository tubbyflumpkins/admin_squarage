'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { GripVertical, Trash2 } from 'lucide-react'
import { Todo, TodoStatus } from '@/lib/types'
import { cn, hexToPastel } from '@/lib/utils'
import useTodoStore from '@/lib/store'
import StatusDropdown from './StatusDropdown'
import CustomDropdown from '@/components/UI/CustomDropdown'
import PriorityDropdown from '@/components/UI/PriorityDropdown'
import SubtaskList from './SubtaskList'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  isWidget?: boolean
  readOnly?: boolean
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit, isWidget = false, readOnly = false }: TodoItemProps) {
  const { categories, owners, updateTodo } = useTodoStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDate, setEditingDate] = useState(false)
  const [titleValue, setTitleValue] = useState(todo.title)
  const [dateValue, setDateValue] = useState(todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '')
  const [isExpanded, setIsExpanded] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    high: '#F04E23', // squarage-red
    medium: '#F5B74C', // squarage-yellow  
    low: '#4A9B4E', // squarage-green
  }

  const category = categories.find(c => c.name === todo.category)
  const owner = owners.find(o => o.name === todo.owner)

  // Handle status change
  const handleStatusChange = (status: TodoStatus) => {
    updateTodo(todo.id, { status, completed: status === 'completed' })
  }

  // Handle category change
  const handleCategoryChange = (categoryName: string) => {
    updateTodo(todo.id, { category: categoryName })
  }

  // Handle owner change
  const handleOwnerChange = (ownerName: string) => {
    updateTodo(todo.id, { owner: ownerName })
  }

  // Handle priority change
  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    updateTodo(todo.id, { priority })
  }

  // Handle title editing
  const handleTitleDoubleClick = () => {
    setEditingTitle(true)
    setTitleValue(todo.title)
  }

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      updateTodo(todo.id, { title: titleValue.trim() })
    } else {
      setTitleValue(todo.title) // Reset if empty
    }
    setEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitleValue(todo.title)
      setEditingTitle(false)
    }
  }

  // Handle date editing
  const handleDateDoubleClick = () => {
    setEditingDate(true)
    setDateValue(todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '')
  }

  const handleDateSave = () => {
    updateTodo(todo.id, { dueDate: dateValue ? new Date(dateValue) : null })
    setEditingDate(false)
  }

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDateSave()
    } else if (e.key === 'Escape') {
      setDateValue(todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '')
      setEditingDate(false)
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (editingDate && dateInputRef.current) {
      dateInputRef.current.focus()
    }
  }, [editingDate])

  // Ensure status exists, default to not_started for backwards compatibility
  const currentStatus = todo.status || (todo.completed ? 'completed' : 'not_started')
  
  // Get pastel background color based on priority
  const priorityBgColor = hexToPastel(priorityColors[todo.priority])
  
  // Calculate subtask progress
  const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = todo.subtasks?.length || 0
  
  // Handle title click for expansion - only in non-widget mode
  const handleTitleClick = () => {
    if (!isWidget) {
      setIsExpanded(!isExpanded)
    }
  }

  // Simplified widget mode rendering
  if (isWidget) {
    return (
      <div
        className={cn(
          'transition-all duration-200 relative',
          currentStatus === 'completed' && 'bg-green-200/80',
          currentStatus === 'dead' && 'bg-red-200/80'
        )}
        style={{
          backgroundColor: currentStatus === 'completed' ? undefined : 
                          currentStatus === 'dead' ? undefined : 
                          priorityBgColor
        }}
      >
        <div className="grid grid-cols-[80px_1fr_80px] text-sm relative">
          {/* Strike-through line for completed and dead tasks */}
          {(currentStatus === 'completed' || currentStatus === 'dead') && (
            <div 
              className={cn(
                "absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 pointer-events-none z-10",
                currentStatus === 'completed' ? 'bg-green-700' : 'bg-red-700'
              )}
            />
          )}
          
          {/* Status */}
          <div className="px-2 py-1 flex items-center justify-center">
            <StatusDropdown
              value={currentStatus}
              onChange={handleStatusChange}
              compact
            />
          </div>
          
          {/* Title */}
          <div 
            className={cn(
              'px-2 py-1 flex items-center border-l border-brown-light/20 font-semibold',
              currentStatus === 'completed' && 'text-green-900',
              currentStatus === 'dead' && 'text-red-900',
              (currentStatus === 'not_started' || currentStatus === 'in_progress') && 'text-squarage-black'
            )}
          >
            <span className="w-full truncate">{todo.title}</span>
          </div>
          
          {/* Priority */}
          <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
            <PriorityDropdown
              value={todo.priority}
              onChange={handlePriorityChange}
              className="w-full"
              compact
            />
          </div>
        </div>
      </div>
    )
  }

  // Full mode rendering
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: currentStatus === 'completed' ? undefined : 
                        currentStatus === 'dead' ? undefined : 
                        priorityBgColor
      }}
      className={cn(
        'transition-all duration-200 relative',
        isDragging && 'opacity-50 shadow-lg',
        currentStatus === 'completed' && 'bg-green-200/80',
        currentStatus === 'dead' && 'bg-red-200/80'
      )}
    >
      <div className="grid grid-cols-[14px_110px_1fr_30px_100px_100px_80px_120px_32px] text-sm relative">
        {/* Strike-through line for completed and dead tasks - fixed to task row height */}
        {(currentStatus === 'completed' || currentStatus === 'dead') && (
          <div 
            className={cn(
              "absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 pointer-events-none z-10",
              currentStatus === 'completed' ? 'bg-green-700' : 'bg-red-700'
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

        {/* Status - Always editable */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <StatusDropdown
            value={currentStatus}
            onChange={handleStatusChange}
            compact
          />
        </div>

        {/* Title - Click to expand, Double-click to edit */}
        <div 
          className={cn(
            'px-2 py-1 flex items-center border-l border-brown-light/20 font-semibold cursor-pointer',
            currentStatus === 'completed' && 'text-green-900',
            currentStatus === 'dead' && 'text-red-900',
            (currentStatus === 'not_started' || currentStatus === 'in_progress') && 'text-squarage-black'
          )}
          onClick={handleTitleClick}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handleTitleDoubleClick()
          }}
        >
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full px-1 py-0.5 bg-white border rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-squarage-green"
            />
          ) : (
            <span className="w-full">{todo.title}</span>
          )}
        </div>

        {/* Subtask counter - Now just left of category */}
        <div className="px-1 py-1 flex items-center justify-center border-l border-brown-light/20">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 hover:text-squarage-green transition-colors font-medium"
          >
            {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '0'}
          </button>
        </div>

        {/* Category - Always editable */}
        <div className={cn(
          "px-2 py-1 flex items-center justify-center border-l border-brown-light/20",
          currentStatus === 'completed' && '[&_button]:!bg-green-600 [&_button]:opacity-80',
          currentStatus === 'dead' && '[&_button]:!bg-red-600 [&_button]:opacity-80'
        )}>
          <CustomDropdown
            value={todo.category}
            onChange={handleCategoryChange}
            options={categories}
            placeholder="Category"
            className="w-full"
            compact
          />
        </div>

        {/* Owner - Always editable */}
        <div className={cn(
          "px-2 py-1 flex items-center justify-center border-l border-brown-light/20",
          currentStatus === 'completed' && '[&_button]:!bg-green-600 [&_button]:opacity-80',
          currentStatus === 'dead' && '[&_button]:!bg-red-600 [&_button]:opacity-80'
        )}>
          <CustomDropdown
            value={todo.owner}
            onChange={handleOwnerChange}
            options={owners}
            placeholder="Owner"
            className="w-full"
            compact
          />
        </div>

        {/* Priority - Always editable */}
        <div className={cn(
          "px-2 py-1 flex items-center justify-center border-l border-brown-light/20",
          currentStatus === 'completed' && '[&_button]:!bg-green-600 [&_button]:opacity-80',
          currentStatus === 'dead' && '[&_button]:!bg-red-600 [&_button]:opacity-80'
        )}>
          <PriorityDropdown
            value={todo.priority}
            onChange={handlePriorityChange}
            className="w-full"
            compact
          />
        </div>

        {/* Due Date - Double-click to edit */}
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
              className="text-sm text-brown-medium bg-white border rounded px-1 focus:outline-none focus:ring-1 focus:ring-squarage-green"
            />
          ) : (
            todo.dueDate ? format(new Date(todo.dueDate), 'MMM dd, yyyy') : '-'
          )}
        </div>

        {/* Actions */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(todo.id)
            }}
            className="text-brown-medium hover:text-squarage-red transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Subtask list - expandable */}
      <SubtaskList
        todoId={todo.id}
        subtasks={todo.subtasks || []}
        notes={todo.notes}
        isExpanded={isExpanded}
        backgroundColor={
          currentStatus === 'completed' ? '#e6f4ea' :
          currentStatus === 'dead' ? '#fce8e6' :
          priorityBgColor ? `${priorityBgColor}88` : '#f9f9f9'
        }
      />
    </div>
  )
}