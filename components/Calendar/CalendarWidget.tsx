'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useCalendarStore from '@/lib/calendarStore'
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns'

export default function CalendarWidget() {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  
  const { 
    events, 
    calendarTypes,
    loadFromServer,
    getEventsForDateRange 
  } = useCalendarStore()
  
  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [loadFromServer])
  
  // Get all upcoming events (from start of today onwards)
  const today = new Date()
  const startOfToday = startOfDay(today)
  
  // Filter all events to get events from today onwards (including past events from today)
  const upcomingEvents = events.filter(event => {
    const eventTime = new Date(event.startTime)
    return eventTime >= startOfToday
  })
  
  // Sort by date and take the first 5
  upcomingEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const displayEvents = upcomingEvents.slice(0, 5)
  
  const getEventColor = (event: any) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }
  
  const formatEventTime = (event: any) => {
    if (event.allDay) return 'All day'
    return format(new Date(event.startTime), 'HH:mm')
  }
  
  const getEventDateLabel = (event: any) => {
    const eventDate = new Date(event.startTime)
    if (isToday(eventDate)) return 'Today'
    if (isTomorrow(eventDate)) return 'Tomorrow'
    return format(eventDate, 'MMM d')
  }
  
  const handleWidgetClick = () => {
    router.push('/calendar')
  }
  
  if (!isHydrated) {
    return (
      <div className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:shadow-3xl"
           onClick={handleWidgetClick}>
        <div className="absolute inset-0 z-10 rounded-2xl" />
        <div className="relative">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-white">Calendar</h2>
            <span className="text-sm text-white/80">{format(today, 'EEEE, MMM d')}</span>
          </div>
          <div className="bg-squarage-white/50 rounded-lg">
            <div className="flex items-center justify-center py-8 text-brown-medium">
              Loading events...
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="relative backdrop-blur-md bg-white/35 rounded-2xl shadow-2xl border border-white/40 p-6 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:shadow-3xl"
      onClick={handleWidgetClick}
    >
      {/* Overlay to prevent interactions with inner content */}
      <div className="absolute inset-0 z-10 rounded-2xl" />
      
      {/* Content - not interactive due to overlay */}
      <div className="relative">
        {/* Header with title and date */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-white">Calendar</h2>
          <span className="text-sm text-white/80">{format(today, 'EEEE, MMM d')}</span>
        </div>

        {/* Column Headers */}
        <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
          <div className="grid grid-cols-[100px_1fr_80px] text-xs font-medium text-brown-medium uppercase tracking-wider">
            <div className="px-2 py-1.5 text-center">Date</div>
            <div className="px-2 py-1.5 border-l border-brown-light/20">Event</div>
            <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Time</div>
          </div>
        </div>

        {/* Events List */}
        <div className="border-x border-b border-brown-light/30 rounded-b-lg bg-squarage-white overflow-hidden">
          <div className="divide-y divide-brown-light/20">
            {displayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-brown-medium text-lg font-medium mb-2">No upcoming events</p>
                <p className="text-brown-light text-sm">Click to view the calendar</p>
              </div>
            ) : (
              displayEvents.map((event) => (
                <div key={event.id} className="grid grid-cols-[100px_1fr_80px] text-sm hover:bg-squarage-white/30">
                  {/* Date */}
                  <div className="px-2 py-1.5 text-center text-brown-medium">
                    <span className="font-medium">{getEventDateLabel(event)}</span>
                  </div>
                  
                  {/* Event Title with color indicator */}
                  <div className="px-2 py-1.5 flex items-center gap-2 border-l border-brown-light/20">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getEventColor(event) }}
                    />
                    <span className="font-medium text-brown-dark truncate">
                      {event.title}
                    </span>
                  </div>
                  
                  {/* Time */}
                  <div className="px-2 py-1.5 text-center text-brown-medium border-l border-brown-light/20">
                    {formatEventTime(event)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}