'use client'

import TodoListGrid from './TodoListGrid'

export default function TodoFullPage() {
  return (
    <div className="min-h-screen bg-squarage-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Todo List</h1>
        </div>

        {/* Glass container */}
        <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          <TodoListGrid isFullPage isGlassView />
        </div>
      </div>
    </div>
  )
}