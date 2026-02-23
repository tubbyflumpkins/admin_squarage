'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'

interface FilterOption {
  id: string
  name: string
  color: string
}

interface FilterDropdownProps {
  type: 'category' | 'owner'
  options: FilterOption[]
  selectedValue: string | undefined
  onSelect: (value: string | undefined) => void
  className?: string
}

export default function FilterDropdown({
  type,
  options,
  selectedValue,
  onSelect,
  className
}: FilterDropdownProps) {
  const { isOpen, toggle, close, containerRef } = useDropdown({ mode: 'inline' })

  const selectedOption = options.find(opt => opt.name === selectedValue)
  const label = type === 'category' ? 'Category' : 'Owner'

  const handleSelect = (value: string | undefined) => {
    onSelect(value)
    close()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => toggle()}
        className={cn(
          "w-full px-2 py-1.5 flex items-center justify-center gap-1 hover:text-squarage-green transition-colors",
          "text-xs font-medium",
          selectedValue && "text-white hover:text-white"
        )}
        style={{
          backgroundColor: selectedOption ? selectedOption.color : undefined,
        }}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.name : label}
        </span>
        <ChevronDown size={12} className={cn(
          "flex-shrink-0 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[120px] mt-1 bg-squarage-white border border-brown-light rounded shadow-lg overflow-hidden">
          {/* All option */}
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={cn(
              'w-full px-3 py-2 text-left text-sm font-medium hover:bg-brown-light/10 transition-colors',
              !selectedValue && 'bg-brown-light/20'
            )}
          >
            All {label}s
          </button>

          <div className="border-t border-brown-light/20" />

          {/* Individual options */}
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.name)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm font-medium text-white hover:opacity-80 transition-opacity flex items-center gap-2',
                selectedValue === option.name && 'ring-2 ring-inset ring-squarage-green'
              )}
              style={{ backgroundColor: option.color }}
            >
              <span className="truncate">{option.name}</span>
            </button>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-brown-light italic">
              No {label.toLowerCase()}s defined
            </div>
          )}
        </div>
      )}
    </div>
  )
}
