'use client'

import { useRouter } from 'next/navigation'
import { ClipboardList, DollarSign, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileTabBarProps {
  currentTab: 'todo' | 'sales' | 'settings'
}

export default function MobileTabBar({ currentTab }: MobileTabBarProps) {
  const router = useRouter()

  const tabs = [
    {
      id: 'todo' as const,
      label: 'Todo',
      icon: ClipboardList,
      path: '/todo'
    },
    {
      id: 'sales' as const,
      label: 'Sales',
      icon: DollarSign,
      path: '/sales'
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200">
      {/* Safe area padding for iPhone */}
      <div className="flex items-center justify-around py-2 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all',
                isActive ? 'text-squarage-green' : 'text-gray-500'
              )}
            >
              <Icon 
                size={24} 
                className={cn(
                  'transition-all',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}