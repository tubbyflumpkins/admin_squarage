'use client'

import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarClock } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import { format } from 'date-fns'
import { CalendarView } from '@/lib/calendarTypes'

export default function CalendarHeader() {
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
        return format(selectedDate, 'EEEE, MMMM d, yyyy')
      case 'week':
        const weekStart = new Date(selectedDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        } else {
          return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`
        }
      case 'month':
      default:
        return format(selectedDate, 'MMMM yyyy')
    }
  }

  const viewOptions: { value: CalendarView; label: string; icon: any }[] = [
    { value: 'month', label: 'Month', icon: Calendar },
    { value: 'week', label: 'Week', icon: CalendarDays },
    { value: 'day', label: 'Day', icon: CalendarClock },
  ]

  return (
    <div className="flex items-center justify-between">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={navigatePrevious}
          className="p-1 rounded-lg bg-white hover:bg-gray-100 transition-all border border-gray-200"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">
          {getDateDisplay()}
        </h2>
        
        <button
          onClick={navigateNext}
          className="p-1 rounded-lg bg-white hover:bg-gray-100 transition-all border border-gray-200"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
        
        <button
          onClick={goToToday}
          className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-all border border-gray-200"
        >
          Today
        </button>
      </div>
      
      {/* View Switcher */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        {viewOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setView(value)}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              currentView === value
                ? 'bg-white text-squarage-green font-medium shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            <Icon size={14} />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}