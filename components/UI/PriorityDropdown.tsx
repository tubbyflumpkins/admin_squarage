'use client'

import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'
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
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown()

  const currentPriority = value ? priorityConfig[value] : null

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle()}
        className={cn(
          'w-full rounded font-medium flex items-center justify-center',
          compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-2 text-sm',
          currentPriority ? `text-white ${currentPriority.bgClass}` : 'bg-brown-light/20 text-brown-medium'
        )}
      >
        <span>{currentPriority ? currentPriority.label : placeholder}</span>
      </button>

      {isOpen && position && (
        <DropdownPortal>
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-squarage-white border border-brown-light rounded shadow-lg overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`
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
                    close()
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
