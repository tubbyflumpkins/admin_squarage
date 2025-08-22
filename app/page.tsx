'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import Header from '@/components/UI/Header'
import TodoWidget from '@/components/TodoList/TodoWidget'
import SalesWidget from '@/components/SalesList/SalesWidget'
import MobileLayout from '@/components/Mobile/Layout/MobileLayout'

export default function Home() {
  const isMobile = useIsMobile()

  // Mobile dashboard view
  if (isMobile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome
            </h1>
            <p className="text-xl text-white/80">
              Squarage Administrator
            </p>
          </div>
        </div>
      </MobileLayout>
    )
  }

  // Desktop view - existing layout
  return (
    <div className="min-h-screen bg-squarage-green">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main header with glass effect */}
        <div className="bg-squarage-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-squarage-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-squarage-white/80">
            Welcome to your Squarage admin panel
          </p>
        </div>

        {/* Widgets grid - ready for future widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* READ-ONLY widget that cannot modify database */}
          <TodoWidget />
          <SalesWidget />
        </div>
      </main>
    </div>
  )
}