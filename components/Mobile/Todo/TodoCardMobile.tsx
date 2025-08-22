'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Todo, TodoStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import useTodoStore from '@/lib/store'
import { format } from 'date-fns'

interface TodoCardMobileProps {
  todo: Todo
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (status: TodoStatus) => void
  isEditable?: boolean
  onSave?: () => void
  isNew?: boolean
  onUpdateNewTodo?: (updates: Partial<Todo>) => void
  onDropdownStateChange?: (isOpen: boolean) => void
}

export default function TodoCardMobile({ 
  todo, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isEditable = false,
  onSave,
  isNew = false,
  onUpdateNewTodo,
  onDropdownStateChange
}: TodoCardMobileProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [notesValue, setNotesValue] = useState(todo.notes || '')
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [titleValue, setTitleValue] = useState(todo.title || '')
  const [isEditingTitle, setIsEditingTitle] = useState(isNew)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showOwnerMenu, setShowOwnerMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [hasSelectedStatus, setHasSelectedStatus] = useState(!isNew)
  const [hasSelectedPriority, setHasSelectedPriority] = useState(!isNew)
  const { categories, owners, updateTodo, addSubtask, toggleSubtask, updateNotes } = useTodoStore()
  
  const category = categories.find(c => c.name === todo.category)
  const owner = owners.find(o => o.name === todo.owner)

  // Track if any dropdown is open
  useEffect(() => {
    const isAnyDropdownOpen = showMenu || showStatusMenu || showCategoryMenu || showOwnerMenu || showPriorityMenu || showDatePicker
    if (onDropdownStateChange) {
      onDropdownStateChange(isAnyDropdownOpen)
    }
  }, [showMenu, showStatusMenu, showCategoryMenu, showOwnerMenu, showPriorityMenu, showDatePicker, onDropdownStateChange])

  const statusColors = {
    not_started: 'bg-gray-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    dead: 'bg-red-500'
  }

  const priorityColors = {
    high: '#F04E23',
    medium: '#F5B74C',
    low: '#4A9B4E'
  }

  const priorityBgColors = {
    high: '#FFE5E5', // Very light red/pink
    medium: '#FFF4E0', // Very light yellow/cream
    low: '#E8F5E8'  // Very light green
  }

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    dead: 'Dead'
  }

  const handleStatusChange = (newStatus: TodoStatus) => {
    onToggleStatus(newStatus)
    setShowStatusMenu(false)
    setHasSelectedStatus(true)
  }

  const handleNotesBlur = () => {
    if (notesValue !== todo.notes) {
      updateNotes(todo.id, notesValue)
    }
  }

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      addSubtask(todo.id, newSubtaskText.trim())
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

  const handleTitleSave = () => {
    if (titleValue.trim()) {
      if (isNew && onUpdateNewTodo) {
        onUpdateNewTodo({ title: titleValue.trim() })
      } else {
        updateTodo(todo.id, { ...todo, title: titleValue.trim() })
      }
      setIsEditingTitle(false)
      if (isNew && onSave) {
        onSave()
      }
    }
  }


  const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = todo.subtasks?.length || 0

  return (
    <div 
      data-todo-id={todo.id}
      className={cn(
        "todo-card rounded-xl shadow-sm overflow-visible transition-all relative",
        (todo.status === 'completed' || todo.status === 'dead') && !isEditable && "opacity-75",
        isEditable && "ring-2 ring-white ring-opacity-80 shadow-xl shadow-white/40 animate-glow-white"
      )}
      style={{
        backgroundColor: (todo.status === 'completed' || todo.status === 'dead') && !isEditable
          ? '#ffffff' 
          : isNew ? '#ffffff' : priorityBgColors[todo.priority]
      }}
    >
      {/* Main Card Content */}
      <div className="p-3 cursor-pointer" onClick={handleCardClick}>
        {/* Top Row: Status, Owner, Due Date, and Menu */}
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
                isNew && !hasSelectedStatus ? "bg-gray-300 text-gray-600" : `${statusColors[todo.status]} text-white`,
                isEditable && "ring-1 ring-white/50"
              )}
            >
              {isNew && !hasSelectedStatus ? 'Status' : statusLabels[todo.status]}
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
                      todo.status === 'not_started' && "bg-gray-100"
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
                      todo.status === 'in_progress' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    In Progress
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('completed')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      todo.status === 'completed' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Completed
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange('dead')
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      todo.status === 'dead' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Dead
                  </button>
                </div>
              </>
            )}
            </div>
            
            {/* Owner */}
            {(owner || isNew) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isEditable) {
                      setShowOwnerMenu(!showOwnerMenu)
                    }
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-medium",
                    isNew && !owner ? "bg-gray-300 text-gray-600" : "text-white",
                    isEditable && "cursor-pointer ring-1 ring-white/50"
                  )}
                  style={{ 
                    backgroundColor: owner?.color || (isNew ? undefined : '#666')
                  }}
                >
                  {owner?.name || 'Owner'}
                </button>
                
                {showOwnerMenu && isEditable && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowOwnerMenu(false)
                      }}
                    />
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[120px] max-h-48 overflow-y-auto">
                      {owners.map((o) => (
                        <button
                          key={o.name}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isNew && onUpdateNewTodo) {
                              onUpdateNewTodo({ owner: o.name })
                            } else {
                              updateTodo(todo.id, { ...todo, owner: o.name })
                            }
                            setShowOwnerMenu(false)
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                            todo.owner === o.name && "bg-gray-100"
                          )}
                        >
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: o.color }}
                          />
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Due Date */}
            {(todo.dueDate || isNew) && (
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
                    isNew && !todo.dueDate ? "text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded" : "text-gray-600",
                    isEditable && "cursor-pointer"
                  )}
                >
                  {todo.dueDate ? format(new Date(todo.dueDate), 'MMM d') : 'Date'}
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
                        value={todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value) : null
                          if (isNew && onUpdateNewTodo) {
                            onUpdateNewTodo({ dueDate: newDate })
                          } else {
                            updateTodo(todo.id, { ...todo, dueDate: newDate })
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
            )}
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

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleTitleSave()
              }
            }}
            placeholder="Enter task title..."
            className="font-semibold text-gray-900 mb-2 text-sm w-full bg-transparent outline-none border-b border-gray-300 focus:border-squarage-blue"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className={cn(
              "font-semibold text-gray-900 mb-2 text-sm",
              (todo.status === 'completed' || todo.status === 'dead') && !isEditable && "line-through",
              isEditable && "cursor-text hover:bg-gray-50 px-1 -mx-1 rounded"
            )}
            onDoubleClick={() => {
              if (isEditable) {
                setIsEditingTitle(true)
              }
            }}
          >
            {todo.title || 'Untitled Task'}
          </h3>
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Category */}
          {(category || isNew) && (
            <div className="relative inline-block">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditable) {
                    setShowCategoryMenu(!showCategoryMenu)
                  }
                }}
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-medium",
                  isNew && !category ? "bg-gray-300 text-gray-600" : "text-white",
                  isEditable && "cursor-pointer ring-1 ring-white/50"
                )}
                style={{ 
                  backgroundColor: category?.color || (isNew ? undefined : '#666')
                }}
              >
                {category?.name || 'Category'}
              </button>
              
              {showCategoryMenu && isEditable && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCategoryMenu(false)
                    }}
                  />
                  <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[120px] max-h-48 overflow-y-auto">
                    {categories.map((c) => (
                      <button
                        key={c.name}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isNew && onUpdateNewTodo) {
                            onUpdateNewTodo({ category: c.name })
                          } else {
                            updateTodo(todo.id, { ...todo, category: c.name })
                          }
                          setShowCategoryMenu(false)
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                          todo.category === c.name && "bg-gray-100"
                        )}
                      >
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Priority */}
          <div className="relative inline-block">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (isEditable) {
                  setShowPriorityMenu(!showPriorityMenu)
                }
              }}
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium",
                isNew && !hasSelectedPriority ? "bg-gray-300 text-gray-600" : "text-white",
                isEditable && "cursor-pointer ring-1 ring-white/50"
              )}
              style={{ 
                backgroundColor: isNew && !hasSelectedPriority ? undefined : priorityColors[todo.priority]
              }}
            >
              {isNew && !hasSelectedPriority ? 'Priority' : todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
            </button>
            
            {showPriorityMenu && isEditable && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPriorityMenu(false)
                  }}
                />
                <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[100px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isNew && onUpdateNewTodo) {
                        onUpdateNewTodo({ priority: 'high' })
                      } else {
                        updateTodo(todo.id, { ...todo, priority: 'high' })
                      }
                      setShowPriorityMenu(false)
                      setHasSelectedPriority(true)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      todo.priority === 'high' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors.high }} />
                    High
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isNew && onUpdateNewTodo) {
                        onUpdateNewTodo({ priority: 'medium' })
                      } else {
                        updateTodo(todo.id, { ...todo, priority: 'medium' })
                      }
                      setShowPriorityMenu(false)
                      setHasSelectedPriority(true)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      todo.priority === 'medium' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors.medium }} />
                    Medium
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isNew && onUpdateNewTodo) {
                        onUpdateNewTodo({ priority: 'low' })
                      } else {
                        updateTodo(todo.id, { ...todo, priority: 'low' })
                      }
                      setShowPriorityMenu(false)
                      setHasSelectedPriority(true)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full text-left text-sm",
                      todo.priority === 'low' && "bg-gray-100"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors.low }} />
                    Low
                  </button>
                </div>
              </>
            )}
          </div>
          
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
              {todo.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(todo.id, subtask.id)}
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