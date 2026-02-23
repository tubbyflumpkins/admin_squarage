'use client'

import { useState, useEffect, useMemo } from 'react'
import useCalendarStore from '@/lib/calendarStore'
import { format, isToday, isTomorrow, startOfDay, addDays } from 'date-fns'
import WidgetContainer from '@/components/Dashboard/WidgetContainer'

export default function CalendarWidget() {
  const [isHydrated, setIsHydrated] = useState(false)

  const {
    events,
    calendarTypes,
    hasLoadedFromServer,
    getEventsForDate,
  } = useCalendarStore()

  useEffect(() => {
    if (hasLoadedFromServer) {
      setIsHydrated(true)
    }
  }, [hasLoadedFromServer])

  const today = new Date()
  const startOfTodayDate = startOfDay(today)

  // Build upcoming event instances (including recurring) for the next 30 days
  const displayEvents = useMemo(() => {
    if (!isHydrated) return []

    const seen = new Set<string>()
    const instances: { event: typeof events[0]; instanceDate: Date }[] = []

    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(startOfTodayDate, i)
      const dayEvents = getEventsForDate(checkDate)

      for (const event of dayEvents) {
        // Deduplicate: same event on same day
        const key = `${event.id}-${format(checkDate, 'yyyy-MM-dd')}`
        if (seen.has(key)) continue
        seen.add(key)

        instances.push({ event, instanceDate: checkDate })
      }
    }

    // Sort by occurrence date, then by start time
    instances.sort((a, b) => {
      const dateDiff = a.instanceDate.getTime() - b.instanceDate.getTime()
      if (dateDiff !== 0) return dateDiff
      return new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime()
    })

    return instances.slice(0, 5)
  }, [isHydrated, events, startOfTodayDate.getTime(), getEventsForDate])

  const getEventColor = (event: typeof events[0]) => {
    const type = calendarTypes.find(t => t.id === event.calendarTypeId)
    return type?.color || '#4A9B4E'
  }

  const formatEventTime = (event: typeof events[0]) => {
    if (event.allDay) return 'All day'
    return format(new Date(event.startTime), 'HH:mm')
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  if (!isHydrated) {
    return (
      <WidgetContainer href="/calendar">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-white">Calendar</h2>
          <span className="text-sm text-white/80">{format(today, 'EEEE, MMM d')}</span>
        </div>
        <div className="bg-squarage-white/50 rounded-lg">
          <div className="flex items-center justify-center py-8 text-brown-medium">
            Loading events...
          </div>
        </div>
      </WidgetContainer>
    )
  }

  return (
    <WidgetContainer href="/calendar">
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
            displayEvents.map(({ event, instanceDate }) => (
              <div key={`${event.id}-${format(instanceDate, 'yyyy-MM-dd')}`} className="grid grid-cols-[100px_1fr_80px] text-sm hover:bg-squarage-white/30">
                {/* Date */}
                <div className="px-2 py-1.5 text-center text-brown-medium">
                  <span className="font-medium">{getDateLabel(instanceDate)}</span>
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
    </WidgetContainer>
  )
}
