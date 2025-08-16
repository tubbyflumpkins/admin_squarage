'use client'

import { useEffect, useState } from 'react'
import useTodoStore from '@/lib/store'

export default function TestPage() {
  const [mounted, setMounted] = useState(false)
  const { 
    todos, 
    categories, 
    owners, 
    isLoading, 
    hasLoadedFromServer, 
    loadFromServer 
  } = useTodoStore()

  useEffect(() => {
    setMounted(true)
    // Load data when component mounts
    loadFromServer()
  }, [])

  if (!mounted) {
    return <div>Mounting...</div>
  }

  return (
    <div className="p-8 bg-squarage-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Store Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold mb-2">Store State:</h2>
          <ul>
            <li>isLoading: {isLoading ? 'true' : 'false'}</li>
            <li>hasLoadedFromServer: {hasLoadedFromServer ? 'true' : 'false'}</li>
            <li>Todos count: {todos.length}</li>
            <li>Categories count: {categories.length}</li>
            <li>Owners count: {owners.length}</li>
          </ul>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold mb-2">Todos:</h2>
          {todos.length === 0 ? (
            <p>No todos loaded</p>
          ) : (
            <ul className="space-y-2">
              {todos.map(todo => (
                <li key={todo.id} className="p-2 bg-gray-50 rounded">
                  <strong>{todo.title}</strong>
                  <br />
                  Status: {todo.status} | Priority: {todo.priority} | Owner: {todo.owner}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold mb-2">Categories:</h2>
          {categories.length === 0 ? (
            <p>No categories loaded</p>
          ) : (
            <ul className="flex gap-2">
              {categories.map(cat => (
                <li 
                  key={cat.id} 
                  className="px-3 py-1 rounded"
                  style={{ backgroundColor: cat.color, color: 'white' }}
                >
                  {cat.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold mb-2">Owners:</h2>
          {owners.length === 0 ? (
            <p>No owners loaded</p>
          ) : (
            <ul className="flex gap-2">
              {owners.map(owner => (
                <li 
                  key={owner.id} 
                  className="px-3 py-1 rounded"
                  style={{ backgroundColor: owner.color, color: 'white' }}
                >
                  {owner.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => loadFromServer()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Data
        </button>
      </div>
    </div>
  )
}