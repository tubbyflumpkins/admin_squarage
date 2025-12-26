'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Settings2, Trash2 } from 'lucide-react'
import MobileLayout from '@/components/Mobile/Layout/MobileLayout'
import useExpenseStore from '@/lib/expenseStore'
import CustomDropdown from '@/components/UI/CustomDropdown'
import ExpenseSettingsModal from '@/components/ExpensesList/ExpenseSettingsModal'
import { applyCostSign } from '@/lib/expenseUtils'

export default function ExpensesListMobile() {
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)

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

  if (!hasLoadedFromServer || isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full text-white">Loading expenses...</div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="px-4 py-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Expense Tracker</h1>
            <p className="text-white/70 text-xs">Track spending on the go</p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg text-white text-sm"
          >
            <Settings2 size={16} />
            Settings
          </button>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 bg-white/90 rounded-lg text-squarage-green font-medium"
        >
          <Plus size={18} />
          Add Expense
        </button>

        {isAddingNew && (
          <div className="bg-white/95 rounded-xl p-4 mb-4 shadow-lg">
            <ExpenseMobileFields
              paidByOptions={paidByOptions}
              categories={categories}
              onSave={(expenseData) => {
                addExpense(expenseData)
                setIsAddingNew(false)
              }}
              onCancel={() => setIsAddingNew(false)}
            />
          </div>
        )}

        <div className="space-y-3 pb-6">
          {expenses.length === 0 && !isAddingNew ? (
            <div className="text-center text-white/70 py-12">
              No expenses yet.
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="bg-white/95 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-squarage-black font-semibold text-sm truncate">
                    {expense.name || 'Untitled expense'}
                  </div>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-brown-medium hover:text-squarage-red transition-colors"
                    title="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <ExpenseMobileFields
                  paidByOptions={paidByOptions}
                  categories={categories}
                  initialData={{
                    paidBy: expense.paidBy,
                    name: expense.name,
                    vendor: expense.vendor,
                    costCents: expense.costCents,
                    date: expense.date,
                    category: expense.category,
                  }}
                  onSave={(updates) => updateExpense(expense.id, updates)}
                  isInline
                />
              </div>
            ))
          )}
        </div>
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
    </MobileLayout>
  )
}

interface ExpenseMobileFieldsProps {
  paidByOptions: { id: string; name: string; color: string }[]
  categories: { id: string; name: string; color: string }[]
  initialData?: {
    paidBy: string
    name: string
    vendor: string
    costCents: number
    date: Date | null
    category: string
  }
  onSave: (updates: { paidBy: string; name: string; vendor: string; costCents: number; date: Date | null; category: string }) => void
  onCancel?: () => void
  isInline?: boolean
}

const formatCostInput = (costCents: number) => {
  if (!costCents) return ''
  return (Math.abs(costCents) / 100).toFixed(2)
}

const parseCostInput = (value: string) => {
  if (!value.trim()) return 0
  const normalized = value.replace(/,/g, '')
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100)
}

const parseDateInput = (value: string) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12, 0, 0)
}

function ExpenseMobileFields({
  paidByOptions,
  categories,
  initialData,
  onSave,
  onCancel,
  isInline = false,
}: ExpenseMobileFieldsProps) {
  const hasMounted = useRef(false)
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || '')
  const [name, setName] = useState(initialData?.name || '')
  const [vendor, setVendor] = useState(initialData?.vendor || '')
  const [costValue, setCostValue] = useState(formatCostInput(initialData?.costCents || 0))
  const [dateValue, setDateValue] = useState(
    initialData?.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : ''
  )
  const [category, setCategory] = useState(initialData?.category || '')
  const isBlank = !paidBy && !name.trim() && !vendor.trim() && !costValue.trim() && !dateValue && !category

  useEffect(() => {
    if (!isInline) return
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (isInline) {
      const rawCents = parseCostInput(costValue)
      const signed = applyCostSign(rawCents, { paidBy, category, name, vendor })
      onSave({
        paidBy,
        name,
        vendor,
        costCents: signed,
        date: parseDateInput(dateValue),
        category,
      })
    }
  }, [paidBy, name, vendor, costValue, dateValue, category, isInline, onSave])

  if (isInline) {
    return (
      <div className="space-y-3">
        <CustomDropdown
          value={paidBy}
          onChange={setPaidBy}
          options={paidByOptions}
          placeholder="Paid By"
          className="w-full"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Expense name..."
          className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
        />
        <input
          type="text"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="Vendor..."
          className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
        />
        <input
          type="number"
          step="0.01"
          value={costValue}
          onChange={(e) => setCostValue(e.target.value)}
          placeholder="0.00"
          className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
        />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="w-full text-sm text-brown-medium px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-squarage-green"
        />
        <CustomDropdown
          value={category}
          onChange={setCategory}
          options={categories}
          placeholder="Category"
          className="w-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <CustomDropdown
        value={paidBy}
        onChange={setPaidBy}
        options={paidByOptions}
        placeholder="Paid By"
        className="w-full"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Expense name..."
        className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
      />
      <input
        type="text"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
        placeholder="Vendor..."
        className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
      />
      <input
        type="number"
        step="0.01"
        value={costValue}
        onChange={(e) => setCostValue(e.target.value)}
        placeholder="0.00"
        className="w-full text-squarage-black px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green"
      />
      <input
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        className="w-full text-sm text-brown-medium px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-squarage-green"
      />
      <CustomDropdown
        value={category}
        onChange={setCategory}
        options={categories}
        placeholder="Category"
        className="w-full"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            if (isBlank) {
              if (onCancel) onCancel()
              return
            }
            {
              const rawCents = parseCostInput(costValue)
              const signed = applyCostSign(rawCents, { paidBy, category, name, vendor })
              onSave({
                paidBy,
                name: name.trim(),
                vendor: vendor.trim(),
                costCents: signed,
                date: parseDateInput(dateValue),
                category,
              })
            }
          }}
          className="flex-1 px-3 py-2 bg-squarage-green text-white rounded-lg text-sm font-medium"
        >
          Save
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
