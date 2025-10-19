'use client'

import { RefObject, useCallback, useLayoutEffect, useState } from 'react'

interface DropdownPosition {
  top: number
  left: number
  width: number
}

export function useDropdownPosition<T extends HTMLElement>(
  isOpen: boolean,
  anchorRef: RefObject<T>
) {
  const [position, setPosition] = useState<DropdownPosition | null>(null)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    updatePosition()

    const handleScroll = () => updatePosition()
    window.addEventListener('resize', handleScroll)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleScroll)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, updatePosition])

  return position
}
