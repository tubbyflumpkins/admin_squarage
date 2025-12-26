'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import CustomDropdown from '@/components/UI/CustomDropdown'
import type { Expense, ExpenseTagOption } from '@/lib/expenseTypes'
import { applyCostSign, isIncomeEntry } from '@/lib/expenseUtils'

interface ExpenseRowEditableProps {
  paidByOptions: ExpenseTagOption[]
  categories: ExpenseTagOption[]
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
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

export default function ExpenseRowEditable({
  paidByOptions,
  categories,
  onSave,
  onCancel,
}: ExpenseRowEditableProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    paidBy: '',
    name: '',
    vendor: '',
    costValue: '',
    dateValue: '',
    category: '',
  })

  const isBlank = useCallback(() => {
    return !formData.name.trim() &&
      !formData.vendor.trim() &&
      !formData.paidBy &&
      !formData.costValue.trim() &&
      !formData.dateValue &&
      !formData.category
  }, [formData])

  const handleSubmit = useCallback(() => {
    if (isBlank()) {
      onCancel()
      return
    }

    const rawCents = parseCostInput(formData.costValue)
    const signed = applyCostSign(rawCents, {
      paidBy: formData.paidBy,
      category: formData.category,
      name: formData.name,
      vendor: formData.vendor,
    })
    onSave({
      paidBy: formData.paidBy,
      name: formData.name.trim(),
      vendor: formData.vendor.trim(),
      costCents: signed,
      date: parseDateInput(formData.dateValue),
      category: formData.category,
    })
  }, [formData, isBlank, onCancel, onSave])

  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-dropdown-portal="true"]')) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSubmit()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleSubmit])

  return (
    <div ref={containerRef} className="bg-squarage-white/95 ring-2 ring-squarage-green">
      <div className="grid grid-cols-[140px_1fr_1fr_110px_130px_140px] items-center text-sm">
        <div className="px-2 py-1">
          <CustomDropdown
            value={formData.paidBy}
            onChange={(value) => setFormData({ ...formData, paidBy: value })}
            options={paidByOptions}
            placeholder="Paid By"
            className="w-full"
            compact
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            ref={nameRef}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="Expense name..."
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            type="text"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="Vendor..."
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20 flex items-center gap-1">
          {isIncomeEntry({
            paidBy: formData.paidBy,
            category: formData.category,
            name: formData.name,
            vendor: formData.vendor,
          }) && (
            <span className="text-squarage-green text-sm font-semibold">+</span>
          )}
          <input
            type="number"
            step="0.01"
            value={formData.costValue}
            onChange={(e) => setFormData({ ...formData, costValue: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="0.00"
            className="w-full text-squarage-black bg-transparent px-0 py-0.5 border-none text-sm focus:outline-none focus:ring-1 focus:ring-squarage-green rounded"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20">
          <input
            type="date"
            value={formData.dateValue}
            onChange={(e) => setFormData({ ...formData, dateValue: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            className="text-sm text-brown-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-squarage-green rounded px-0 w-full"
          />
        </div>
        <div className="px-2 py-1 border-l border-brown-light/20 flex items-center gap-2">
          <CustomDropdown
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories}
            placeholder="Category"
            className="flex-1"
            compact
          />
          <button
            onClick={onCancel}
            className="text-brown-medium hover:text-squarage-red transition-colors"
            title="Cancel new expense"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
