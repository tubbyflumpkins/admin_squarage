'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Filter, RefreshCw } from 'lucide-react'
import useTodoStore from '@/lib/store'
import TodoCardMobile from './TodoCardMobile'
import TodoEditSheet from './TodoEditSheet'
import TodoFilterBar from './TodoFilterBar'
import MobileLayout from '../Layout/MobileLayout'
import { Todo, TodoStatus } from '@/lib/types'

export default function TodoListMobile() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [newTodo, setNewTodo] = useState<Todo | null>(null)
  const [editableTodoId, setEditableTodoId] = useState<string | null>(null)
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false)
  
  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)
  
  const {
    todos,
    loadFromServer,
    addTodo,
    updateTodo,
    deleteTodo,
    getFilteredTodos,
    filters
  } = useTodoStore()

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [loadFromServer])

  // Handle click outside to save/close editable cards
  useEffect(() => {
    if (!editableTodoId) return

    const handleDocumentClick = (e: MouseEvent) => {
      // Don't do anything if a dropdown is open
      if (hasOpenDropdown) {
        return
      }

      const target = e.target as HTMLElement
      
      // Check if we clicked on the editable card or any of its children
      const editableCard = document.querySelector(`[data-todo-id="${editableTodoId}"]`)
      if (editableCard && editableCard.contains(target)) {
        return // Clicked inside the card, don't save
      }
      
      // At this point, we clicked outside the card and no dropdowns are open
      // Save new todo if it exists and has a title
      if (newTodo && newTodo.title.trim()) {
        const { id, ...todoData } = newTodo
        addTodo(todoData)
      }
      
      // Clear the new todo and exit edit mode
      setNewTodo(null)
      setEditableTodoId(null)
    }

    // Use a small delay to let React render first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick)
    }, 50)
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [editableTodoId, newTodo, addTodo, hasOpenDropdown])

  // Handle pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current
    
    if (distance > 0 && scrollContainerRef.current?.scrollTop === 0) {
      // We'll handle preventDefault via CSS touch-action instead
      setPullDistance(Math.min(distance, 100))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.current) return
    
    isPulling.current = false
    
    if (pullDistance > 60) {
      setIsRefreshing(true)
      setPullDistance(60)
      
      try {
        await loadFromServer()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  const handleAddNew = () => {
    // Create a new blank todo
    const blankTodo: Todo = {
      id: `temp-${Date.now()}`,
      title: '',
      category: '',
      owner: '',
      priority: 'low',
      status: 'not_started',
      dueDate: null,
      completed: false,
      subtasks: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setNewTodo(blankTodo)
    setEditableTodoId(blankTodo.id)
  }

  const handleEdit = (todo: Todo) => {
    if (editableTodoId === todo.id) {
      // Clicking edit again should save/close
      setEditableTodoId(null)
    } else {
      setEditableTodoId(todo.id)
    }
  }


  const handleSaveNew = () => {
    if (newTodo && newTodo.title.trim()) {
      // Remove temp ID and add to store
      const { id, ...todoData } = newTodo
      addTodo(todoData)
      setNewTodo(null)
      setEditableTodoId(null)
    }
  }

  const handleDelete = (id: string) => {
    // If it's the new todo being deleted, just remove it
    if (newTodo && newTodo.id === id) {
      setNewTodo(null)
      setEditableTodoId(null)
      return
    }
    
    if (confirm('Delete this task?')) {
      deleteTodo(id)
      if (editableTodoId === id) {
        setEditableTodoId(null)
      }
    }
  }

  const handleToggleStatus = (id: string, status: TodoStatus) => {
    if (newTodo && newTodo.id === id) {
      setNewTodo({ ...newTodo, status })
    } else {
      updateTodo(id, { status })
    }
  }

  const handleUpdateNewTodo = (updates: Partial<Todo>) => {
    if (newTodo) {
      setNewTodo({ ...newTodo, ...updates })
    }
  }

  const filteredTodos = getFilteredTodos()
  const openTasksCount = todos.filter(t => t.status === 'not_started' || t.status === 'in_progress').length

  // Combine new todo with existing todos
  const displayTodos = newTodo ? [newTodo, ...filteredTodos] : filteredTodos

  if (!isHydrated) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading tasks...</div>
            <div className="text-white/70 text-sm">Please wait</div>
          </div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="relative h-full overflow-hidden">
        {/* Pull to refresh indicator */}
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center transition-all duration-200 z-10"
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            opacity: pullDistance > 20 ? 1 : 0
          }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <RefreshCw 
              size={20} 
              className={`text-white ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-auto px-4 pt-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isPulling.current ? 'none' : 'transform 0.2s',
            touchAction: pullDistance > 0 ? 'none' : 'auto'
          }}
        >
          {/* Stats Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">Open Tasks</p>
                <p className="text-white text-2xl font-bold">{openTasksCount}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Filter size={20} className="text-white" />
                </button>
                <button
                  onClick={handleAddNew}
                  className="p-2 rounded-lg bg-white hover:bg-white/90 transition-colors"
                  disabled={!!newTodo}
                >
                  <Plus size={20} className="text-squarage-green" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <TodoFilterBar onClose={() => setShowFilters(false)} />
          )}

          {/* Todo List */}
          <div className="space-y-2 pb-4">
            {displayTodos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/70 mb-4">No tasks yet</p>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-white rounded-lg text-squarage-green font-medium"
                >
                  Add Your First Task
                </button>
              </div>
            ) : (
              displayTodos.map((todo) => (
                <TodoCardMobile
                  key={todo.id}
                  todo={todo}
                  onEdit={() => handleEdit(todo)}
                  onDelete={() => handleDelete(todo.id)}
                  onToggleStatus={(status) => handleToggleStatus(todo.id, status)}
                  isEditable={editableTodoId === todo.id}
                  isNew={newTodo?.id === todo.id}
                  onSave={handleSaveNew}
                  onUpdateNewTodo={newTodo?.id === todo.id ? handleUpdateNewTodo : undefined}
                  onDropdownStateChange={setHasOpenDropdown}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}