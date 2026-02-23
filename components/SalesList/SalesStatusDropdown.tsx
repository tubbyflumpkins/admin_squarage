'use client'

import { createPortal } from 'react-dom'
import type { SaleStatus } from '@/lib/salesTypes'
import { useDropdown } from '@/hooks/useDropdown'

interface SalesStatusDropdownProps {
  value: SaleStatus
  onChange: (value: SaleStatus) => void
  compact?: boolean
}

const statusOptions: { value: SaleStatus; label: string; bgClass: string; textColor: string }[] = [
  { value: 'not_started', label: 'Not Started', bgClass: 'bg-red-400', textColor: 'text-white' },
  { value: 'in_progress', label: 'In Progress', bgClass: 'bg-squarage-yellow', textColor: 'text-squarage-black' },
  { value: 'fulfilled', label: 'Fulfilled', bgClass: 'bg-squarage-green', textColor: 'text-white' },
  { value: 'dead', label: 'Dead', bgClass: 'bg-gray-600', textColor: 'text-white' },
]

export default function SalesStatusDropdown({ value, onChange, compact = false }: SalesStatusDropdownProps) {
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown({ gap: 4 })

  const currentStatus = statusOptions.find(opt => opt.value === value)

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => toggle()}
        className={`
          ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'}
          ${currentStatus?.bgClass || 'bg-gray-100'} ${currentStatus?.textColor || 'text-gray-700'}
          rounded font-medium hover:opacity-80 transition-all text-center whitespace-nowrap w-full
        `}
      >
        {currentStatus?.label || 'Select'}
      </button>

      {isOpen && position && (() => {
        const baseWidth = position.width || buttonRef.current?.offsetWidth || 120
        const menuWidth = Math.max(baseWidth + 8, 96)
        return createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            minWidth: `${menuWidth}px`,
            width: `${menuWidth}px`,
            zIndex: 9999
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                close()
              }}
              className={`
                w-full text-left px-2 py-1.5 hover:bg-gray-50 transition-colors
                ${compact ? 'text-xs' : 'text-sm'}
              `}
            >
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${option.bgClass} ${option.textColor}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>,
        document.body
        )
      })()}
    </>
  )
}
