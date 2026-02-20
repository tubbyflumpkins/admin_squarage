'use client'

import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'
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
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown()

  const selectedOption = options.find(opt => opt.name === value)

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle()}
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

      {isOpen && position && (
        <DropdownPortal>
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-squarage-white border border-brown-light rounded shadow-lg overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
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
