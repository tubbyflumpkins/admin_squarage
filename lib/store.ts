import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Todo, TodoFilters, CategoryOption, OwnerOption, SortBy, TodoStatus, FilterBy, Subtask } from './types'

interface TodoStore {
  // State
  todos: Todo[]
  categories: CategoryOption[]
  owners: OwnerOption[]
  filters: TodoFilters
  
  // Loading state - CRITICAL for preventing race conditions
  isLoading: boolean
  hasLoadedFromServer: boolean
  lastSaveTime: number
  
  // Actions
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
  
  // Internal state management
  setLoadingState: (isLoading: boolean) => void
  setHasLoadedFromServer: (hasLoaded: boolean) => void
}

// Debounce timer for saves
let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 1000 // Wait 1 second after last change before saving

// Custom storage that syncs with API
const apiStorage = {
  getItem: async (name: string) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return null
    }
    
    try {
      console.log('Loading data from server...')
      
      // Use Neon endpoint only - no fallback to JSON
      const response = await fetch('/api/todos/neon')
      if (!response.ok) throw new Error('Failed to fetch data from Neon')
      
      const data = await response.json()
      
      console.log('Successfully loaded data from server')
      
      // Return with loading flags set properly
      return JSON.stringify({
        state: {
          ...data,
          isLoading: false,
          hasLoadedFromServer: true,
          lastSaveTime: Date.now()
        },
        version: 0
      })
    } catch (error) {
      console.error('Error loading data from Neon:', error)
      // Return null but with proper flags
      return JSON.stringify({
        state: {
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
          isLoading: false,
          hasLoadedFromServer: false,
          lastSaveTime: 0
        },
        version: 0
      })
    }
  },
  
  setItem: async (name: string, value: string) => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const { state } = JSON.parse(value)
      
      // CRITICAL: Check loading state from the state itself
      if (state.isLoading) {
        console.log('Skipping save - still loading')
        return
      }
      
      // CRITICAL: Don't save if we haven't loaded from server yet
      if (!state.hasLoadedFromServer) {
        console.log('Skipping save - data not loaded from server yet')
        return
      }
      
      // SAFETY CHECK: Don't save if all arrays are empty
      if ((!state.todos || state.todos.length === 0) && 
          (!state.categories || state.categories.length === 0) && 
          (!state.owners || state.owners.length === 0)) {
        console.warn('Warning: Attempting to save empty state - checking if intentional')
        
        // Only allow empty save if this is truly the first time (no lastSaveTime)
        if (state.lastSaveTime > 0) {
          console.error('BLOCKED: Preventing save of empty state when data previously existed')
          return
        }
      }
      
      // Debounce saves to prevent rapid successive calls
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
      }
      
      saveDebounceTimer = setTimeout(async () => {
        try {
          console.log('Saving data to server...')
          
          // Only send the data we need, not the loading flags
          const dataToSave = {
            todos: state.todos,
            categories: state.categories,
            owners: state.owners
          }
          
          const response = await fetch('/api/todos/neon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            if (errorData.blocked) {
              console.error('Server blocked the save:', errorData.error)
              // Server prevented data loss - this is good!
              return
            }
            throw new Error('Failed to save data to Neon')
          }
          
          console.log('Successfully saved data to server')
        } catch (error) {
          console.error('Error saving data to Neon:', error)
        }
      }, SAVE_DEBOUNCE_MS)
      
    } catch (error) {
      console.error('Error in setItem:', error)
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
      // Initial state
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
      
      // Loading state - critical for preventing race conditions
      isLoading: true, // Start as loading
      hasLoadedFromServer: false,
      lastSaveTime: 0,
      
      // Internal state management
      setLoadingState: (isLoading) => {
        set({ isLoading })
      },
      
      setHasLoadedFromServer: (hasLoaded) => {
        set({ hasLoadedFromServer: hasLoaded })
      },

      addTodo: (todoData) => {
        const newTodo: Todo = {
          ...todoData,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({ 
          todos: [...state.todos, newTodo],
          lastSaveTime: Date.now()
        }))
      },

      updateTodo: (id, todoData) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, ...todoData, updatedAt: new Date() }
              : todo
          ),
          lastSaveTime: Date.now()
        }))
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
          lastSaveTime: Date.now()
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
          lastSaveTime: Date.now()
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

          return { todos, lastSaveTime: Date.now() }
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
            // Primary sort
            let primaryResult = 0
            
            switch (filters.sortBy) {
              case 'dueDate':
                // Handle null dates - put them at the end
                if (!a.dueDate && !b.dueDate) primaryResult = 0
                else if (!a.dueDate) primaryResult = 1
                else if (!b.dueDate) primaryResult = -1
                else primaryResult = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                break
              case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                primaryResult = priorityOrder[a.priority] - priorityOrder[b.priority]
                break
              case 'category':
                primaryResult = a.category.localeCompare(b.category)
                break
              case 'owner':
                primaryResult = a.owner.localeCompare(b.owner)
                break
              case 'createdAt':
                primaryResult = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                break
              default:
                primaryResult = 0
            }
            
            // If primary sort is equal and we're not already sorting by due date, 
            // apply due date as secondary sort
            if (primaryResult === 0 && filters.sortBy !== 'dueDate') {
              // Secondary sort by due date (soonest to latest)
              if (!a.dueDate && !b.dueDate) return 0
              if (!a.dueDate) return 1
              if (!b.dueDate) return -1
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            }
            
            return primaryResult
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
          ),
          lastSaveTime: Date.now()
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
          ),
          lastSaveTime: Date.now()
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
          ),
          lastSaveTime: Date.now()
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
          ),
          lastSaveTime: Date.now()
        }))
      },

      // Notes management
      updateNotes: (todoId, notes) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId
              ? { ...todo, notes, updatedAt: new Date() }
              : todo
          ),
          lastSaveTime: Date.now()
        }))
      },

      // Category management
      addCategory: (name) => {
        const newCategory: CategoryOption = {
          id: Math.random().toString(36).substring(2),
          name,
          color: colors[0], // Will be updated immediately by the modal
        }
        set((state) => ({ 
          categories: [...state.categories, newCategory],
          lastSaveTime: Date.now()
        }))
      },

      updateCategory: (id, name, color) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, name, color } : cat
          ),
          lastSaveTime: Date.now()
        }))
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
          lastSaveTime: Date.now()
        }))
      },

      // Owner management
      addOwner: (name) => {
        const newOwner: OwnerOption = {
          id: Math.random().toString(36).substring(2),
          name,
          color: colors[0], // Will be updated immediately by the modal
        }
        set((state) => ({ 
          owners: [...state.owners, newOwner],
          lastSaveTime: Date.now()
        }))
      },

      updateOwner: (id, name, color) => {
        set((state) => ({
          owners: state.owners.map((owner) =>
            owner.id === id ? { ...owner, name, color } : owner
          ),
          lastSaveTime: Date.now()
        }))
      },

      deleteOwner: (id) => {
        set((state) => ({
          owners: state.owners.filter((owner) => owner.id !== id),
          lastSaveTime: Date.now()
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
        isLoading: state.isLoading,
        hasLoadedFromServer: state.hasLoadedFromServer,
        lastSaveTime: state.lastSaveTime
      }),
      // Skip hydration on mount to manually control it
      skipHydration: false, // We'll keep automatic hydration but with better state management
    }
  )
)

export default useTodoStore