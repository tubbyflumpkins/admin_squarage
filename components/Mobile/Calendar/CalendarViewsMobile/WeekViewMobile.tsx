'use client'

import { useMemo, useRef } from 'react'
import { format, startOfWeek, addDays, isToday, isSameDay, startOfDay, endOfDay } from 'date-fns'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { cn } from '@/lib/utils'

interface WeekViewMobileProps {
  onAddEvent: (date: Date) => void
  onEditEvent: (event: CalendarEvent) => void
}

export default function WeekViewMobile({ onAddEvent, onEditEvent }: WeekViewMobileProps) {
  const { selectedDate, getEventsForDateRange, calendarTypes } = useCalendarStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
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
  
  const getEventsForHour = (date: Date, hour: number) => {
    const hourStart = new Date(date)
    hourStart.setHours(hour, 0, 0, 0)
    const hourEnd = new Date(date)
    hourEnd.setHours(hour, 59, 59, 999)
    
    const dayEvents = getEventsForDateRange(startOfDay(date), endOfDay(date))
    
    return dayEvents.filter(event => {
      if (event.allDay) return false
      
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      return (
        (eventStart >= hourStart && eventStart < hourEnd) ||
        (eventEnd > hourStart && eventEnd <= hourEnd) ||
        (eventStart <= hourStart && eventEnd >= hourEnd)
      )
    })
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Days Header - Fixed */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 sticky top-0 z-10">
        {weekDays.map((date, index) => {
          const isTodayDate = isToday(date)
          return (
            <div
              key={index}
              className={cn(
                "p-2 text-center bg-gray-50",
                isTodayDate && "bg-green-50"
              )}
            >
              <div className="text-[10px] text-gray-600">{format(date, 'EEE')}</div>
              <div className={cn(
                "text-sm font-semibold text-gray-800",
                isTodayDate && "bg-squarage-green text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto"
              )}>
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* All-day events */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 min-h-[40px]">
        {weekDays.map((date, index) => {
          const allDayEvents = getAllDayEvents(date)
          return (
            <div
              key={index}
              className="p-1 bg-white"
              onClick={() => onAddEvent(date)}
            >
              {allDayEvents.slice(0, 1).map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditEvent(event)
                  }}
                  className="text-[10px] p-0.5 rounded truncate"
                  style={{ backgroundColor: getEventColor(event) + '40', color: getEventColor(event) }}
                >
                  {event.title}
                </div>
              ))}
              {allDayEvents.length > 1 && (
                <div className="text-[10px] text-gray-500">+{allDayEvents.length - 1}</div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Scrollable time grid */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[400px] overflow-y-auto overflow-x-hidden"
      >
        {timeSlots.map((hour, index) => (
          <div key={hour} className="relative">
            {/* Hour line and label */}
            {index > 0 && (
              <div className="absolute -top-1.5 left-0 flex items-center z-10">
                <div className="bg-white px-1">
                  <span className="text-[10px] text-gray-500">
                    {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}
            {index === 0 && (
              <div className="absolute top-0 left-0 px-1">
                <span className="text-[10px] text-gray-500">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {weekDays.map((date, dayIndex) => {
                const events = getEventsForHour(date, hour)
                const isTodaySlot = isToday(date) && new Date().getHours() === hour
                
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={cn(
                      "min-h-[40px] p-0.5 bg-white",
                      isTodaySlot && "bg-green-50"
                    )}
                    onClick={() => handleTimeSlotClick(date, hour)}
                  >
                    {events.slice(0, 1).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditEvent(event)
                        }}
                        className="text-[10px] p-0.5 rounded truncate mt-0.5 text-white"
                        style={{ backgroundColor: getEventColor(event) }}
                      >
                        {format(new Date(event.startTime), 'HH:mm')} {event.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}