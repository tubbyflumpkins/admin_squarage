'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/UI/Header'
import WidgetContainer from '@/components/Dashboard/WidgetContainer'
import TodoWidget from '@/components/TodoList/TodoWidget'
import { Calendar, FileText, DollarSign, Users, CheckSquare, Activity, TrendingUp, Package } from 'lucide-react'

export default function Home() {
  const router = useRouter()

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

        {/* Quick Stats at the top with layered glass effect */}
        <div className="bg-squarage-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-squarage-white mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-squarage-white/20 backdrop-blur-sm rounded-lg p-4">
              <CheckSquare size={24} className="text-squarage-yellow mb-2" />
              <p className="text-squarage-white/80 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-squarage-white">-</p>
            </div>
            <div className="bg-squarage-white/20 backdrop-blur-sm rounded-lg p-4">
              <Activity size={24} className="text-squarage-blue mb-2" />
              <p className="text-squarage-white/80 text-sm">Active Projects</p>
              <p className="text-2xl font-bold text-squarage-white">-</p>
            </div>
            <div className="bg-squarage-white/20 backdrop-blur-sm rounded-lg p-4">
              <TrendingUp size={24} className="text-squarage-orange mb-2" />
              <p className="text-squarage-white/80 text-sm">Monthly Revenue</p>
              <p className="text-2xl font-bold text-squarage-white">-</p>
            </div>
            <div className="bg-squarage-white/20 backdrop-blur-sm rounded-lg p-4">
              <Package size={24} className="text-squarage-red mb-2" />
              <p className="text-squarage-white/80 text-sm">Inventory Items</p>
              <p className="text-2xl font-bold text-squarage-white">-</p>
            </div>
          </div>
        </div>

        {/* Main widgets grid with glass effect */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Todo List Widget */}
          <WidgetContainer
            title="Todo List"
            clickable
            onClick={() => router.push('/todo')}
          >
            <div className="bg-squarage-white/90 rounded-lg">
              <TodoWidget />
            </div>
          </WidgetContainer>

          {/* Upcoming Events Widget */}
          <WidgetContainer title="Upcoming Events">
            <div className="flex flex-col items-center justify-center h-[400px] text-center bg-squarage-white/90 rounded-lg">
              <Calendar size={48} className="text-brown-light mb-4" />
              <p className="text-brown-medium text-lg font-medium mb-2">
                Coming Soon
              </p>
              <p className="text-brown-light text-sm">
                Event management will be available here
              </p>
            </div>
          </WidgetContainer>

          {/* Notes Widget */}
          <WidgetContainer title="Notes">
            <div className="flex flex-col items-center justify-center h-[300px] text-center bg-squarage-white/90 rounded-lg">
              <FileText size={48} className="text-brown-light mb-4" />
              <p className="text-brown-medium text-lg font-medium mb-2">
                Coming Soon
              </p>
              <p className="text-brown-light text-sm">
                Quick notes and documentation
              </p>
            </div>
          </WidgetContainer>

          {/* Financial Overview Widget */}
          <WidgetContainer title="Financial Overview">
            <div className="flex flex-col items-center justify-center h-[300px] text-center bg-squarage-white/90 rounded-lg">
              <DollarSign size={48} className="text-brown-light mb-4" />
              <p className="text-brown-medium text-lg font-medium mb-2">
                Coming Soon
              </p>
              <p className="text-brown-light text-sm">
                Revenue and expense tracking
              </p>
            </div>
          </WidgetContainer>
        </div>

        {/* Additional stats section with nested glass layers */}
        <div className="mt-8 bg-squarage-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-squarage-white mb-4">Team Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-squarage-white/15 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-squarage-white/20 rounded-lg p-3 mb-3">
                <Users size={20} className="text-squarage-yellow mb-1" />
                <p className="text-squarage-white/90 text-xs">Team Members</p>
              </div>
              <p className="text-lg font-semibold text-squarage-white">Active Now</p>
              <p className="text-sm text-squarage-white/70">2 members online</p>
            </div>
            <div className="bg-squarage-white/15 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-squarage-white/20 rounded-lg p-3 mb-3">
                <FileText size={20} className="text-squarage-blue mb-1" />
                <p className="text-squarage-white/90 text-xs">Recent Updates</p>
              </div>
              <p className="text-lg font-semibold text-squarage-white">12 Changes</p>
              <p className="text-sm text-squarage-white/70">In the last 24 hours</p>
            </div>
            <div className="bg-squarage-white/15 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-squarage-white/20 rounded-lg p-3 mb-3">
                <Calendar size={20} className="text-squarage-orange mb-1" />
                <p className="text-squarage-white/90 text-xs">Upcoming</p>
              </div>
              <p className="text-lg font-semibold text-squarage-white">3 Deadlines</p>
              <p className="text-sm text-squarage-white/70">This week</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}