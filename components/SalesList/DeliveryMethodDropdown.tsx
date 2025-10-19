'use client'

import { useState, useRef, useEffect } from 'react'
import { Truck, MapPin } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { DeliveryMethod } from '@/lib/salesTypes'
import { useDropdownPosition } from './hooks/useDropdownPosition'

interface DeliveryMethodDropdownProps {
  value: DeliveryMethod
  onChange: (value: DeliveryMethod) => void
  compact?: boolean
}

const deliveryOptions: { value: DeliveryMethod; label: string; icon: React.ReactNode; bgClass: string; textColor: string }[] = [
  { 
    value: 'shipping', 
    label: 'Shipping', 
    icon: <Truck className="w-3 h-3" />,
    bgClass: 'bg-squarage-blue',
    textColor: 'text-white'
  },
  { 
    value: 'local', 
    label: 'Local', 
    icon: <MapPin className="w-3 h-3" />,
    bgClass: 'bg-squarage-orange',
    textColor: 'text-white'
  },
]

export default function DeliveryMethodDropdown({ value, onChange, compact = false }: DeliveryMethodDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownPosition = useDropdownPosition(isOpen, buttonRef)

  const currentMethod = deliveryOptions.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newValue: DeliveryMethod) => {
    onChange(newValue)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'}
          ${currentMethod?.bgClass || 'bg-gray-100'} ${currentMethod?.textColor || 'text-gray-700'}
          rounded font-medium hover:opacity-80 transition-all w-full
          flex items-center justify-center gap-1 whitespace-nowrap
        `}
      >
        {currentMethod?.icon}
        <span>{currentMethod?.label || 'Select'}</span>
      </button>

      {isOpen && dropdownPosition && (() => {
        const baseWidth = dropdownPosition.width || buttonRef.current?.offsetWidth || 120
        const menuWidth = Math.max(baseWidth + 8, 96)
        return createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${menuWidth}px`,
            width: `${menuWidth}px`,
            zIndex: 9999
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1"
        >
          {deliveryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`
                w-full text-left px-2 py-1.5 hover:bg-gray-50 transition-colors
                ${compact ? 'text-xs' : 'text-sm'}
              `}
            >
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${option.bgClass} ${option.textColor}`}>
                {option.icon}
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
