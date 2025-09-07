'use client'

import { useState, useEffect, useRef } from 'react'

interface QuickLinkItemEditableProps {
  value: string
  onSave: (value: string) => void
  onCancel: () => void
  className?: string
  placeholder?: string
}

export default function QuickLinkItemEditable({
  value,
  onSave,
  onCancel,
  className = '',
  placeholder = '',
}: QuickLinkItemEditableProps) {
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSave = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue)
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`
        bg-white/30 text-squarage-black placeholder-squarage-black/50
        px-2 py-1 rounded border border-squarage-black/20
        focus:outline-none focus:border-squarage-black/40
        w-full ${className}
      `}
    />
  )
}