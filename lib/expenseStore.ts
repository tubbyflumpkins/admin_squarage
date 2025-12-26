import { create } from 'zustand'
import { loadingCoordinator } from './loadingCoordinator'
import type { Expense, ExpenseTagOption } from './expenseTypes'

interface ExpenseStore {
  expenses: Expense[]
  categories: ExpenseTagOption[]
  paidByOptions: ExpenseTagOption[]
  isLoading: boolean
  hasLoadedFromServer: boolean
  loadFromServer: () => Promise<void>
  saveToServer: (options?: { immediate?: boolean }) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addCategory: (name: string, color?: string) => void
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void
  addPaidBy: (name: string, color?: string) => void
  updatePaidBy: (id: string, name: string, color: string) => void
  deletePaidBy: (id: string) => void
}

let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 5000

const colors = [
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
  '#457B9D', '#1D3557', '#F1FAEE', '#A8DADC', '#E63946',
  '#8D5524', '#C68B59', '#D4A574', '#865439', '#B08968',
  '#FFC0CB'
]

const pickFallbackColor = (items: ExpenseTagOption[]) => {
  const used = new Set(items.map(item => item.color))
  const available = colors.find(color => !used.has(color))
  return available || colors[Math.floor(Math.random() * colors.length)]
}

const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  categories: [],
  paidByOptions: [],
  isLoading: false,
  hasLoadedFromServer: false,

  loadFromServer: async () => {
    const state = get()
    return loadingCoordinator.coordinatedLoad(
      'expenses-data',
      async () => {
        set({ isLoading: true })

        try {
          const response = await fetch('/api/expenses/neon', {
            credentials: 'include',
          })

          if (!response.ok) {
            if (response.status === 401 && typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            const errorText = await response.text()
            throw new Error(`Failed to load expenses: ${response.status} ${errorText}`)
          }

          const data = await response.json()

          set({
            expenses: data.expenses || [],
            categories: data.categories || [],
            paidByOptions: data.paidByOptions || [],
            isLoading: false,
            hasLoadedFromServer: true,
          })
        } catch (error) {
          console.error('Error loading expenses:', error)
          set({ isLoading: false, hasLoadedFromServer: true })
          throw error
        }
      },
      { bypassCache: state.isLoading }
    )
  },

  saveToServer: async (options?: { immediate?: boolean }) => {
    const immediate = options?.immediate ?? false
    const state = get()

    if (!state.hasLoadedFromServer || state.isLoading) {
      return
    }

    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }

    const save = async () => {
      try {
        const response = await fetch('/api/expenses/neon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            expenses: state.expenses,
            categories: state.categories,
            paidByOptions: state.paidByOptions,
          }),
        })

        if (!response.ok) {
          if (response.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/login'
            return
          }
          const errorData = await response.json().catch(() => ({}))
          if (errorData.blocked) {
            return
          }
          throw new Error('Failed to save expenses')
        }
      } catch (error) {
        console.error('Error saving expenses:', error)
      }
    }

    if (immediate) {
      await save()
    } else {
      saveDebounceTimer = setTimeout(save, SAVE_DEBOUNCE_MS)
    }
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({ expenses: [...state.expenses, newExpense] }))
    get().saveToServer({ immediate: true })
  },

  updateExpense: (id, expenseData) => {
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.id === id ? { ...expense, ...expenseData, updatedAt: new Date() } : expense
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  deleteExpense: (id) => {
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.id !== id),
    }))
    get().saveToServer({ immediate: true })
  },

  addCategory: (name, color) => {
    set((state) => ({
      categories: [
        ...state.categories,
        {
          id: Math.random().toString(36).substring(2, 9),
          name,
          color: color || pickFallbackColor(state.categories),
          createdAt: new Date(),
        },
      ],
    }))
    get().saveToServer({ immediate: true })
  },

  updateCategory: (id, name, color) => {
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, name, color } : category
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    }))
    get().saveToServer({ immediate: true })
  },

  addPaidBy: (name, color) => {
    set((state) => ({
      paidByOptions: [
        ...state.paidByOptions,
        {
          id: Math.random().toString(36).substring(2, 9),
          name,
          color: color || pickFallbackColor(state.paidByOptions),
          createdAt: new Date(),
        },
      ],
    }))
    get().saveToServer({ immediate: true })
  },

  updatePaidBy: (id, name, color) => {
    set((state) => ({
      paidByOptions: state.paidByOptions.map((option) =>
        option.id === id ? { ...option, name, color } : option
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  deletePaidBy: (id) => {
    set((state) => ({
      paidByOptions: state.paidByOptions.filter((option) => option.id !== id),
    }))
    get().saveToServer({ immediate: true })
  },
}))

export default useExpenseStore
