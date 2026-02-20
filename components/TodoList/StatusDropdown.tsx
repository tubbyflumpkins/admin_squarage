'use client'

import { TodoStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'
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
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown()
  const config = statusConfig[value]

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
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
            {(['not_started', 'in_progress', 'completed', 'dead'] as TodoStatus[]).map((status) => {
              const statusConf = statusConfig[status]
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(status)
                    close()
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
