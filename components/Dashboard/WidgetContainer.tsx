'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WidgetContainerProps {
  children: ReactNode
  /** Route to navigate to when the widget is clicked */
  href?: string
  /**
   * 'overlay': Entire widget is clickable; an overlay blocks inner content interaction.
   * 'interactive': Only the wrapper is a navigation target; inner content remains interactive.
   * Default: 'overlay'
   */
  mode?: 'overlay' | 'interactive'
  className?: string
}

export default function WidgetContainer({
  children,
  href,
  mode = 'overlay',
  className,
}: WidgetContainerProps) {
  const router = useRouter()

  const handleClick = href ? () => router.push(href) : undefined

  return (
    <div
      className={cn(
        'relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 transition-all duration-200 hover:shadow-3xl',
        href && 'hover:bg-white/40',
        href && mode === 'overlay' && 'cursor-pointer',
        className
      )}
      onClick={mode === 'overlay' ? handleClick : undefined}
    >
      {/* Overlay blocks inner interactions in overlay mode */}
      {mode === 'overlay' && href && (
        <div className="absolute inset-0 z-10 rounded-2xl" />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
