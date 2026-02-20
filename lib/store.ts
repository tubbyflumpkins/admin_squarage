import { create } from 'zustand'
import { Todo, TodoFilters, CategoryOption, OwnerOption, SortBy, TodoStatus, FilterBy, Subtask } from './types'
import { createEntityStoreSlice } from './createEntityStore'

interface TodoStore {
  todos: Todo[]
  categories: CategoryOption[]
  owners: OwnerOption[]
  filters: TodoFilters
  isLoading: boolean
  hasLoadedFromServer: boolean
  loadFromServer: () => Promise<void>
  saveToServer: (options?: { immediate?: boolean }) => Promise<void>
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTodo: (id: string, todo: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  reorderTodos: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<TodoFilters>) => void
  getFilteredTodos: () => Todo[]
  addSubtask: (todoId: string, text: string) => void
  updateSubtask: (todoId: string, subtaskId: string, updates: Partial<Subtask>) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  updateNotes: (todoId: string, notes: string) => void
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void
  addOwner: (name: string) => void
  updateOwner: (id: string, name: string, color: string) => void
  deleteOwner: (id: string) => void
}

const colors = [
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
  '#457B9D', '#1D3557', '#F1FAEE', '#A8DADC', '#E63946',
  '#8D5524', '#C68B59', '#D4A574', '#865439', '#B08968',
  '#FFC0CB'
]

const loadSave = createEntityStoreSlice<TodoStore>({
  coordinatorKey: 'todos-data',
  endpoint: '/api/todos/neon',
  parseResponse: (data) => ({
    todos: data.todos || [],
    categories: data.categories || [],
    owners: data.owners || [],
  }),
  serializeState: (state) => ({
    todos: state.todos,
    categories: state.categories,
    owners: state.owners,
  }),
})

const useTodoStore = create<TodoStore>((set, get) => ({
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
  ...loadSave(set, get),

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
        todo.id === id ? { ...todo, ...todoData, updatedAt: new Date() } : todo
      ),
    }))
    get().saveToServer()
  },

  deleteTodo: (id) => {
    set((state) => ({ todos: state.todos.filter((todo) => todo.id !== id) }))
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
              updatedAt: new Date(),
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
    set((state) => ({ filters: { ...state.filters, ...filter } }))
  },

  getFilteredTodos: () => {
    const state = get()
    let filtered = [...state.todos]
    const { filters } = state

    if (filters.category) filtered = filtered.filter((t) => t.category === filters.category)
    if (filters.owner) filtered = filtered.filter((t) => t.owner === filters.owner)
    if (filters.priority) filtered = filtered.filter((t) => t.priority === filters.priority)

    const activeTasks = filtered.filter(t => t.status !== 'completed' && t.status !== 'dead')
    const completedTasks = filtered.filter(t => t.status === 'completed')
    const deadTasks = filtered.filter(t => t.status === 'dead')

    const sortTasks = (tasks: Todo[]) => {
      tasks.sort((a, b) => {
        let primaryResult = 0
        switch (filters.sortBy) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) primaryResult = 0
            else if (!a.dueDate) primaryResult = 1
            else if (!b.dueDate) primaryResult = -1
            else primaryResult = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            break
          case 'priority': {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            primaryResult = priorityOrder[a.priority] - priorityOrder[b.priority]
            break
          }
          case 'category':
            primaryResult = a.category.localeCompare(b.category)
            break
          case 'owner':
            primaryResult = a.owner.localeCompare(b.owner)
            break
          case 'createdAt':
            primaryResult = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            break
        }
        if (primaryResult === 0 && filters.sortBy !== 'dueDate') {
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
    return [...activeTasks, ...completedTasks, ...deadTasks]
  },

  addSubtask: (todoId, text) => {
    const newSubtask: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      completed: false,
    }
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? { ...todo, subtasks: [...(todo.subtasks || []), newSubtask], updatedAt: new Date() }
          : todo
      ),
    }))
    get().saveToServer()
  },

  updateSubtask: (todoId, subtaskId, updates) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks?.map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
              updatedAt: new Date(),
            }
          : todo
      ),
    }))
    get().saveToServer()
  },

  deleteSubtask: (todoId, subtaskId) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? { ...todo, subtasks: todo.subtasks?.filter((st) => st.id !== subtaskId), updatedAt: new Date() }
          : todo
      ),
    }))
    get().saveToServer()
  },

  toggleSubtask: (todoId, subtaskId) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks?.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
              updatedAt: new Date(),
            }
          : todo
      ),
    }))
    get().saveToServer()
  },

  updateNotes: (todoId, notes) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId ? { ...todo, notes, updatedAt: new Date() } : todo
      ),
    }))
    get().saveToServer()
  },

  addCategory: (name) => {
    const newCategory: CategoryOption = {
      id: Math.random().toString(36).substring(2),
      name,
      color: colors[0],
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
    set((state) => ({ categories: state.categories.filter((cat) => cat.id !== id) }))
    get().saveToServer()
  },

  addOwner: (name) => {
    const newOwner: OwnerOption = {
      id: Math.random().toString(36).substring(2),
      name,
      color: colors[0],
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
    set((state) => ({ owners: state.owners.filter((owner) => owner.id !== id) }))
    get().saveToServer()
  },
}))

export default useTodoStore
