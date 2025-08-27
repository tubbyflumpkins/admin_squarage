'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, RefreshCw, Trash2 } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { format } from 'date-fns'

interface EventEditSheetProps {
  isOpen: boolean
  onClose: () => void
  event?: CalendarEvent | null
  initialDate?: Date
}

export default function EventEditSheet({ isOpen, onClose, event, initialDate }: EventEditSheetProps) {
  const { addEvent, updateEvent, deleteEvent, calendarTypes } = useCalendarStore()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [calendarTypeId, setCalendarTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [recurringPattern, setRecurringPattern] = useState<string>('none')
  
  useEffect(() => {
    if (event) {
      // Editing existing event
      setTitle(event.title)
      setDescription(event.description || '')
      setLocation(event.location || '')
      setCalendarTypeId(event.calendarTypeId || '')
      setAllDay(event.allDay)
      setRecurringPattern(event.recurringPattern || 'none')
      
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      
      setStartDate(format(start, 'yyyy-MM-dd'))
      setStartTime(format(start, 'HH:mm'))
      setEndDate(format(end, 'yyyy-MM-dd'))
      setEndTime(format(end, 'HH:mm'))
    } else if (initialDate) {
      // New event with initial date
      const date = format(initialDate, 'yyyy-MM-dd')
      setStartDate(date)
      setEndDate(date)
      setStartTime('09:00')
      setEndTime('10:00')
      
      // Set first calendar type as default
      if (calendarTypes.length > 0) {
        setCalendarTypeId(calendarTypes[0].id)
      }
    } else {
      // New event without initial date
      const now = new Date()
      const date = format(now, 'yyyy-MM-dd')
      setStartDate(date)
      setEndDate(date)
      setStartTime('09:00')
      setEndTime('10:00')
      
      // Set first calendar type as default
      if (calendarTypes.length > 0) {
        setCalendarTypeId(calendarTypes[0].id)
      }
    }
  }, [event, initialDate, calendarTypes])
  
  if (!isOpen) return null
  
  const handleSubmit = () => {
    if (!title.trim()) return
    
    // Parse date components to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    
    const startDateTime = allDay 
      ? new Date(startYear, startMonth - 1, startDay, 0, 0, 0)
      : (() => {
          const [hours, minutes] = startTime.split(':').map(Number)
          return new Date(startYear, startMonth - 1, startDay, hours, minutes, 0)
        })()
    
    const endDateTime = allDay
      ? new Date(endYear, endMonth - 1, endDay, 23, 59, 59)
      : (() => {
          const [hours, minutes] = endTime.split(':').map(Number)
          return new Date(endYear, endMonth - 1, endDay, hours, minutes, 0)
        })()
    
    const eventData = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      calendarTypeId: calendarTypeId || null,
      startTime: startDateTime,
      endTime: endDateTime,
      allDay,
      recurringPattern: recurringPattern === 'none' ? null : recurringPattern as any,
      recurringEndDate: null,
    }
    
    if (event) {
      updateEvent(event.id, eventData)
    } else {
      addEvent(eventData)
    }
    
    onClose()
  }
  
  const handleDelete = () => {
    if (event && confirm('Delete this event?')) {
      deleteEvent(event.id)
      onClose()
    }
  }
  
  const getCalendarTypeColor = (typeId: string) => {
    const type = calendarTypes.find(t => t.id === typeId)
    return type?.color || '#4A9B4E'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50">
      <div className="bg-white w-full max-h-[90vh] rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              placeholder="Event title"
            />
          </div>
          
          {/* Calendar Type */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={calendarTypeId}
              onChange={(e) => setCalendarTypeId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
            >
              <option value="">No Calendar</option>
              {calendarTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {calendarTypeId && (
              <div 
                className="w-8 h-8 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: getCalendarTypeColor(calendarTypeId) }}
              />
            )}
          </div>
          
          {/* All Day Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 text-squarage-green focus:ring-squarage-green/50 rounded"
            />
            <span className="text-sm text-gray-700">All-day event</span>
          </label>
          
          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Start</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-6">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">End</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-6">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                />
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-gray-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              placeholder="Add location"
            />
          </div>
          
          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50 resize-none"
              rows={3}
              placeholder="Add description"
            />
          </div>
          
          {/* Recurring */}
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-gray-500" />
            <select
              value={recurringPattern}
              onChange={(e) => setRecurringPattern(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t">
          {event ? (
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-4 py-2 bg-squarage-green hover:bg-squarage-green/90 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}