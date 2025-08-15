'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WidgetContainerProps {
  title: string
  children: ReactNode
  className?: string
  onClick?: () => void
  clickable?: boolean
}

export default function WidgetContainer({
  title,
  children,
  className,
  onClick,
  clickable = false,
}: WidgetContainerProps) {
  return (
    <div
      className={cn(
        'bg-squarage-white/20 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300',
        clickable && 'cursor-pointer hover:bg-squarage-white/30 hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <div className="bg-squarage-white/10 backdrop-blur-sm p-4 border-b border-squarage-white/20">
        <h2 className="text-xl font-bold text-squarage-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}