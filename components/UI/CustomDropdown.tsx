'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import DropdownPortal from './DropdownPortal'

interface Option {
  id: string
  name: string
  color: string
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  compact?: boolean
}

export default function CustomDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...', 
  className,
  compact = false
}: CustomDropdownProps) {
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
        top: rect.bottom + 2, // Add 2px gap
        left: rect.left,
        width: rect.width
      })
    }
  }, [isOpen])

  // Update position on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width
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
          'w-full rounded font-medium flex items-center justify-center',
          compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-2 text-sm',
          selectedOption ? '' : 'bg-brown-light/20 text-brown-medium'
        )}
        style={selectedOption ? { backgroundColor: selectedOption.color } : {}}
      >
        <span className={selectedOption ? 'text-white' : ''}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
      </button>

      {isOpen && (
        <DropdownPortal>
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-squarage-white border border-brown-light rounded shadow-lg overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
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
                  'w-full font-medium text-white flex items-center justify-center transition-opacity hover:opacity-80',
                  compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
                )}
                style={{ backgroundColor: option.color }}
              >
                {option.name}
              </button>
            ))}
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}