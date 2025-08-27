'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import { format } from 'date-fns'
import { CalendarView } from '@/lib/calendarTypes'

export default function CalendarHeaderMobile() {
  const {
    currentView,
    selectedDate,
    setView,
    navigateNext,
    navigatePrevious,
    goToToday,
  } = useCalendarStore()

  const getDateDisplay = () => {
    switch (currentView) {
      case 'day':
        return format(selectedDate, 'EEE, MMM d')
      case 'month':
      default:
        return format(selectedDate, 'MMMM yyyy')
    }
  }

  const viewOptions: CalendarView[] = ['month', 'day']

  return (
    <div className="space-y-3">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={navigatePrevious}
          className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {getDateDisplay()}
          </h2>
        </div>
        
        <button
          onClick={navigateNext}
          className="p-1.5 rounded-lg bg-white hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      </div>
      
      {/* View Switcher and Today Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 bg-gray-100 rounded-lg p-0.5">
          {viewOptions.map((view) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all capitalize ${
                currentView === view
                  ? 'bg-white text-squarage-green shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
        
        <button
          onClick={goToToday}
          className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition-colors border border-gray-200"
        >
          Today
        </button>
      </div>
    </div>
  )
}