'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { format, addDays, subDays, isToday, isPast, isFuture, startOfDay, endOfDay, isSameMonth, isSameDay } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface ListViewMobileProps {
  onEditEvent: (event: CalendarEvent) => void
}

export default function ListViewMobile({ onEditEvent }: ListViewMobileProps) {
  const { getEventsForDateRange, calendarTypes } = useCalendarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentMonth, setCurrentMonth] = useState('')
  
  // Generate days starting from today
  const days = useMemo(() => {
    const today = new Date()
    const daysArray = []
    
    // Today first
    daysArray.push(today)
    
    // Future days (365 days)
    for (let i = 1; i <= 365; i++) {
      daysArray.push(addDays(today, i))
    }
    
    return daysArray
  }, [])
  
  // Track scroll to update month header
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollTop = container.scrollTop
      const containerRect = container.getBoundingClientRect()
      
      // Find the first visible day
      const dayElements = container.querySelectorAll('[data-date]')
      for (const element of dayElements) {
        const rect = element.getBoundingClientRect()
        if (rect.top >= containerRect.top && rect.top <= containerRect.top + 100) {
          const date = element.getAttribute('data-date')
          if (date) {
            setCurrentMonth(format(new Date(date), 'MMMM yyyy'))
          }
          break
        }
      }
    }
  }
  
  useEffect(() => {
    // Set initial month
    setCurrentMonth(format(new Date(), 'MMMM yyyy'))
  }, [])
  
  const getEventColor = (event: CalendarEvent) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  const getEventsForDay = (date: Date) => {
    return getEventsForDateRange(startOfDay(date), endOfDay(date))
  }
  
  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day'
    return `${format(new Date(event.startTime), 'HH:mm')} - ${format(new Date(event.endTime), 'HH:mm')}`
  }
  
  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Sticky Month Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2">
        <div className="text-lg font-semibold text-red-500">
          {currentMonth}
        </div>
      </div>
      
      {/* Scrollable List */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div>
          {days.map((date, index) => {
            const events = getEventsForDay(date)
            const isTodayDate = isToday(date)
            const dayOfWeek = format(date, 'EEEE').toUpperCase()
            const dayNumber = format(date, 'd')
            const monthName = format(date, 'MMM').toUpperCase()
            
            // Show month divider when month changes
            const showMonthDivider = index === 0 || !isSameMonth(date, days[index - 1])
            
            return (
              <div key={index} data-date={date.toISOString()}>
                {showMonthDivider && index !== 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-600">
                      {format(date, 'MMMM yyyy').toUpperCase()}
                    </div>
                  </div>
                )}
                
                <div className="border-b border-gray-100">
                  {/* Date Header Row */}
                  <div className="flex items-baseline px-4 pt-3 pb-1">
                    <div className={cn(
                      "text-xs font-semibold",
                      isTodayDate ? "text-red-500" : "text-gray-900"
                    )}>
                      {dayOfWeek}, {monthName} {dayNumber}
                    </div>
                  </div>
                  
                  {/* Events */}
                  {events.length > 0 ? (
                    <div className="px-4 pb-3">
                      {events.map(event => {
                        const isAllDay = event.allDay
                        const eventTime = isAllDay 
                          ? 'all-day' 
                          : format(new Date(event.startTime), 'h:mm a')
                        
                        return (
                          <div
                            key={event.id}
                            onClick={() => onEditEvent(event)}
                            className="flex items-start py-2 cursor-pointer hover:bg-gray-50 -mx-4 px-4"
                          >
                            {/* Color indicator */}
                            <div 
                              className="w-1 h-4 rounded-full mt-0.5 mr-3 flex-shrink-0"
                              style={{ backgroundColor: getEventColor(event) }}
                            />
                            
                            {/* Event details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 mr-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {event.title}
                                  </div>
                                  {event.location && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 flex-shrink-0">
                                  {eventTime}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-4 pb-3">
                      <div className="text-sm text-gray-400">
                        No events
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}