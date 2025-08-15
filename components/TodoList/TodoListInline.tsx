'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Settings } from 'lucide-react'
import useTodoStore from '@/lib/store'
import TodoItem from './TodoItem'
import TodoItemEditable from './TodoItemEditable'
import CategoryOwnerEditModal from './CategoryOwnerEditModal'
import Button from '@/components/UI/Button'
import { Todo } from '@/lib/types'

interface TodoListInlineProps {
  isFullPage?: boolean
  containerHeight?: string
}

export default function TodoListInline({ isFullPage = false, containerHeight = '400px' }: TodoListInlineProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState<'category' | 'owner' | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  const {
    todos,
    categories,
    owners,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    reorderTodos,
    getFilteredTodos,
    addCategory,
    updateCategory,
    deleteCategory,
    addOwner,
    updateOwner,
    deleteOwner,
  } = useTodoStore()

  const filteredTodos = getFilteredTodos()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
    setEditingTodoId(null)
  }

  const handleSaveNew = (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTodo(todoData)
    setIsAddingNew(false)
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodoId(todo.id)
    setIsAddingNew(false)
  }

  const handleSaveEdit = (todoId: string, todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateTodo(todoId, todoData)
    setEditingTodoId(null)
  }

  const handleCancelEdit = () => {
    setEditingTodoId(null)
    setIsAddingNew(false)
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-brown-light">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-brown-medium">
            {filteredTodos.filter(t => !t.completed).length} pending tasks
          </span>
          <button
            onClick={() => setEditModalOpen('category')}
            className="text-sm text-squarage-blue hover:text-squarage-green transition-colors flex items-center gap-1"
          >
            <Settings size={14} />
            Edit Categories
          </button>
          <button
            onClick={() => setEditModalOpen('owner')}
            className="text-sm text-squarage-blue hover:text-squarage-green transition-colors flex items-center gap-1"
          >
            <Settings size={14} />
            Edit Owners
          </button>
        </div>
        <Button
          onClick={handleAddNew}
          size="sm"
          className="flex items-center gap-2"
          disabled={isAddingNew}
        >
          <Plus size={18} />
          Add Task
        </Button>
      </div>

      <div 
        className="overflow-y-auto scrollbar-thin pr-2"
        style={{ height: containerHeight }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTodos.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {isAddingNew && (
                <TodoItemEditable
                  isNew
                  onSave={handleSaveNew}
                  onCancel={handleCancelEdit}
                />
              )}
              
              {filteredTodos.map((todo) => (
                editingTodoId === todo.id ? (
                  <TodoItemEditable
                    key={todo.id}
                    todo={todo}
                    onSave={(data) => handleSaveEdit(todo.id, data)}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggleComplete}
                    onDelete={deleteTodo}
                    onEdit={handleEdit}
                  />
                )
              ))}
              
              {filteredTodos.length === 0 && !isAddingNew && (
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