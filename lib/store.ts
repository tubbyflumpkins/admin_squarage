import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Todo, TodoFilters, CategoryOption, OwnerOption, SortBy, TodoStatus, FilterBy, Subtask } from './types'

interface TodoStore {
  todos: Todo[]
  categories: CategoryOption[]
  owners: OwnerOption[]
  filters: TodoFilters
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTodo: (id: string, todo: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  reorderTodos: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<TodoFilters>) => void
  getFilteredTodos: () => Todo[]
  
  // Subtask management
  addSubtask: (todoId: string, text: string) => void
  updateSubtask: (todoId: string, subtaskId: string, updates: Partial<Subtask>) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  
  // Notes management
  updateNotes: (todoId: string, notes: string) => void
  
  // Category management
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void
  
  // Owner management
  addOwner: (name: string) => void
  updateOwner: (id: string, name: string, color: string) => void
  deleteOwner: (id: string) => void
}

// Custom storage that syncs with API
const apiStorage = {
  getItem: async (name: string) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return null
    }
    
    try {
      const response = await fetch('/api/todos')
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      return JSON.stringify({
        state: data,
        version: 0
      })
    } catch (error) {
      console.error('Error loading data:', error)
      return null
    }
  },
  setItem: async (name: string, value: string) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const { state } = JSON.parse(value)
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })
      if (!response.ok) throw new Error('Failed to save data')
    } catch (error) {
      console.error('Error saving data:', error)
    }
  },
  removeItem: async (name: string) => {
    // Not needed for our use case
  }
}

// Default colors for categories/owners
const colors = [
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
  '#457B9D', '#1D3557', '#F1FAEE', '#A8DADC', '#E63946',
  '#8D5524', '#C68B59', '#D4A574', '#865439', '#B08968',
  '#FFC0CB'
]

const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [],
      categories: [],
      owners: [],
      filters: {
        category: undefined,
        owner: undefined,
        priority: undefined,
        status: 'all' as FilterBy,
        sortBy: 'priority' as SortBy,
      },

      addTodo: (todoData) => {
        const newTodo: Todo = {
          ...todoData,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({ todos: [...state.todos, newTodo] }))
      },

      updateTodo: (id, todoData) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, ...todoData, updatedAt: new Date() }
              : todo
          ),
        }))
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }))
      },

      toggleComplete: (id) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? { 
                  ...todo, 
                  completed: !todo.completed,
                  status: !todo.completed ? 'completed' as TodoStatus : 'not_started' as TodoStatus,
                  updatedAt: new Date() 
                }
              : todo
          ),
        }))
      },

      reorderTodos: (activeId, overId) => {
        set((state) => {
          const todos = [...state.todos]
          const activeIndex = todos.findIndex((t) => t.id === activeId)
          const overIndex = todos.findIndex((t) => t.id === overId)

          if (activeIndex !== -1 && overIndex !== -1) {
            const [removed] = todos.splice(activeIndex, 1)
            todos.splice(overIndex, 0, removed)
          }

          return { todos }
        })
      },

      setFilter: (filter) => {
        set((state) => ({
          filters: { ...state.filters, ...filter },
        }))
      },

      getFilteredTodos: () => {
        const state = get()
        let filtered = [...state.todos]
        const { filters } = state

        // Apply filters
        if (filters.category) {
          filtered = filtered.filter((t) => t.category === filters.category)
        }
        if (filters.owner) {
          filtered = filtered.filter((t) => t.owner === filters.owner)
        }
        if (filters.priority) {
          filtered = filtered.filter((t) => t.priority === filters.priority)
        }

        // Sort - separate active, completed, and dead tasks
        const activeTasks = filtered.filter(t => t.status !== 'completed' && t.status !== 'dead')
        const completedTasks = filtered.filter(t => t.status === 'completed')
        const deadTasks = filtered.filter(t => t.status === 'dead')

        // Sort each group independently
        const sortTasks = (tasks: Todo[]) => {
          tasks.sort((a, b) => {
            switch (filters.sortBy) {
              case 'dueDate':
                // Handle null dates - put them at the end
                if (!a.dueDate && !b.dueDate) return 0
                if (!a.dueDate) return 1
                if (!b.dueDate) return -1
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              case 'category':
                return a.category.localeCompare(b.category)
              case 'owner':
                return a.owner.localeCompare(b.owner)
              case 'createdAt':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              default:
                return 0
            }
          })
        }

        sortTasks(activeTasks)
        sortTasks(completedTasks)
        sortTasks(deadTasks)

        // Always return active -> completed -> dead order
        return [...activeTasks, ...completedTasks, ...deadTasks]
      },

      // Subtask management
      addSubtask: (todoId, text) => {
        const newSubtask: Subtask = {
          id: Math.random().toString(36).substring(2, 9),
          text,
          completed: false
        }
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? { ...todo, subtasks: [...(todo.subtasks || []), newSubtask], updatedAt: new Date() }
              : todo
          )
        }))
      },

      updateSubtask: (todoId, subtaskId, updates) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? {
                  ...todo,
                  subtasks: todo.subtasks?.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
                  ),
                  updatedAt: new Date()
                }
              : todo
          )
        }))
      },

      deleteSubtask: (todoId, subtaskId) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? {
                  ...todo,
                  subtasks: todo.subtasks?.filter((subtask) => subtask.id !== subtaskId),
                  updatedAt: new Date()
                }
              : todo
          )
        }))
      },

      toggleSubtask: (todoId, subtaskId) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? {
                  ...todo,
                  subtasks: todo.subtasks?.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
                  ),
                  updatedAt: new Date()
                }
              : todo
          )
        }))
      },

      // Notes management
      updateNotes: (todoId, notes) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? { ...todo, notes, updatedAt: new Date() }
              : todo
          )
        }))
      },

      // Category management
      addCategory: (name) => {
        const newCategory: CategoryOption = {
          id: Math.random().toString(36).substring(2),
          name,
          color: colors[0], // Will be updated immediately by the modal
        }
        set((state) => ({ categories: [...state.categories, newCategory] }))
      },

      updateCategory: (id, name, color) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, name, color } : cat
          ),
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }))
      },

      // Owner management
      addOwner: (name) => {
        const newOwner: OwnerOption = {
          id: Math.random().toString(36).substring(2),
          name,
          color: colors[0], // Will be updated immediately by the modal
        }
        set((state) => ({ owners: [...state.owners, newOwner] }))
      },

      updateOwner: (id, name, color) => {
        set((state) => ({
          owners: state.owners.map((owner) =>
            owner.id === id ? { ...owner, name, color } : owner
          ),
        }))
      },

      deleteOwner: (id) => {
        set((state) => ({
          owners: state.owners.filter((owner) => owner.id !== id),
        }))
      },
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => apiStorage),
      partialize: (state) => ({
        todos: state.todos,
        categories: state.categories,
        owners: state.owners,
      }),
    }
  )
)

export default useTodoStore