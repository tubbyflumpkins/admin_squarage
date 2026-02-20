'use client'

import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'
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
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown()

  const selectedOption = options.find(opt => opt.name === value)

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle()}
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
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.name)
                  close()
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
