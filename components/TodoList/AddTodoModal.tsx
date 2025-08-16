'use client'

import { useState, useEffect } from 'react'
import { X, Edit2 } from 'lucide-react'
import { Todo } from '@/lib/types'
import Button from '@/components/UI/Button'
import CategoryOwnerEditModal from './CategoryOwnerEditModal'
import { format } from 'date-fns'
import useTodoStore from '@/lib/store-simple'
import CustomDropdown from '@/components/UI/CustomDropdown'
import PriorityDropdown from '@/components/UI/PriorityDropdown'

interface AddTodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  editingTodo?: Todo | null
}

export default function AddTodoModal({ isOpen, onClose, onSave, editingTodo }: AddTodoModalProps) {
  const { 
    categories, 
    owners,
    addCategory,
    updateCategory,
    deleteCategory,
    addOwner,
    updateOwner,
    deleteOwner
  } = useTodoStore()
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    owner: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'dead',
    dueDate: '',
    completed: false,
  })

  const [editModalOpen, setEditModalOpen] = useState<'category' | 'owner' | null>(null)

  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title,
        category: editingTodo.category,
        owner: editingTodo.owner,
        priority: editingTodo.priority,
        status: editingTodo.status || (editingTodo.completed ? 'completed' : 'not_started'),
        dueDate: editingTodo.dueDate ? format(new Date(editingTodo.dueDate), 'yyyy-MM-dd') : '',
        completed: editingTodo.completed,
      })
    } else {
      setFormData({
        title: '',
        category: categories[0]?.name || '',
        owner: owners[0]?.name || '',
        priority: 'medium',
        status: 'not_started',
        dueDate: '',
        completed: false,
      })
    }
  }, [editingTodo, isOpen, categories, owners])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-squarage-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-squarage-green to-squarage-blue p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {editingTodo ? 'Edit Task' : 'Add New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-squarage-yellow transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-squarage-black mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-brown-light rounded focus:outline-none focus:ring-2 focus:ring-squarage-green"
                placeholder="Enter task title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-squarage-black mb-1">
                  Category *
                  <button
                    type="button"
                    onClick={() => setEditModalOpen('category')}
                    className="ml-2 text-squarage-blue hover:text-squarage-green"
                  >
                    <Edit2 size={14} className="inline" />
                  </button>
                </label>
                <CustomDropdown
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  options={categories}
                  placeholder="Select category"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-squarage-black mb-1">
                  Owner *
                  <button
                    type="button"
                    onClick={() => setEditModalOpen('owner')}
                    className="ml-2 text-squarage-blue hover:text-squarage-green"
                  >
                    <Edit2 size={14} className="inline" />
                  </button>
                </label>
                <CustomDropdown
                  value={formData.owner}
                  onChange={(value) => setFormData({ ...formData, owner: value })}
                  options={owners}
                  placeholder="Select owner"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-squarage-black mb-1">
                  Priority *
                </label>
                <PriorityDropdown
                  value={formData.priority}
                  onChange={(priority) => setFormData({ ...formData, priority })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-squarage-black mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-brown-light rounded focus:outline-none focus:ring-2 focus:ring-squarage-green"
                />
              </div>
            </div>

            {editingTodo && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="completed"
                  checked={formData.completed}
                  onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                  className="mr-2 h-4 w-4 text-squarage-green focus:ring-squarage-green"
                />
                <label htmlFor="completed" className="text-sm text-squarage-black">
                  Mark as completed
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingTodo ? 'Update Task' : 'Add Task'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>

      <CategoryOwnerEditModal
        isOpen={editModalOpen === 'category'}
        onClose={() => setEditModalOpen(null)}
        type="category"
        items={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <CategoryOwnerEditModal
        isOpen={editModalOpen === 'owner'}
        onClose={() => setEditModalOpen(null)}
        type="owner"
        items={owners}
        onAdd={addOwner}
        onUpdate={updateOwner}
        onDelete={deleteOwner}
      />
    </>
  )
}