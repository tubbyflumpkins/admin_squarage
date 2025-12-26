'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronsUpDown, ChevronDown, ChevronUp, Plus, Settings2 } from 'lucide-react'
import useExpenseStore from '@/lib/expenseStore'
import ExpenseRow from './ExpenseRow'
import ExpenseRowEditable from './ExpenseRowEditable'
import ExpenseSettingsModal from './ExpenseSettingsModal'

export default function ExpenseListGrid() {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [sortColumn, setSortColumn] = useState<'paidBy' | 'name' | 'vendor' | 'cost' | 'date' | 'category'>('date')
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')

  const {
    expenses,
    categories,
    paidByOptions,
    isLoading,
    hasLoadedFromServer,
    loadFromServer,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addPaidBy,
    updatePaidBy,
    deletePaidBy,
  } = useExpenseStore()

  useEffect(() => {
    if (!hasLoadedFromServer && !isLoading) {
      loadFromServer().catch(() => undefined)
    }
  }, [hasLoadedFromServer, isLoading, loadFromServer])

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown size={14} className="text-brown-light" />
    }
    return sortDirection === 'desc'
      ? <ChevronDown size={14} className="text-squarage-green" />
      : <ChevronUp size={14} className="text-squarage-green" />
  }

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses]
    const direction = sortDirection === 'asc' ? 1 : -1

    const getDateValue = (expense: typeof expenses[number]) => {
      const date = expense.date ? new Date(expense.date) : new Date(expense.createdAt)
      return date.getTime()
    }

    sorted.sort((a, b) => {
      switch (sortColumn) {
        case 'paidBy':
          return a.paidBy.localeCompare(b.paidBy) * direction
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'vendor':
          return a.vendor.localeCompare(b.vendor) * direction
        case 'cost':
          return (Math.abs(a.costCents) - Math.abs(b.costCents)) * direction
        case 'category':
          return a.category.localeCompare(b.category) * direction
        case 'date':
        default:
          return (getDateValue(a) - getDateValue(b)) * direction
      }
    })

    return sorted
  }, [expenses, sortColumn, sortDirection])

  const expenseRows = expenses.filter(expense => expense.costCents < 0)
  const totalCostCents = expenseRows.reduce((sum, expense) => sum + Math.abs(expense.costCents || 0), 0)
  const averageCostCents = expenseRows.length > 0 ? Math.round(totalCostCents / expenseRows.length) : 0

  if (!hasLoadedFromServer || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading your expenses...</div>
          <div className="text-white/70 text-sm">Fetching data from server</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
          >
            <Plus size={18} className="text-squarage-black" />
            <span>Add Expense</span>
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="text-white font-medium">
                <span className="text-white/80">Total Spend:</span>{' '}
                <span className="text-white font-bold">
                  ${totalCostCents === 0 ? '0' : (totalCostCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-white font-medium">
                <span className="text-white/80">Average:</span>{' '}
                <span className="text-white font-bold">
                  ${averageCostCents === 0 ? '0' : (averageCostCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-white font-medium">
                <span className="text-white/80">Entries:</span>{' '}
                <span className="text-white font-bold">{expenseRows.length}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
          title="Settings"
        >
          <Settings2 size={18} className="text-squarage-black" />
          <span>Settings</span>
        </button>
      </div>

      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        <div className="grid grid-cols-[140px_1fr_1fr_110px_130px_140px] text-xs font-semibold text-brown-medium tracking-wide">
          <button
            onClick={() => handleSort('paidBy')}
            className="px-2 py-1.5 flex items-center gap-1 hover:text-squarage-green transition-colors"
          >
            Paid By
            {getSortIcon('paidBy')}
          </button>
          <button
            onClick={() => handleSort('name')}
            className="px-2 py-1.5 flex items-center gap-1 border-l border-brown-light/20 hover:text-squarage-green transition-colors"
          >
            Name
            {getSortIcon('name')}
          </button>
          <button
            onClick={() => handleSort('vendor')}
            className="px-2 py-1.5 flex items-center gap-1 border-l border-brown-light/20 hover:text-squarage-green transition-colors"
          >
            Vendor
            {getSortIcon('vendor')}
          </button>
          <button
            onClick={() => handleSort('cost')}
            className="px-2 py-1.5 flex items-center gap-1 border-l border-brown-light/20 hover:text-squarage-green transition-colors"
          >
            Cost
            {getSortIcon('cost')}
          </button>
          <button
            onClick={() => handleSort('date')}
            className="px-2 py-1.5 flex items-center gap-1 border-l border-brown-light/20 hover:text-squarage-green transition-colors"
          >
            Date
            {getSortIcon('date')}
          </button>
          <button
            onClick={() => handleSort('category')}
            className="px-2 py-1.5 flex items-center gap-1 border-l border-brown-light/20 hover:text-squarage-green transition-colors"
          >
            Category
            {getSortIcon('category')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-b-lg border border-t-0 border-brown-light/30">
        {isAddingNew && (
          <ExpenseRowEditable
            paidByOptions={paidByOptions}
            categories={categories}
            onSave={(expenseData) => {
              addExpense(expenseData)
              setIsAddingNew(false)
            }}
            onCancel={() => setIsAddingNew(false)}
          />
        )}

        {sortedExpenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            paidByOptions={paidByOptions}
            categories={categories}
            onUpdate={updateExpense}
            onDelete={deleteExpense}
          />
        ))}

        {expenses.length === 0 && !isAddingNew && (
          <div className="bg-squarage-white/80 py-12 text-center">
            <p className="text-brown-medium text-lg font-medium mb-2">No expenses yet</p>
            <p className="text-brown-light text-sm">Click "Add Expense" to get started</p>
          </div>
        )}
      </div>

      <ExpenseSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        categories={categories}
        paidByOptions={paidByOptions}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onAddPaidBy={addPaidBy}
        onUpdatePaidBy={updatePaidBy}
        onDeletePaidBy={deletePaidBy}
      />
    </>
  )
}
