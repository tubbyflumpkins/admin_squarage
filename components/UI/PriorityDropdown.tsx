'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import DropdownPortal from './DropdownPortal'

type Priority = 'low' | 'medium' | 'high'

interface PriorityDropdownProps {
  value: Priority | ''
  onChange: (priority: Priority) => void
  className?: string
  compact?: boolean
  placeholder?: string
}

const priorityConfig = {
  high: {
    label: 'High',
    bgClass: 'bg-squarage-red',
    color: '#F04E23'
  },
  medium: {
    label: 'Medium',
    bgClass: 'bg-squarage-yellow',
    color: '#F5B74C'
  },
  low: {
    label: 'Low',
    bgClass: 'bg-squarage-green',
    color: '#4A9B4E'
  }
}

export default function PriorityDropdown({ value, onChange, className, compact = false, placeholder = 'Select priority' }: PriorityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const currentPriority = value && value !== '' ? priorityConfig[value] : null

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
          currentPriority ? `text-white ${currentPriority.bgClass}` : 'bg-brown-light/20 text-brown-medium'
        )}
      >
        <span>{currentPriority ? currentPriority.label : placeholder}</span>
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
            {(['high', 'medium', 'low'] as Priority[]).map((priority) => {
              const config = priorityConfig[priority]
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => {
                    onChange(priority)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full font-medium text-white flex items-center justify-center transition-opacity hover:opacity-80',
                    compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
                    config.bgClass
                  )}
                >
                  {config.label}
                </button>
              )
            })}
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}