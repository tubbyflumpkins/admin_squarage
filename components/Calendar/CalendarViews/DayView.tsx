'use client'

import { useMemo, useRef, useEffect } from 'react'
import { format, isToday, startOfDay, endOfDay } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface DayViewProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function DayView({ onAddEvent, onEditEvent }: DayViewProps) {
  const { selectedDate, events, getEventsForDateRange, calendarTypes } = useCalendarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const timeSlots = useMemo(() => {
    const slots = []
    // Start at 5 AM and go through 11 PM
    for (let hour = 5; hour < 24; hour++) {
      slots.push({ hour, minute: 0 })
    }
    // Add midnight (00:00) as the last slot
    slots.push({ hour: 0, minute: 0 })
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
      const scrollPosition = currentHour * 100 // Approximate height per hour
      scrollContainerRef.current.scrollTop = scrollPosition - 100 // Center it a bit
    }
  }, [selectedDate])
  
  const getEventColor = (event: CalendarEvent) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  // Calculate event position and height for multi-hour spanning
  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    
    // Calculate start position
    const startHour = eventStart.getHours()
    const startMinutes = eventStart.getMinutes()
    const startSlotIndex = timeSlots.findIndex(slot => slot.hour === startHour)
    
    // Calculate duration in hours
    const durationMs = eventEnd.getTime() - eventStart.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    
    // Each hour slot is approximately 50px (min-h-[50px])
    const slotHeight = 50
    const top = startSlotIndex * slotHeight + (startMinutes / 60) * slotHeight
    const height = Math.max(durationHours * slotHeight - 2, 20) // Minimum height of 20px
    
    return {
      position: 'absolute' as const,
      top: `${top}px`,
      height: `${height}px`,
      left: '0',
      right: '0',
      zIndex: 10
    }
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
    const slotIndex = timeSlots.findIndex(slot => slot.hour === hours)
    if (slotIndex === -1) return null // Current hour not in visible slots
    
    // Each slot is 50px high, calculate position based on slot index and minutes
    const position = slotIndex * 50 + (minutes / 60) * 50
    return position
  }
  
  const currentTimePosition = getCurrentTimePosition()
  
  return (
    <div className="w-full">
      {/* Date Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-4 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {format(selectedDate, 'EEEE')}
            </h3>
            <p className="text-gray-600">{format(selectedDate, 'MMMM d, yyyy')}</p>
          </div>
          {isToday(selectedDate) && (
            <div className="bg-squarage-green text-white px-3 py-1 rounded-full text-sm font-medium">
              Today
            </div>
          )}
        </div>
      </div>
      
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
          <div className="text-sm text-gray-600 font-medium mb-2">All-day events</div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEditEvent(event)}
                className="p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: getEventColor(event) + '40', color: getEventColor(event) }}
              >
                <div className="font-medium text-sm">{event.title}</div>
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
        className="bg-white border border-gray-200 rounded-b-lg overflow-hidden max-h-[600px] overflow-y-auto relative scrollbar-none"
      >
        {/* Current time indicator */}
        {currentTimePosition !== null && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute left-[16.67%] -top-3 bg-red-500 text-white text-xs px-1 rounded">
              {format(new Date(), 'HH:mm')}
            </div>
          </div>
        )}
        
        {/* Time slots grid */}
        <div className="relative">
          {timeSlots.map(({ hour, minute }, index) => {
            const isCurrentTime = isToday(selectedDate) && new Date().getHours() === hour
            
            return (
              <div
                key={`${hour}-${minute}`}
                className={cn(
                  "flex h-[50px] relative",
                  isCurrentTime && "bg-green-50"
                )}
              >
                {/* Time label - positioned to align with top border */}
                <div className="w-16 bg-gray-50 relative flex-shrink-0">
                  {index > 0 && (
                    <div className="absolute -top-3 right-2 bg-gray-50 px-1">
                      <span className="text-sm text-gray-600 font-medium">
                        {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                      </span>
                    </div>
                  )}
                  {index === 0 && (
                    <div className="pt-1 pr-2 text-right">
                      <span className="text-sm text-gray-600 font-medium">
                        {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Event area with border only on right side */}
                <div
                  className={cn(
                    "flex-1 hover:bg-gray-50 cursor-pointer transition-colors relative",
                    index > 0 && "border-t border-gray-200"
                  )}
                  onClick={() => handleTimeSlotClick(hour)}
                />
              </div>
            )
          })}
          
          {/* Events overlay - positioned absolutely over the grid */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none">
            <div className="flex h-full">
              <div className="w-16 flex-shrink-0"></div>
              <div className="flex-1 relative pointer-events-auto">
                {timedEvents.map(event => {
                  const eventStart = new Date(event.startTime)
                  const eventEnd = new Date(event.endTime)
                  const style = getEventStyle(event)
                  
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditEvent(event)
                      }}
                      className="absolute left-2 right-2 p-2 rounded cursor-pointer hover:opacity-90 transition-opacity text-white overflow-hidden"
                      style={{ 
                        ...style,
                        backgroundColor: getEventColor(event)
                      }}
                    >
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                      </div>
                      {event.location && style.height && parseInt(style.height) > 50 && (
                        <div className="text-xs opacity-90 mt-1 truncate">{event.location}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}