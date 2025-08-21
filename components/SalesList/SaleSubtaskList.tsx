'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import useSalesStore from '@/lib/salesStore'
import SaleSubtaskItem from './SaleSubtaskItem'
import type { Sale } from '@/lib/salesTypes'
import { cn } from '@/lib/utils'

interface SaleSubtaskListProps {
  sale: Sale
  backgroundColor?: string
}

export default function SaleSubtaskList({ sale, backgroundColor = '#f9f9f9' }: SaleSubtaskListProps) {
  const { addSubtask, updateNotes, sales } = useSalesStore()
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [notesValue, setNotesValue] = useState(sale.notes || '')
  const inputRef = useRef<HTMLInputElement>(null)

  // Get the sale to access its notes
  const currentSale = sales.find(s => s.id === sale.id)
  
  // Update local notes value when sale changes
  useEffect(() => {
    setNotesValue(currentSale?.notes || '')
  }, [currentSale?.notes])

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      addSubtask(sale.id, newSubtaskText.trim())
      setNewSubtaskText('')
      setIsAddingNew(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtask()
    } else if (e.key === 'Escape') {
      setNewSubtaskText('')
      setIsAddingNew(false)
    }
  }

  const startAdding = () => {
    setIsAddingNew(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNotesValue(newValue)
    updateNotes(sale.id, newValue)
  }

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out relative max-h-[500px] opacity-100"
      )}
    >
      <div 
        className="border-t border-gray-200 relative"
        style={{ backgroundColor }}
      >
        {/* Column separator line - only on the left */}
        <div className="absolute top-0 bottom-0 border-l border-brown-light/20" style={{ left: '124px' }} />
        
        {/* Content container with grid matching parent */}
        <div className="grid grid-cols-[14px_110px_1fr_30px_120px_100px_32px]">
          {/* Empty cells for drag and status */}
          <div></div>
          <div></div>
          
          {/* Subtasks column - in order column */}
          <div className="py-2 pr-2">
            <div className="mb-1 px-4 text-xs font-semibold text-gray-600">Subtasks</div>
            {sale.subtasks?.map((subtask) => (
              <SaleSubtaskItem
                key={subtask.id}
                subtask={subtask}
                saleId={sale.id}
                backgroundColor={backgroundColor}
              />
            ))}
            
            {isAddingNew ? (
              <div className="px-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onBlur={handleAddSubtask}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter subtask..."
                  className="w-full px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-squarage-green"
                />
              </div>
            ) : (
              <button
                onClick={startAdding}
                className="px-4 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 py-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add subtask
              </button>
            )}
          </div>
          
          {/* Empty counter column */}
          <div></div>
          
          {/* Notes column - spans remaining columns */}
          <div className="col-span-3 py-2 pl-4">
            <div className="mb-1 text-xs font-semibold text-gray-600">Notes</div>
            <textarea
              value={notesValue}
              onChange={handleNotesChange}
              placeholder="Add notes..."
              className={cn(
                "w-full px-2 py-1 text-sm rounded resize-none bg-transparent border-0 focus:outline-none",
                "text-gray-700 placeholder-gray-400 min-h-[60px]"
              )}
              rows={Math.max(3, (notesValue?.split('\n').length || 1))}
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}