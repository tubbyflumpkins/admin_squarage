import { create } from 'zustand'
import type { Expense, ExpenseTagOption } from './expenseTypes'
import { createEntityStoreSlice } from './createEntityStore'

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

const colors = [
  '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51',
  '#457B9D', '#1D3557', '#F1FAEE', '#A8DADC', '#E63946',
  '#8D5524', '#C68B59', '#D4A574', '#865439', '#B08968',
  '#FFC0CB'
]

const pickFallbackColor = (items: ExpenseTagOption[]) => {
  const used = new Set(items.map(item => item.color))
  return colors.find(color => !used.has(color)) || colors[Math.floor(Math.random() * colors.length)]
}

const loadSave = createEntityStoreSlice<ExpenseStore>({
  coordinatorKey: 'expenses-data',
  endpoint: '/api/expenses/neon',
  parseResponse: (data) => ({
    expenses: data.expenses || [],
    categories: data.categories || [],
    paidByOptions: data.paidByOptions || [],
  }),
  serializeState: (state) => ({
    expenses: state.expenses,
    categories: state.categories,
    paidByOptions: state.paidByOptions,
  }),
})

const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  categories: [],
  paidByOptions: [],
  ...loadSave(set, get),

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
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, name, color } : cat
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== id),
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
