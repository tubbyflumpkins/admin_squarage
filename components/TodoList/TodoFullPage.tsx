'use client'

import { useState, useEffect } from 'react'
import TodoListGrid from './TodoListGrid'
import useTodoStore from '@/lib/store'

export default function TodoFullPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const { todos, hasLoadedFromServer, loadFromServer } = useTodoStore()

  useEffect(() => {
    if (!hasLoadedFromServer) {
      loadFromServer().then(() => setIsHydrated(true))
    } else {
      setIsHydrated(true)
    }
  }, [hasLoadedFromServer, loadFromServer])
  
  // Calculate open tasks count
  const openTasksCount = isHydrated ? todos.filter(t => t.status === 'not_started' || t.status === 'in_progress').length : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-baseline gap-4">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Todo List</h1>
        <span className="text-lg text-white/80">Open Tasks: {openTasksCount}</span>
      </div>

      {/* Glass container */}
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
        <TodoListGrid isFullPage isGlassView />
      </div>
    </div>
  )
}