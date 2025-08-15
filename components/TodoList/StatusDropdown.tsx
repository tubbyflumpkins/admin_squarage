'use client'

import { useState, useRef, useEffect } from 'react'
import { TodoStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import DropdownPortal from '@/components/UI/DropdownPortal'

interface StatusDropdownProps {
  value: TodoStatus
  onChange: (status: TodoStatus) => void
  compact?: boolean
}

const statusConfig = {
  not_started: {
    label: 'Not Started',
    color: '#4B91E2', // squarage-blue
    bgClass: 'bg-squarage-blue',
    textColor: 'text-white',
  },
  in_progress: {
    label: 'In Progress',
    color: '#F4A261', // squarage-yellow
    bgClass: 'bg-squarage-yellow',
    textColor: 'text-squarage-black',
  },
  completed: {
    label: 'Completed',
    color: '#2A9D8F', // squarage-green
    bgClass: 'bg-squarage-green',
    textColor: 'text-white',
  },
  dead: {
    label: 'Dead',
    color: '#E63946', // squarage-red
    bgClass: 'bg-squarage-red',
    textColor: 'text-white',
  },
}

export default function StatusDropdown({ value, onChange, compact = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const config = statusConfig[value]

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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={cn(
          'rounded font-medium flex items-center justify-center',
          compact ? 'px-2 py-0.5 text-xs min-w-[90px] focus:outline-none focus:ring-1 focus:ring-squarage-green' : 
                   'px-3 py-2 text-sm min-w-[120px] focus:outline-none focus:ring-2 focus:ring-squarage-green',
          config.bgClass,
          config.textColor
        )}
      >
        <span>{config.label}</span>
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
            {(['not_started', 'in_progress', 'completed', 'dead'] as TodoStatus[]).map((status) => {
              const statusConf = statusConfig[status]
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(status)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full font-medium flex items-center justify-center transition-opacity hover:opacity-80',
                    compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
                    statusConf.bgClass,
                    statusConf.textColor
                  )}
                >
                  {statusConf.label}
                </button>
              )
            })}
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}