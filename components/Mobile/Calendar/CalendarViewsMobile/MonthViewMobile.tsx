'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface MonthViewMobileProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function MonthViewMobile({ onAddEvent, onEditEvent }: MonthViewMobileProps) {
  const { selectedDate, getEventsForDate, calendarTypes } = useCalendarStore()
  
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    const days = []
    let currentDate = startDate
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }
    
    return days
  }, [selectedDate])
  
  const getEventColor = (event: CalendarEvent) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  const getEventsForDay = (date: Date) => {
    return getEventsForDate(date).slice(0, 2) // Show max 2 events per day in mobile month view
  }
  
  const hasMoreEvents = (date: Date) => {
    return getEventsForDate(date).length > 2
  }
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center">
            <span className="text-xs font-semibold text-gray-700">{day}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {calendarDays.map((date, index) => {
          const events = getEventsForDay(date)
          const hasMore = hasMoreEvents(date)
          const isCurrentMonth = isSameMonth(date, selectedDate)
          const isSelected = isSameDay(date, selectedDate)
          const isTodayDate = isToday(date)
          
          return (
            <div
              key={index}
              onClick={() => onAddEvent(date)}
              className={cn(
                "min-h-[60px] p-1 bg-white",
                !isCurrentMonth && "bg-gray-50 opacity-60",
                isSelected && "bg-blue-50 ring-2 ring-blue-400",
                isTodayDate && "bg-green-50"
              )}
            >
              {/* Date Number */}
              <div className={cn(
                "text-xs font-medium text-center mb-1",
                isCurrentMonth ? "text-gray-800" : "text-gray-400",
                isTodayDate && "bg-squarage-green text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto"
              )}>
                {format(date, 'd')}
              </div>
              
              {/* Event Dots */}
              <div className="flex flex-wrap gap-0.5 justify-center">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditEvent(event)
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                ))}
                {hasMore && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}