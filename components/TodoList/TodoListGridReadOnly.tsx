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
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import TodoItem from './TodoItem'
import { Todo, SortBy, CategoryOption, OwnerOption } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TodoListGridReadOnlyProps {
  isWidget?: boolean
  containerHeight?: string
}

type SortDirection = 'asc' | 'desc' | null

export default function TodoListGridReadOnly({ isWidget = false, containerHeight = '400px' }: TodoListGridReadOnlyProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortBy>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [data, setData] = useState<{ todos: Todo[], categories: CategoryOption[], owners: OwnerOption[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch data directly from API - NO ZUSTAND AT ALL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/todos/neon')
        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching data for read-only widget:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleSort = (column: SortBy) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn('dueDate')
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

  // Simple filtering and sorting
  const getFilteredTodos = () => {
    if (!data?.todos) return []
    
    let filtered = [...data.todos]
    
    // Sort by priority and status
    filtered.sort((a, b) => {
      // Completed and dead tasks go to bottom
      if (a.status === 'completed' || a.status === 'dead') {
        if (b.status !== 'completed' && b.status !== 'dead') return 1
      }
      if (b.status === 'completed' || b.status === 'dead') {
        if (a.status !== 'completed' && a.status !== 'dead') return -1
      }
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    })
    
    return filtered
  }

  let sortedTodos = getFilteredTodos()
  if (sortDirection === 'desc') {
    const activeTasks = sortedTodos.filter(t => t.status !== 'completed' && t.status !== 'dead')
    const completedTasks = sortedTodos.filter(t => t.status === 'completed')
    const deadTasks = sortedTodos.filter(t => t.status === 'dead')
    sortedTodos = [...activeTasks.reverse(), ...completedTasks.reverse(), ...deadTasks.reverse()]
  }

  if (!isHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/70">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {isWidget && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Todo List</h2>
        </div>
      )}

      {/* Column Headers */}
      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        <div className="grid grid-cols-[80px_1fr_80px] text-xs font-medium text-brown-medium uppercase tracking-wider">
          <div className="px-2 py-1.5 text-center">Status</div>
          <div className="px-2 py-1.5 border-l border-brown-light/20">Title</div>
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Priority</div>
        </div>
      </div>

      <div 
        className={cn(
          "border-x border-b border-brown-light/30 rounded-b-lg bg-squarage-white",
          "overflow-y-auto scrollbar-thin"
        )}
        style={{ height: containerHeight }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={() => {}} // No-op for read-only
        >
          <SortableContext
            items={sortedTodos.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-brown-light/20">
              {sortedTodos.slice(0, 5).map((todo) => (
                <div key={todo.id} className="hover:bg-squarage-white/30">
                  <TodoItem
                    todo={todo}
                    onToggle={() => {}}
                    onDelete={() => {}}
                    onEdit={() => {}}
                    isWidget={true}
                    readOnly={true}
                  />
                </div>
              ))}
              
              {sortedTodos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-brown-medium text-lg font-medium mb-2">No tasks yet</p>
                  <p className="text-brown-light text-sm">Click to view the todo list</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  )
}