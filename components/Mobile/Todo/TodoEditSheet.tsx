'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Todo, TodoStatus } from '@/lib/types'
import useTodoStore from '@/lib/store'
import { format } from 'date-fns'

interface TodoEditSheetProps {
  todo: Todo | null
  onSave: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export default function TodoEditSheet({ todo, onSave, onClose }: TodoEditSheetProps) {
  const { categories, owners } = useTodoStore()
  
  const [formData, setFormData] = useState({
    title: todo?.title || '',
    category: todo?.category || '',
    owner: todo?.owner || '',
    priority: todo?.priority || 'medium' as 'low' | 'medium' | 'high',
    status: todo?.status || 'not_started' as TodoStatus,
    dueDate: todo?.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '',
    notes: todo?.notes || '',
    subtasks: todo?.subtasks || [],
    completed: todo?.completed || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.category || !formData.owner) {
      alert('Please fill in all required fields')
      return
    }
    
    let dueDate = null
    if (formData.dueDate) {
      const [year, month, day] = formData.dueDate.split('-').map(Number)
      dueDate = new Date(year, month - 1, day, 12, 0, 0)
    }
    
    onSave({
      ...formData,
      dueDate,
      completed: formData.status === 'completed'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-h-[90vh] bg-white rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {todo ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
              placeholder="Enter task title..."
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner *
            </label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            >
              <option value="">Select owner</option>
              {owners.map((own) => (
                <option key={own.id} value={own.name}>
                  {own.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TodoStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="dead">Dead</option>
            </select>
          </div>
          
          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green"
              rows={4}
              placeholder="Add any notes..."
            />
          </div>
        </form>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-squarage-green text-white font-medium rounded-lg hover:bg-squarage-green/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {todo ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}