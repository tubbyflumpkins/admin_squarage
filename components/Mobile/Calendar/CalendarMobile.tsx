'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, List, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import useCalendarStore from '@/lib/calendarStore'
import MobileLayout from '../Layout/MobileLayout'
import CalendarHeaderMobile from './CalendarHeaderMobile'
import MonthViewMobile from './CalendarViewsMobile/MonthViewMobile'
import DayViewMobile from './CalendarViewsMobile/DayViewMobile'
import ListViewMobile from './CalendarViewsMobile/ListViewMobile'
import EventEditSheet from './EventEditSheet'
import CalendarTypeSheet from './CalendarTypeSheet'

export default function CalendarMobile() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showEventSheet, setShowEventSheet] = useState(false)
  const [showTypeSheet, setShowTypeSheet] = useState(false)
  const [showListView, setShowListView] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  
  const {
    currentView,
    loadFromServer,
    events,
    calendarTypes,
  } = useCalendarStore()

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, []) // Empty dependency array - only run once on mount

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent(null)
    setSelectedDate(date)
    setShowEventSheet(true)
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setSelectedDate(undefined)
    setShowEventSheet(true)
  }

  if (!isHydrated) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-white text-lg mb-2">Loading calendar...</div>
            <div className="text-white/70 text-sm">Please wait</div>
          </div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="relative h-full overflow-hidden">
        {/* Header Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl mx-4 mt-4 p-3 mb-3 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">Calendar</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowListView(!showListView)}
                className={cn(
                  "p-2 rounded-lg transition-colors border",
                  showListView 
                    ? "bg-white text-gray-800 border-gray-200" 
                    : "bg-white/20 hover:bg-white/30 border-white/30 text-white"
                )}
              >
                <List size={18} />
              </button>
              
              <button
                onClick={() => setShowTypeSheet(true)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
              >
                <Settings size={18} className="text-white" />
              </button>
              
              <button
                onClick={() => handleAddEvent()}
                className="p-2 rounded-lg bg-squarage-green hover:bg-squarage-green/90 transition-colors"
              >
                <Plus size={18} className="text-white" />
              </button>
            </div>
          </div>
          
          {/* Calendar Navigation */}
          <CalendarHeaderMobile />
        </div>
        
        {/* Calendar View */}
        <div className="flex-1 px-4 pb-4 overflow-auto">
          {showListView ? (
            <ListViewMobile 
              onEditEvent={handleEditEvent}
            />
          ) : (
            <>
              {currentView === 'month' && (
                <MonthViewMobile 
                  onAddEvent={handleAddEvent}
                  onEditEvent={handleEditEvent}
                />
              )}
              {currentView === 'day' && (
                <DayViewMobile 
                  onAddEvent={handleAddEvent}
                  onEditEvent={handleEditEvent}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Bottom Sheets */}
      {showEventSheet && (
        <EventEditSheet
          isOpen={showEventSheet}
          onClose={() => {
            setShowEventSheet(false)
            setSelectedEvent(null)
            setSelectedDate(undefined)
          }}
          event={selectedEvent}
          initialDate={selectedDate}
        />
      )}
      
      {showTypeSheet && (
        <CalendarTypeSheet
          isOpen={showTypeSheet}
          onClose={() => setShowTypeSheet(false)}
        />
      )}
    </MobileLayout>
  )
}