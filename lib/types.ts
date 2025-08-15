export type TodoStatus = 'not_started' | 'in_progress' | 'completed' | 'dead'

export interface Subtask {
  id: string
  text: string
  completed: boolean
}

export interface Todo {
  id: string
  title: string
  category: string
  owner: string
  priority: 'low' | 'medium' | 'high'
  status: TodoStatus
  dueDate: Date | null
  completed: boolean // Keep for backwards compatibility, will migrate
  subtasks?: Subtask[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CategoryOption {
  id: string
  name: string
  color: string
}

export interface OwnerOption {
  id: string
  name: string
  color: string
}

export type SortBy = 'dueDate' | 'priority' | 'category' | 'owner' | 'createdAt'
export type FilterBy = 'all' | 'completed' | 'pending'

export interface TodoFilters {
  category?: string
  owner?: string
  priority?: 'low' | 'medium' | 'high'
  status: FilterBy
  sortBy: SortBy
}