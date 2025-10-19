'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useSalesStore from '@/lib/salesStore'
import { cn } from '@/lib/utils'

interface ChannelDropdownProps {
  value?: string
  onChange: (value: string | undefined) => void
  compact?: boolean
  placeholder?: string
  className?: string
}

export default function ChannelDropdown({
  value,
  onChange,
  compact = false,
  placeholder = 'Channel',
  className,
}: ChannelDropdownProps) {
  const channels = useSalesStore(state => state.channels)
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, minWidth: 0 })

  const selectedChannel = useMemo(
    () => channels.find(channel => channel.id === value),
    [channels, value]
  )

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        minWidth: rect.width,
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (channelId?: string) => {
    onChange(channelId)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/85 text-squarage-black transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-squarage-green/60',
          compact ? 'px-2 py-0.5 text-xs font-medium' : 'px-3 py-0.5 text-sm font-semibold',
          className
        )}
      >
        <span className="truncate">{selectedChannel?.name || placeholder}</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: `${Math.max((dropdownPosition?.minWidth ?? buttonRef.current?.offsetWidth ?? 120) + 8, 96)}px`,
              width: `${Math.max((dropdownPosition?.minWidth ?? buttonRef.current?.offsetWidth ?? 120) + 8, 96)}px`,
              zIndex: 9999,
            }}
          className="rounded-lg border border-white/70 bg-white/85 shadow-xl backdrop-blur-lg"
          >
            <div className="flex flex-col py-1">
              {channels.length === 0 ? (
                <div className="px-3 py-2 text-xs italic text-squarage-black/50">
                  No channels yet. Add one in Settings.
                </div>
              ) : (
                channels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => handleSelect(channel.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-left text-sm text-squarage-black transition-colors hover:bg-squarage-white/70',
                      value === channel.id && 'bg-squarage-green/10 text-squarage-green font-semibold'
                    )}
                  >
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
