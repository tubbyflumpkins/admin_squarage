'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ExpenseTagManager from './ExpenseTagManager'
import type { ExpenseTagOption } from '@/lib/expenseTypes'
import { X } from 'lucide-react'

interface ExpenseSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  categories: ExpenseTagOption[]
  paidByOptions: ExpenseTagOption[]
  onAddCategory: (name: string, color: string) => void
  onUpdateCategory: (id: string, name: string, color: string) => void
  onDeleteCategory: (id: string) => void
  onAddPaidBy: (name: string, color: string) => void
  onUpdatePaidBy: (id: string, name: string, color: string) => void
  onDeletePaidBy: (id: string) => void
}

export default function ExpenseSettingsModal({
  isOpen,
  onClose,
  categories,
  paidByOptions,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddPaidBy,
  onUpdatePaidBy,
  onDeletePaidBy,
}: ExpenseSettingsModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="bg-squarage-green/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-squarage-green/40">
        <div className="p-5 flex items-center justify-between border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Expense Settings</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExpenseTagManager
            title="Paid By Tags"
            itemLabel="Paid By"
            items={paidByOptions}
            onAdd={onAddPaidBy}
            onUpdate={onUpdatePaidBy}
            onDelete={onDeletePaidBy}
          />
          <ExpenseTagManager
            title="Category Tags"
            itemLabel="Category"
            items={categories}
            onAdd={onAddCategory}
            onUpdate={onUpdateCategory}
            onDelete={onDeleteCategory}
          />
        </div>
      </div>
  )

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-white/20 backdrop-blur-xl z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="pointer-events-auto" onClick={(event) => event.stopPropagation()}>
          {modalContent}
        </div>
      </div>
    </>,
    document.body
  )
}
