'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ColorPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (color: string) => void
  currentColor?: string
  triggerRef: React.RefObject<HTMLElement>
}

// 8 bold colors + 8 pastel versions
const colorPalette = {
  bold: [
    '#4A9B4E', // Squarage Green
    '#F7901E', // Squarage Orange
    '#01BAD5', // Squarage Blue
    '#F04E23', // Squarage Red
    '#E91E63', // Pink
    '#F5B74C', // Squarage Yellow
    '#9B59B6', // Purple
    '#2274A5', // Dark Blue
  ],
  pastel: [
    '#7EC183', // Light Green
    '#FFBE6B', // Light Orange
    '#5DD4E8', // Light Blue
    '#FF8A70', // Light Red
    '#F8BBD0', // Light Pink
    '#FFD485', // Light Yellow
    '#C39BD3', // Light Purple
    '#5A9FD4', // Light Dark Blue
  ]
}

export default function ColorPicker({ isOpen, onClose, onSelect, currentColor, triggerRef }: ColorPickerProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const pickerHeight = 100 // Approximate height of color picker
      const pickerWidth = 280 // Approximate width of color picker
      
      let top = rect.bottom + 8
      let left = rect.left
      
      // Check if picker would go off the bottom of the screen
      if (top + pickerHeight > window.innerHeight) {
        top = rect.top - pickerHeight - 8
      }
      
      // Check if picker would go off the right of the screen
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 16
      }
      
      // Ensure it doesn't go off the left
      if (left < 16) {
        left = 16
      }
      
      setPosition({ top, left })
    }
  }, [isOpen, triggerRef])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[100] bg-squarage-white rounded-lg shadow-2xl p-3 border border-brown-light"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="space-y-2">
        <div className="flex gap-1">
          {colorPalette.bold.map((color) => (
            <button
              key={color}
              onClick={() => {
                onSelect(color)
                onClose()
              }}
              className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${
                currentColor === color ? 'border-squarage-black ring-2 ring-squarage-green' : 'border-brown-light'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {colorPalette.pastel.map((color) => (
            <button
              key={color}
              onClick={() => {
                onSelect(color)
                onClose()
              }}
              className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${
                currentColor === color ? 'border-squarage-black ring-2 ring-squarage-green' : 'border-brown-light'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}