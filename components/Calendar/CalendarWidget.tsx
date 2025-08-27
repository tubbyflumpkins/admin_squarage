'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import useCalendarStore from '@/lib/calendarStore'
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from 'date-fns'

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
  
  // Get today's and tomorrow's events
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const todayEvents = getEventsForDateRange(startOfDay(today), endOfDay(today))
  const tomorrowEvents = getEventsForDateRange(startOfDay(tomorrow), endOfDay(tomorrow))
  const upcomingEvents = [...todayEvents, ...tomorrowEvents].slice(0, 5)
  
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
      <div className="bg-white/35 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-white/40">
        <h2 className="text-xl font-bold text-white drop-shadow-lg mb-4">Calendar</h2>
        <div className="bg-white/50 rounded-xl p-4">
          <div className="text-center py-8 text-gray-600">
            Loading events...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      onClick={handleWidgetClick}
      className="bg-white/35 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-white/40 cursor-pointer group"
    >
      {/* Title outside the inner pane - white text */}
      <h2 className="text-xl font-bold text-white drop-shadow-lg mb-4">Calendar</h2>
      
      {/* Inner pane with lighter background - black text */}
      <div className="bg-white/50 rounded-xl p-4">
        {/* Today's Date */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <div className="text-2xl font-bold text-squarage-green">
            {format(today, 'EEEE')}
          </div>
          <div className="text-sm text-gray-700">
            {format(today, 'MMMM d, yyyy')}
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">No upcoming events</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push('/calendar')
                }}
                className="text-sm text-squarage-green hover:text-squarage-green/80 font-medium"
              >
                Add an event
              </button>
            </div>
          ) : (
            <>
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-700">
                      {getEventDateLabel(event)} • {formatEventTime(event)}
                      {event.location && (
                        <span className="ml-1">• {event.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(todayEvents.length + tomorrowEvents.length) > 5 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-600">
                    +{(todayEvents.length + tomorrowEvents.length) - 5} more events
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-700">
          <span>{todayEvents.length} events today</span>
          <span>{tomorrowEvents.length} tomorrow</span>
        </div>
      </div>
    </div>
  )
}