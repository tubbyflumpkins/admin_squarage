'use client'

import { useRouter } from 'next/navigation'
import { ClipboardList, DollarSign, Receipt, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/lib/permissionKeys'

interface MobileTabBarProps {
  currentTab: 'todo' | 'sales' | 'expenses' | 'calendar' | 'settings'
}

const ALL_TABS = [
  { id: 'todo' as const, label: 'Todo', icon: ClipboardList, path: '/todo', permission: 'todo' as Permission },
  { id: 'sales' as const, label: 'Sales', icon: DollarSign, path: '/sales', permission: 'sales' as Permission },
  { id: 'expenses' as const, label: 'Expenses', icon: Receipt, path: '/expenses', permission: 'expenses' as Permission },
  { id: 'calendar' as const, label: 'Calendar', icon: Calendar, path: '/calendar', permission: 'calendar' as Permission },
  { id: 'settings' as const, label: 'Settings', icon: Settings, path: '/settings', permission: null },
]

export default function MobileTabBar({ currentTab }: MobileTabBarProps) {
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const tabs = ALL_TABS.filter(tab => !tab.permission || hasPermission(tab.permission))

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
