'use client'

import { useMemo } from 'react'
import { format, startOfWeek, addDays, isToday, isSameDay, startOfDay, endOfDay } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function WeekView({ onAddEvent, onEditEvent }: WeekViewProps) {
  const { selectedDate, events, getEventsForDateRange, calendarTypes } = useCalendarStore()
  
  const weekDays = useMemo(() => {
    // Start week on Monday (weekStartsOn: 1)
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const days = []
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    
    return days
  }, [selectedDate])
  
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
  
  const getEventColor = (event: CalendarEvent) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  // Get all timed events for a specific day
  const getTimedEventsForDay = (date: Date) => {
    const dayEvents = getEventsForDateRange(startOfDay(date), endOfDay(date))
    return dayEvents.filter(event => !event.allDay)
  }
  
  // Calculate event position and height for multi-hour spanning
  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    
    // Calculate start position
    const startHour = eventStart.getHours()
    const startMinutes = eventStart.getMinutes()
    const startSlotIndex = timeSlots.findIndex(slot => slot === startHour)
    
    // Calculate duration in hours
    const durationMs = eventEnd.getTime() - eventStart.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    
    // Each hour slot is approximately 50px
    const slotHeight = 50
    const top = startSlotIndex * slotHeight + (startMinutes / 60) * slotHeight
    const height = Math.max(durationHours * slotHeight - 2, 20) // Minimum height of 20px
    
    return {
      position: 'absolute' as const,
      top: `${top}px`,
      height: `${height}px`,
      left: '2px',
      right: '2px',
      zIndex: 10
    }
  }
  
  const getAllDayEvents = (date: Date) => {
    const dayEvents = getEventsForDateRange(startOfDay(date), endOfDay(date))
    return dayEvents.filter(event => event.allDay)
  }
  
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const clickedDate = new Date(date)
    clickedDate.setHours(hour, 0, 0, 0)
    onAddEvent(clickedDate)
  }
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-8 border border-gray-200 rounded-t-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-r border-gray-200">
            {/* Empty corner cell */}
          </div>
          {weekDays.map((date, index) => (
            <div
              key={index}
              className={cn(
                "bg-gray-50 p-3 text-center border-r border-gray-200 last:border-r-0",
                isToday(date) && "bg-green-50"
              )}
            >
              <div className="text-xs text-gray-600">{format(date, 'EEE')}</div>
              <div className={cn(
                "text-lg font-semibold text-gray-800",
                isToday(date) && "bg-squarage-green text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* All-day events row */}
        <div className="grid grid-cols-8 border-x border-gray-200">
          <div className="bg-gray-50 p-2 text-right border-r border-gray-200">
            <span className="text-xs text-gray-600 font-medium">All Day</span>
          </div>
          {weekDays.map((date, index) => {
            const allDayEvents = getAllDayEvents(date)
            return (
              <div
                key={index}
                className="bg-white p-1 min-h-[30px] hover:bg-gray-50 cursor-pointer border-r border-gray-200 last:border-r-0 border-b"
                onClick={() => onAddEvent(date)}
              >
                {allDayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditEvent(event)
                    }}
                    className="text-xs p-1 mb-1 rounded truncate hover:opacity-80 cursor-pointer"
                    style={{ backgroundColor: getEventColor(event) + '40', color: getEventColor(event) }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        
        {/* Time slots grid */}
        <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-b-lg scrollbar-none relative">
          <div className="relative">
            {/* Hour rows */}
            {timeSlots.map((hour, index) => (
              <div key={hour} className="grid grid-cols-8 h-[50px] relative">
                <div className="bg-gray-50 relative">
                  {index > 0 && (
                    <div className="absolute -top-3 right-2 bg-gray-50 px-1">
                      <span className="text-sm text-gray-600 font-medium">{format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}</span>
                    </div>
                  )}
                  {index === 0 && (
                    <div className="pt-1 pr-2 text-right">
                      <span className="text-sm text-gray-600 font-medium">{format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}</span>
                    </div>
                  )}
                </div>
                {weekDays.map((date, dayIndex) => {
                  const isTodaySlot = isToday(date) && new Date().getHours() === hour
                  
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={cn(
                        "bg-white hover:bg-gray-50 cursor-pointer border-r border-gray-200 last:border-r-0",
                        index > 0 && "border-t border-gray-200",
                        isTodaySlot && "bg-green-50"
                      )}
                      onClick={() => handleTimeSlotClick(date, hour)}
                    />
                  )
                })}
              </div>
            ))}
            
            {/* Events overlay */}
            <div className="absolute top-0 left-0 right-0 pointer-events-none">
              <div className="grid grid-cols-8">
                <div></div> {/* Empty space for time column */}
                {weekDays.map((date, dayIndex) => (
                  <div key={dayIndex} className="relative pointer-events-auto">
                    {getTimedEventsForDay(date).map(event => {
                      const eventStart = new Date(event.startTime)
                      const eventEnd = new Date(event.endTime)
                      const style = getEventStyle(event)

                      return (
                        <div
                          key={`${event.id}-${format(date, 'yyyy-MM-dd')}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditEvent(event)
                          }}
                          className="absolute p-1 rounded cursor-pointer hover:opacity-90 transition-opacity text-white overflow-hidden"
                          style={{
                            ...style,
                            backgroundColor: getEventColor(event)
                          }}
                        >
                          <div className="text-xs font-medium truncate">{event.title}</div>
                          {style.height && parseInt(style.height) > 30 && (
                            <div className="text-[10px] opacity-90">
                              {format(eventStart, 'HH:mm')}-{format(eventEnd, 'HH:mm')}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}