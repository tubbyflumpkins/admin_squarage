'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Todo, CategoryOption, OwnerOption } from '@/lib/types'

interface ApiResponse {
  todos: Todo[]
  categories: CategoryOption[]
  owners: OwnerOption[]
}

export default function TodoWidgetReadOnly() {
  const router = useRouter()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data directly from API - no Zustand, no persistence
    const fetchData = async () => {
      try {
        const response = await fetch('/api/todos/neon')
        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching data for widget:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'not_started': return 'bg-gray-400'
      case 'dead': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div 
      className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:shadow-3xl"
      onClick={() => router.push('/todo')}
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Todo List</h2>
        <p className="text-sm text-white/70 mt-1">Click to view all tasks</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-white/70">Loading...</div>
        </div>
      ) : data && data.todos.length > 0 ? (
        <div className="space-y-2">
          {/* Show only first 5 active todos */}
          {data.todos
            .filter(todo => todo.status !== 'completed' && todo.status !== 'dead')
            .slice(0, 5)
            .map(todo => (
              <div
                key={todo.id}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(todo.status)}`} />
                    <span className={`text-sm text-white ${
                      todo.status === 'completed' ? 'line-through opacity-60' : ''
                    }`}>
                      {todo.title}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                </div>
              </div>
            ))}
          
          {data.todos.filter(t => t.status !== 'completed' && t.status !== 'dead').length > 5 && (
            <div className="text-center text-sm text-white/70 pt-2">
              +{data.todos.filter(t => t.status !== 'completed' && t.status !== 'dead').length - 5} more tasks
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-white/70">No tasks yet</p>
          <p className="text-white/50 text-sm mt-1">Click to add your first task</p>
        </div>
      )}
    </div>
  )
}