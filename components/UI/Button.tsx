'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'font-medium rounded transition-all duration-200 transform hover:scale-105 active:scale-95',
          {
            'bg-squarage-orange text-white hover:bg-opacity-90': variant === 'primary',
            'bg-transparent border-2 border-squarage-orange text-squarage-orange hover:bg-squarage-orange hover:text-white': variant === 'secondary',
            'bg-squarage-red text-white hover:bg-opacity-90': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button