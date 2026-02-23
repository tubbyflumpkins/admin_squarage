'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function MonthView({ onAddEvent, onEditEvent }: MonthViewProps) {
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
    return getEventsForDate(date).slice(0, 3) // Show max 3 events per day in month view
  }
  
  const hasMoreEvents = (date: Date) => {
    return getEventsForDate(date).length > 3
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Day Headers - Fixed height */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-t-lg overflow-hidden flex-shrink-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center">
            <span className="text-sm font-semibold text-gray-700">{day}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar Grid - Fills remaining height */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-b-lg overflow-hidden flex-1 auto-rows-fr">
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
                "p-2 bg-white hover:bg-gray-50 cursor-pointer transition-all border-r border-b border-gray-200 overflow-hidden flex flex-col",
                !isCurrentMonth && "bg-gray-50 opacity-60",
                isSelected && "bg-blue-50 ring-2 ring-blue-400",
                isTodayDate && "bg-green-50"
              )}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isCurrentMonth ? "text-gray-800" : "text-gray-400",
                  isTodayDate && "bg-squarage-green text-white px-2 py-0.5 rounded-full"
                )}>
                  {format(date, 'd')}
                </span>
              </div>
              
              {/* Events */}
              <div className="flex-1 overflow-hidden space-y-1">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={`${event.id}-${format(date, 'yyyy-MM-dd')}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditEvent(event)
                    }}
                    className="text-xs p-1 rounded truncate hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ backgroundColor: getEventColor(event) + '40', color: getEventColor(event) }}
                  >
                    {event.allDay ? (
                      <span className="font-medium">{event.title}</span>
                    ) : (
                      <span>
                        <span className="font-medium">{format(new Date(event.startTime), 'HH:mm')}</span>
                        {' '}
                        {event.title}
                      </span>
                    )}
                  </div>
                ))}
                
                {hasMore && (
                  <div className="text-xs text-gray-500 text-center mt-1">
                    +{getEventsForDate(date).length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}