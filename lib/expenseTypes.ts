export interface Expense {
  id: string
  paidBy: string
  name: string
  vendor: string
  costCents: number
  date: Date | null
  category: string
  createdAt: Date
  updatedAt: Date
}

export interface ExpenseTagOption {
  id: string
  name: string
  color: string
  createdAt: Date
}
