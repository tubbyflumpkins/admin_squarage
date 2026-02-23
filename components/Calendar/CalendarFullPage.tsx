'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, Settings, Filter } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import CalendarHeader from './CalendarHeader'
import MonthView from './CalendarViews/MonthView'
import WeekView from './CalendarViews/WeekView'
import DayView from './CalendarViews/DayView'
import EventEditModal from './EventEditModal'
import CalendarTypeEditModal from './CalendarTypeEditModal'
import CalendarFilters from './CalendarFilters'

export default function CalendarFullPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedEventDate, setSelectedEventDate] = useState<Date | undefined>(undefined)
  
  const {
    currentView,
    selectedDate,
    hasLoadedFromServer,
    loadFromServer,
    events,
    calendarTypes,
  } = useCalendarStore()

  useEffect(() => {
    if (!hasLoadedFromServer) {
      loadFromServer().then(() => setIsHydrated(true))
    } else {
      setIsHydrated(true)
    }
  }, [hasLoadedFromServer, loadFromServer])

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent(null)
    setSelectedEventDate(date)
    setShowEventModal(true)
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">Calendar</h1>
      </div>
      
      {/* Main Container that fills available space */}
      <div className="flex-1 bg-white/35 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden flex flex-col">
        
        {/* Header Section - Compact */}
        <div className="bg-white/10 border-b border-white/20 p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Calendar Header with Navigation */}
            <CalendarHeader />
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all border border-white/30"
              >
                <Filter size={18} className="text-white" />
              </button>
              
              <button
                onClick={() => setShowTypeModal(true)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all border border-white/30"
              >
                <Settings size={18} className="text-white" />
              </button>
              
              <button
                onClick={() => handleAddEvent()}
                className="px-3 py-1.5 bg-squarage-green hover:bg-squarage-green/90 text-white font-medium rounded-lg transition-all flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                New Event
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters Section - Compact when visible */}
        {showFilters && (
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex-shrink-0">
            <CalendarFilters />
          </div>
        )}
        
        {/* Calendar View - Fills remaining space */}
        <div className="flex-1 bg-white overflow-hidden p-3 flex flex-col">
          {currentView === 'month' && (
            <MonthView 
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
            />
          )}
          {currentView === 'week' && (
            <WeekView 
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
            />
          )}
          {currentView === 'day' && (
            <DayView 
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
            />
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showEventModal && (
        <EventEditModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          event={selectedEvent}
          initialDate={selectedEventDate}
        />
      )}
      
      {showTypeModal && (
        <CalendarTypeEditModal
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
        />
      )}
    </div>
  )
}