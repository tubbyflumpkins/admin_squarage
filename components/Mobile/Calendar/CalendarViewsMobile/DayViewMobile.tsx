'use client'

import { useMemo, useRef, useEffect } from 'react'
import { format, isToday, startOfDay, endOfDay } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface DayViewMobileProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function DayViewMobile({ onAddEvent, onEditEvent }: DayViewMobileProps) {
  const { selectedDate, getEventsForDateRange, calendarTypes } = useCalendarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const timeSlots = useMemo(() => {
    const slots = []
    // Start at 5 AM and go through 11 PM
    for (let hour = 5; hour < 24; hour++) {
      slots.push(hour)
    }
    // Add midnight (00:00) as the last slot
    slots.push(0)
    return slots
  }, [])
  
  const dayEvents = useMemo(() => {
    return getEventsForDateRange(startOfDay(selectedDate), endOfDay(selectedDate))
  }, [selectedDate, getEventsForDateRange])
  
  const allDayEvents = dayEvents.filter(event => event.allDay)
  const timedEvents = dayEvents.filter(event => !event.allDay)
  
  // Scroll to current time on mount and when date changes
  useEffect(() => {
    if (scrollContainerRef.current && isToday(selectedDate)) {
      const currentHour = new Date().getHours()
      // Find the index of the current hour in our reordered slots
      const slotIndex = timeSlots.findIndex(hour => hour === currentHour)
      if (slotIndex !== -1) {
        const scrollPosition = slotIndex * 60 // Approximate height per hour
        scrollContainerRef.current.scrollTop = scrollPosition - 60
      }
    }
  }, [selectedDate, timeSlots])
  
  const getEventColor = (event: CalendarEvent) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  const getEventsForHour = (hour: number) => {
    const hourStart = new Date(selectedDate)
    hourStart.setHours(hour, 0, 0, 0)
    const hourEnd = new Date(selectedDate)
    hourEnd.setHours(hour, 59, 59, 999)
    
    return timedEvents.filter(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      return (
        (eventStart >= hourStart && eventStart < hourEnd) ||
        (eventEnd > hourStart && eventEnd <= hourEnd) ||
        (eventStart <= hourStart && eventEnd >= hourEnd)
      )
    })
  }
  
  const handleTimeSlotClick = (hour: number) => {
    const clickedDate = new Date(selectedDate)
    clickedDate.setHours(hour, 0, 0, 0)
    onAddEvent(clickedDate)
  }
  
  const getCurrentTimePosition = () => {
    if (!isToday(selectedDate)) return null
    
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // Find the index of the current hour in our time slots
    const slotIndex = timeSlots.findIndex(slot => slot === hours)
    if (slotIndex === -1) return null // Current hour not in visible slots
    
    // Each slot is 60px high, calculate position based on slot index and minutes
    const position = slotIndex * 60 + (minutes / 60) * 60
    return position
  }
  
  const currentTimePosition = getCurrentTimePosition()
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Date Header */}
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-800">
              {format(selectedDate, 'EEEE')}
            </div>
            <div className="text-sm text-gray-600">
              {format(selectedDate, 'MMMM d, yyyy')}
            </div>
          </div>
          {isToday(selectedDate) && (
            <div className="bg-squarage-green text-white px-2 py-1 rounded-full text-xs font-medium">
              Today
            </div>
          )}
        </div>
      </div>
      
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="bg-gray-50 p-3 border-b border-gray-200">
          <div className="text-xs text-gray-600 mb-2">All-day events</div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEditEvent(event)}
                className="p-2 rounded text-sm"
                style={{ backgroundColor: getEventColor(event) + '40', color: getEventColor(event) }}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-xs opacity-80">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Time grid */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[500px] overflow-y-auto relative"
      >
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute left-2 -top-2 bg-red-500 text-white text-[10px] px-1 rounded">
              {format(new Date(), 'HH:mm')}
            </div>
          </div>
        )}
        
        {/* Time slots */}
        {timeSlots.map((hour, index) => {
          const events = getEventsForHour(hour)
          const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour
          
          return (
            <div
              key={hour}
              className={cn(
                "min-h-[60px] flex bg-white relative",
                isCurrentHour && "bg-green-50"
              )}
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Time label */}
              <div className="w-12 flex-shrink-0 bg-gray-50 relative">
                {index > 0 && (
                  <div className="absolute -top-2 right-1 bg-gray-50 px-0.5">
                    <span className="text-xs text-gray-500">
                      {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                    </span>
                  </div>
                )}
                {index === 0 && (
                  <div className="pt-1 pr-1 text-right">
                    <span className="text-xs text-gray-500">
                      {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Events */}
              <div className={cn(
                "flex-1 p-1",
                index > 0 && "border-t border-gray-200"
              )}>
                {events.map(event => {
                  const eventStart = new Date(event.startTime)
                  const isStarting = eventStart.getHours() === hour
                  
                  if (!isStarting) return null
                  
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditEvent(event)
                      }}
                      className="p-2 mb-1 rounded text-white"
                      style={{ backgroundColor: getEventColor(event) }}
                    >
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs opacity-80">
                        {format(eventStart, 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-80 mt-0.5">{event.location}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}