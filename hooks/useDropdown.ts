'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface DropdownPosition {
  top: number
  left: number
  width: number
}

interface UseDropdownOptions {
  /**
   * 'portal': Fixed positioning, click-outside checks both buttonRef and dropdownRef.
   * 'inline': Relative positioning, click-outside checks containerRef only.
   * Default: 'portal'
   */
  mode?: 'portal' | 'inline'
  /** Pixel gap between anchor and dropdown (portal mode only). Default: 2 */
  gap?: number
}

/**
 * Shared hook for dropdown open/close, click-outside, and portal positioning.
 *
 * Portal mode:  Use `buttonRef`, `dropdownRef`, and `position` to render a portaled dropdown.
 * Inline mode:  Wrap both the trigger and menu in a single element with `containerRef`.
 */
export function useDropdown(options: UseDropdownOptions = {}) {
  const { mode = 'portal', gap = 2 } = options

  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<DropdownPosition | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // For inline mode: a single wrapper that contains both trigger and menu
  const containerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])
  const open = useCallback(() => setIsOpen(true), [])
  const toggle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsOpen(prev => !prev)
  }, [])

  // ── Portal-mode position calculation ──────────────────────────────
  const updatePosition = useCallback(() => {
    const anchor = buttonRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
    })
  }, [gap])

  // Synchronous layout update when open changes (portal mode)
  useLayoutEffect(() => {
    if (mode !== 'portal') return
    if (!isOpen) {
      setPosition(null)
      return
    }
    updatePosition()
  }, [mode, isOpen, updatePosition])

  // Scroll / resize tracking (portal mode)
  useEffect(() => {
    if (mode !== 'portal' || !isOpen) return
    const handleReposition = () => updatePosition()
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [mode, isOpen, updatePosition])

  // ── Click-outside detection ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Ignore clicks inside dropdown portals (used by nested dropdowns)
      if ((event.target as HTMLElement).closest?.('[data-dropdown-portal="true"]')) return

      if (mode === 'inline') {
        if (containerRef.current && !containerRef.current.contains(target)) {
          setIsOpen(false)
        }
      } else {
        const inButton = buttonRef.current?.contains(target)
        const inDropdown = dropdownRef.current?.contains(target)
        if (!inButton && !inDropdown) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, mode])

  return {
    isOpen,
    open,
    close,
    toggle,
    buttonRef,
    dropdownRef,
    containerRef,
    position,
  }
}
