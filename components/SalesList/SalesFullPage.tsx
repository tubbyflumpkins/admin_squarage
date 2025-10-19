'use client'

import { useState, type ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { LayoutDashboard, LineChart as LineChartIcon } from 'lucide-react'
import SalesListGrid from './SalesListGrid'
import SalesAnalysis from './SalesAnalysis'

type SalesTab = 'tracker' | 'analysis'

const tabs: {
  id: SalesTab
  label: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'tracker', label: 'Tracker', icon: LayoutDashboard },
  { id: 'analysis', label: 'Analysis', icon: LineChartIcon },
]

export default function SalesFullPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>('tracker')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Sales Tracker</h1>
            <p className="text-white/70 text-sm">
              Monitor deals or dive into revenue trends from the same workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const isActive = tab.id === activeTab
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200',
                  'transform hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5',
                  isActive
                    ? 'backdrop-blur-md bg-white/50 text-squarage-black shadow-lg border border-white/60'
                    : 'backdrop-blur-md bg-white/20 text-white hover:bg-white/30 border border-white/30'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6">
          {activeTab === 'tracker' ? (
            <SalesListGrid isFullPage isGlassView />
          ) : (
            <SalesAnalysis />
          )}
        </div>
      </div>
    </div>
  )
}
