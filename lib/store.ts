import { create } from 'zustand'
import { Todo, TodoFilters, CategoryOption, OwnerOption, SortBy, TodoStatus, FilterBy, Subtask } from './types'
import { loadingCoordinator } from './loadingCoordinator'

interface TodoStore {
  // State
  todos: Todo[]
  categories: CategoryOption[]
  owners: OwnerOption[]
  filters: TodoFilters
  
  // Loading state
  isLoading: boolean
  hasLoadedFromServer: boolean
  
  // Actions
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
  
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

// Debounce timer for saves
let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 5000 // Increased from 1s to 5s to reduce database calls

// Default colors for categories/owners
const colors = [
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
  '#457B9D', '#1D3557', '#F1FAEE', '#A8DADC', '#E63946',
  '#8D5524', '#C68B59', '#D4A574', '#865439', '#B08968',
  '#FFC0CB'
]

const useTodoStore = create<TodoStore>((set, get) => ({
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
  
  // Loading state
  isLoading: false,
  hasLoadedFromServer: false,
  
  // Load data from server with coordination to prevent multiple simultaneous loads
  loadFromServer: async () => {
    const state = get()
    
    // Use the loading coordinator to prevent multiple simultaneous requests
    return loadingCoordinator.coordinatedLoad(
      'todos-data',
      async () => {
        set({ isLoading: true })
        
        try {
          console.log('Loading todos data from server...')
          const response = await fetch('/api/todos/neon', {
            credentials: 'include' // Ensure cookies are sent with request
          })
          
          if (!response.ok) {
            console.error(`API returned ${response.status}: ${response.statusText}`)
            
            // Handle authentication errors specifically
            if (response.status === 401) {
              console.error('Authentication error - redirecting to login')
              // In a browser environment, redirect to login
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
              throw new Error('Authentication required')
            }
            
            const errorText = await response.text()
            console.error('Error response:', errorText)
            throw new Error(`Failed to load data: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('Todos data loaded from server:', {
            todosCount: data.todos?.length || 0,
            categoriesCount: data.categories?.length || 0,
            ownersCount: data.owners?.length || 0
          })
          
          // Only update state if we actually got data
          if (data.todos || data.categories || data.owners) {
            set({
              todos: data.todos || [],
              categories: data.categories || [],
              owners: data.owners || [],
              isLoading: false,
              hasLoadedFromServer: true
            })
          } else {
            console.warn('API returned empty data')
            set({ 
              isLoading: false,
              hasLoadedFromServer: true
            })
          }
          
          return data
        } catch (error) {
          console.error('Error loading todos data from server:', error)
          // Try to provide helpful error messages
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error('Network error - could not connect to API')
          }
          set({ 
            isLoading: false,
            hasLoadedFromServer: true // Mark as loaded even on error to prevent infinite retries
          })
          throw error
        }
      },
      { bypassCache: state.isLoading } // Bypass cache if already loading
    )
  },
  
  // Save data to server (debounced)
  saveToServer: async () => {
    const state = get()
    
    // Don't save if we haven't loaded from server yet
    if (!state.hasLoadedFromServer) {
      console.log('Skipping save - data not loaded from server yet')
      return
    }
    
    // Don't save if currently loading
    if (state.isLoading) {
      console.log('Skipping save - currently loading data')
      return
    }
    
    // Safety check: Don't save empty state if we supposedly have loaded data
    if (state.hasLoadedFromServer && 
        state.todos.length === 0 && 
        state.categories.length === 0 && 
        state.owners.length === 0) {
      console.warn('Warning: Attempting to save empty state after loading - this might be an error')
      // Still allow it but with warning, as user might have legitimately deleted everything
    }
    
    // Clear existing timer
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }
    
    // Debounce the save (5 second delay to batch multiple changes)
    saveDebounceTimer = setTimeout(async () => {
      try {
        console.log('[TodoStore] Saving data to server after user action...', {
          todos: state.todos.length,
          categories: state.categories.length,
          owners: state.owners.length,
          timestamp: new Date().toISOString()
        })
        
        const dataToSave = {
          todos: state.todos,
          categories: state.categories,
          owners: state.owners
        }
        
        const response = await fetch('/api/todos/neon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Ensure cookies are sent with request
          body: JSON.stringify(dataToSave)
        })
        
        if (!response.ok) {
          // Handle authentication errors specifically
          if (response.status === 401) {
            console.error('Authentication error while saving - redirecting to login')
            // In a browser environment, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return
          }
          
          const errorData = await response.json()
          if (errorData.blocked) {
            console.error('Server blocked the save:', errorData.error)
            return
          }
          throw new Error('Failed to save data')
        }
        
        console.log('Data saved successfully')
      } catch (error) {
        console.error('Error saving data:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  },

  addTodo: (todoData) => {
    const newTodo: Todo = {
      ...todoData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({ todos: [...state.todos, newTodo] }))
    get().saveToServer()
  },

  updateTodo: (id, todoData) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? { ...todo, ...todoData, updatedAt: new Date() }
          : todo
      ),
    }))
    get().saveToServer()
  },

  deleteTodo: (id) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }))
    get().saveToServer()
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
    get().saveToServer()
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
    get().saveToServer()
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
      )
    }))
    get().saveToServer()
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
    get().saveToServer()
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
    get().saveToServer()
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
    get().saveToServer()
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
    get().saveToServer()
  },

  // Category management
  addCategory: (name) => {
    const newCategory: CategoryOption = {
      id: Math.random().toString(36).substring(2),
      name,
      color: colors[0], // Will be updated immediately by the modal
    }
    set((state) => ({ categories: [...state.categories, newCategory] }))
    get().saveToServer()
  },

  updateCategory: (id, name, color) => {
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, name, color } : cat
      ),
    }))
    get().saveToServer()
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
    }))
    get().saveToServer()
  },

  // Owner management
  addOwner: (name) => {
    const newOwner: OwnerOption = {
      id: Math.random().toString(36).substring(2),
      name,
      color: colors[0], // Will be updated immediately by the modal
    }
    set((state) => ({ owners: [...state.owners, newOwner] }))
    get().saveToServer()
  },

  updateOwner: (id, name, color) => {
    set((state) => ({
      owners: state.owners.map((owner) =>
        owner.id === id ? { ...owner, name, color } : owner
      ),
    }))
    get().saveToServer()
  },

  deleteOwner: (id) => {
    set((state) => ({
      owners: state.owners.filter((owner) => owner.id !== id),
    }))
    get().saveToServer()
  },
}))

export default useTodoStore