'use client'

import { useCallback, useEffect, useRef } from 'react'

interface UseInlineEditOptions {
  /** Called when the user clicks outside or presses Enter */
  onSubmit: () => void
  /** Called when the user presses Escape */
  onCancel: () => void
}

/**
 * Shared hook for inline-editable rows.
 *
 * Provides:
 * - `containerRef` — attach to the editable row wrapper
 * - `handleKeyDown` — attach to text inputs (Enter → submit, Escape → cancel)
 * - Click-outside detection (with 100ms delay and dropdown-portal exclusion)
 */
export function useInlineEdit({ onSubmit, onCancel }: UseInlineEditOptions) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Stable refs so the effect doesn't re-register on every render
  const onSubmitRef = useRef(onSubmit)
  const onCancelRef = useRef(onCancel)
  useEffect(() => { onSubmitRef.current = onSubmit }, [onSubmit])
  useEffect(() => { onCancelRef.current = onCancel }, [onCancel])

  // Click-outside → submit
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Ignore clicks inside dropdown portals
      if (target.closest?.('[data-dropdown-portal="true"]')) return
      if (containerRef.current && !containerRef.current.contains(target)) {
        onSubmitRef.current()
      }
    }

    // 100ms delay avoids immediate trigger from the click that opened the edit
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmitRef.current()
    } else if (e.key === 'Escape') {
      onCancelRef.current()
    }
  }, [])

  return { containerRef, handleKeyDown }
}
