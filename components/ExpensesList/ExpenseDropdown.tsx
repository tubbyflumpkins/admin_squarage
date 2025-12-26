'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import DropdownPortal from '@/components/UI/DropdownPortal'

interface Option {
  id: string
  name: string
  color: string
}

interface ExpenseDropdownProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  compact?: boolean
}

export default function ExpenseDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  compact = false,
}: ExpenseDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.name === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width,
        })
      }
    }

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2 text-left rounded',
          compact ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-sm',
          selectedOption ? 'text-squarage-black' : 'text-brown-medium'
        )}
      >
        {selectedOption ? (
          <>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selectedOption.color }}
            />
            <span className="truncate">{selectedOption.name}</span>
          </>
        ) : (
          <span className="truncate">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <DropdownPortal>
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-squarage-white border border-brown-light rounded shadow-lg overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.name)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-squarage-black hover:bg-brown-light/20 transition-colors',
                  compact && 'px-2 py-1 text-xs'
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                <span className="truncate">{option.name}</span>
              </button>
            ))}
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}
