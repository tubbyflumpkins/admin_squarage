'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Settings2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import useTodoStore from '@/lib/store'
import TodoItem from './TodoItem'
import TodoItemEditable from './TodoItemEditable'
import CategoryOwnerEditModal from './CategoryOwnerEditModal'
import FilterDropdown from './FilterDropdown'
import Button from '@/components/UI/Button'
import { Todo, SortBy } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TodoListGridProps {
  isFullPage?: boolean
  containerHeight?: string
  isGlassView?: boolean
  isWidget?: boolean
}

type SortDirection = 'asc' | 'desc' | null

export default function TodoListGrid({ isFullPage = false, containerHeight = '400px', isGlassView = false, isWidget = false }: TodoListGridProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showBothModals, setShowBothModals] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortBy>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  const {
    todos,
    categories,
    owners,
    filters,
    isLoading,
    hasLoadedFromServer,
    loadFromServer,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    reorderTodos,
    setFilter,
    getFilteredTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    addOwner,
    updateOwner,
    deleteOwner,
  } = useTodoStore()

  useEffect(() => {
    const loadData = async () => {
      // Load data from server on mount
      await loadFromServer()
      setIsHydrated(true)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  useEffect(() => {
    if (sortColumn && sortDirection) {
      setFilter({ sortBy: sortColumn })
    }
  }, [sortColumn, sortDirection, setFilter])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderTodos(active.id as string, over.id as string)
    }
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
  }

  const handleSaveNew = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTodo(todoData)
    setIsAddingNew(false)
  }

  const handleCancelEdit = () => {
    setIsAddingNew(false)
  }

  const handleSort = (column: SortBy) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn('dueDate') // Reset to default
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortBy) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={14} className="text-brown-light" />
    }
    if (sortDirection === 'asc') {
      return <ChevronUp size={14} className="text-squarage-green" />
    }
    if (sortDirection === 'desc') {
      return <ChevronDown size={14} className="text-squarage-green" />
    }
    return <ChevronsUpDown size={14} className="text-brown-light" />
  }

  // Get sorted todos
  let sortedTodos = getFilteredTodos()
  if (sortDirection === 'desc') {
    // When reversing, maintain the status groups (active, completed, dead)
    const activeTasks = sortedTodos.filter(t => t.status !== 'completed' && t.status !== 'dead')
    const completedTasks = sortedTodos.filter(t => t.status === 'completed')
    const deadTasks = sortedTodos.filter(t => t.status === 'dead')
    
    // Only reverse the active tasks
    sortedTodos = [...activeTasks.reverse(), ...completedTasks.reverse(), ...deadTasks.reverse()]
  }

  // Show loading state while data is being fetched from server
  // IMPORTANT: Check loading states BEFORE checking data
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading your tasks...</div>
          <div className="text-white/70 text-sm">Fetching data from server</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {isWidget ? (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Todo List</h2>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          {isGlassView ? (
            <button
              onClick={handleAddNew}
              disabled={isAddingNew}
              className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
            >
              <Plus size={18} className="text-squarage-black" />
              <span>Add Task</span>
            </button>
          ) : (
            <Button
              onClick={handleAddNew}
              size="sm"
              className="flex items-center gap-2"
              disabled={isAddingNew}
            >
              <Plus size={18} />
              Add Task
            </Button>
          )}
          <button
            onClick={() => setShowBothModals(true)}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
            title="Manage Categories & Owners"
          >
            <Settings2 size={18} className="text-squarage-black" />
            <span>Settings</span>
          </button>
        </div>
      )}

      {/* Column Headers */}
      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        {isWidget ? (
          <div className="grid grid-cols-[80px_1fr_80px] text-xs font-medium text-brown-medium uppercase tracking-wider">
            <div className="px-2 py-1.5 text-center">Status</div>
            <div className="px-2 py-1.5 border-l border-brown-light/20">Title</div>
            <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Priority</div>
          </div>
        ) : (
        <div className="grid grid-cols-[14px_110px_1fr_30px_100px_100px_80px_120px_32px] text-xs font-medium text-brown-medium uppercase tracking-wider">
          <div className="px-2 py-1.5" /> {/* Space for drag handle */}
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Status</div>
          
          <button
            onClick={() => handleSort('dueDate')}
            className="px-2 py-1.5 flex items-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Title
            {getSortIcon('dueDate')}
          </button>
          
          <div className="px-1 py-1.5 text-center border-l border-brown-light/20" title="Subtasks">
            📋
          </div>
          
          <div className="border-l border-brown-light/20">
            <FilterDropdown
              type="category"
              options={categories}
              selectedValue={filters.category}
              onSelect={(value) => setFilter({ category: value })}
            />
          </div>
          
          <div className="border-l border-brown-light/20">
            <FilterDropdown
              type="owner"
              options={owners}
              selectedValue={filters.owner}
              onSelect={(value) => setFilter({ owner: value })}
            />
          </div>
          
          <button
            onClick={() => handleSort('priority')}
            className="px-2 py-1.5 flex items-center justify-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Priority
            {getSortIcon('priority')}
          </button>
          
          <button
            onClick={() => handleSort('dueDate')}
            className="px-2 py-1.5 flex items-center justify-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Due Date
            {getSortIcon('dueDate')}
          </button>
          
          <div className="px-2 py-1.5 border-l border-brown-light/20" /> {/* Space for actions */}
        </div>
        )}
      </div>

      <div 
        className={cn(
          "border-x border-b border-brown-light/30 rounded-b-lg bg-squarage-white",
          !isFullPage && "overflow-y-auto scrollbar-thin"
        )}
        style={{ height: isFullPage ? 'auto' : containerHeight }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedTodos.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-brown-light/20">
              {isAddingNew && (
                <div className="hover:bg-squarage-white/30">
                  <TodoItemEditable
                    isNew
                    onSave={handleSaveNew}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}
              
              {(isWidget ? sortedTodos.slice(0, 5) : sortedTodos).map((todo) => (
                <div key={todo.id} className="hover:bg-squarage-white/30">
                  <TodoItem
                    todo={todo}
                    onToggle={toggleComplete}
                    onDelete={deleteTodo}
                    onEdit={() => {}}
                    isWidget={isWidget}
                  />
                </div>
              ))}
              
              {sortedTodos.length === 0 && !isAddingNew && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-brown-light mb-4">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="mx-auto"
                    >
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  </div>
                  <p className="text-brown-medium text-lg font-medium mb-2">No tasks yet</p>
                  <p className="text-brown-light text-sm">Click &quot;Add Task&quot; to create your first task</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Both modals side by side with frosted glass overlay - using portal */}
      {showBothModals && isHydrated && createPortal(
        <>
          {/* Full screen overlay - clicking anywhere on this closes modals */}
          <div 
            className="fixed inset-0 bg-white/20 backdrop-blur-xl z-40"
            onClick={() => setShowBothModals(false)}
          />
          
          {/* Modal container - no pointer events, just for positioning */}
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-24 pointer-events-none">
            <div className="flex gap-4 max-w-5xl w-full">
              {/* Categories Modal - only this div has pointer events */}
              <div 
                className="flex-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CategoryOwnerEditModal
                  isOpen={true}
                  onClose={() => setShowBothModals(false)}
                  type="category"
                  items={categories}
                  onAdd={addCategory}
                  onUpdate={updateCategory}
                  onDelete={deleteCategory}
                  isInline={true}
                />
              </div>
              {/* Owners Modal - only this div has pointer events */}
              <div 
                className="flex-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CategoryOwnerEditModal
                  isOpen={true}
                  onClose={() => setShowBothModals(false)}
                  type="owner"
                  items={owners}
                  onAdd={addOwner}
                  onUpdate={updateOwner}
                  onDelete={deleteOwner}
                  isInline={true}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}