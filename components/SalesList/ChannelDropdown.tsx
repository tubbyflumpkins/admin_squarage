'use client'

import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import useSalesStore from '@/lib/salesStore'
import { cn } from '@/lib/utils'
import { useDropdown } from '@/hooks/useDropdown'

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
  const { isOpen, toggle, close, buttonRef, dropdownRef, position } = useDropdown({ gap: 4 })

  const selectedChannel = useMemo(
    () => channels.find(channel => channel.id === value),
    [channels, value]
  )

  const handleSelect = (channelId?: string) => {
    onChange(channelId)
    close()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle()}
        className={cn(
          'flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/85 text-squarage-black transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-squarage-green/60',
          compact ? 'px-2 py-0.5 text-xs font-medium' : 'px-3 py-0.5 text-sm font-semibold',
          className
        )}
      >
        <span className="truncate">{selectedChannel?.name || placeholder}</span>
      </button>

      {isOpen && position &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              minWidth: `${Math.max((position.width ?? buttonRef.current?.offsetWidth ?? 120) + 8, 96)}px`,
              width: `${Math.max((position.width ?? buttonRef.current?.offsetWidth ?? 120) + 8, 96)}px`,
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
