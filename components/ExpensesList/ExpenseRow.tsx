'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import CustomDropdown from '@/components/UI/CustomDropdown'
import type { Expense, ExpenseTagOption } from '@/lib/expenseTypes'
import { applyCostSign, isIncomeEntry } from '@/lib/expenseUtils'

interface ExpenseRowProps {
  expense: Expense
  paidByOptions: ExpenseTagOption[]
  categories: ExpenseTagOption[]
  onUpdate: (id: string, updates: Partial<Expense>) => void
  onDelete: (id: string) => void
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

export default function ExpenseRow({
  expense,
  paidByOptions,
  categories,
  onUpdate,
  onDelete,
}: ExpenseRowProps) {
  const [nameValue, setNameValue] = useState(expense.name)
  const [vendorValue, setVendorValue] = useState(expense.vendor)
  const [dateValue, setDateValue] = useState(expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : '')
  const [costValue, setCostValue] = useState(formatCostInput(expense.costCents))

  useEffect(() => {
    setNameValue(expense.name)
  }, [expense.name])

  useEffect(() => {
    setVendorValue(expense.vendor)
  }, [expense.vendor])

  useEffect(() => {
    setDateValue(expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : '')
  }, [expense.date])

  useEffect(() => {
    setCostValue(formatCostInput(expense.costCents))
  }, [expense.costCents])

  const handleNameSave = () => {
    const trimmed = nameValue.trim()
    if (trimmed !== expense.name) {
      const signed = applyCostSign(expense.costCents, {
        paidBy: expense.paidBy,
        category: expense.category,
        name: trimmed,
        vendor: expense.vendor,
      })
      onUpdate(expense.id, { name: trimmed, costCents: signed })
    }
  }

  const handleCostSave = () => {
    const nextCost = parseCostInput(costValue)
    const signed = applyCostSign(nextCost, {
      paidBy: expense.paidBy,
      category: expense.category,
      name: expense.name,
      vendor: expense.vendor,
    })
    if (signed !== expense.costCents) {
      onUpdate(expense.id, { costCents: signed })
    }
  }

  const handleVendorSave = () => {
    const trimmed = vendorValue.trim()
    if (trimmed !== expense.vendor) {
      onUpdate(expense.id, { vendor: trimmed })
    }
  }

  const handleDateSave = () => {
    const nextDate = parseDateInput(dateValue)
    const existing = expense.date ? new Date(expense.date).toISOString() : ''
    const incoming = nextDate ? nextDate.toISOString() : ''
    if (existing !== incoming) {
      onUpdate(expense.id, { date: nextDate })
    }
  }

  return (
    <div className="bg-squarage-white/90 border-t border-brown-light/20 text-sm">
      <div className="grid grid-cols-[140px_1fr_1fr_110px_130px_140px] items-center">
        <div className="px-2 py-1">
          <CustomDropdown
            value={expense.paidBy}
            onChange={(value) => {
              const signed = applyCostSign(expense.costCents, {
                paidBy: value,
                category: expense.category,
                name: expense.name,
                vendor: expense.vendor,
              })
              onUpdate(expense.id, { paidBy: value, costCents: signed })
            }}
            options={paidByOptions}
            placeholder="Paid By"
            className="w-full"
            compact
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
            }}
            placeholder="Expense name..."
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            type="text"
            value={vendorValue}
            onChange={(e) => setVendorValue(e.target.value)}
            onBlur={handleVendorSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVendorSave()
            }}
            placeholder="Vendor..."
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20 flex items-center gap-1">
          {isIncomeEntry(expense) && (
            <span className="text-squarage-green text-sm font-semibold">+</span>
          )}
          <input
            type="number"
            step="0.01"
            value={costValue}
            onChange={(e) => setCostValue(e.target.value)}
            onBlur={handleCostSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCostSave()
            }}
            placeholder="0.00"
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            onBlur={handleDateSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDateSave()
            }}
            className="text-sm text-brown-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-squarage-green rounded px-0 w-full"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20 flex items-center gap-2">
          <CustomDropdown
            value={expense.category}
            onChange={(value) => {
              const signed = applyCostSign(expense.costCents, {
                paidBy: expense.paidBy,
                category: value,
                name: expense.name,
                vendor: expense.vendor,
              })
              onUpdate(expense.id, { category: value, costCents: signed })
            }}
            options={categories}
            placeholder="Category"
            className="flex-1"
            compact
          />
          <button
            onClick={() => onDelete(expense.id)}
            className="text-brown-medium hover:text-squarage-red transition-colors"
            title="Delete expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
