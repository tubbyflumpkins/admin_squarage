'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Type, RefreshCw, Bell } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'
import { CalendarEvent } from '@/lib/calendarTypes'
import { format } from 'date-fns'

interface EventEditModalProps {
  isOpen: boolean
  onClose: () => void
  event?: CalendarEvent | null
  initialDate?: Date
}

export default function EventEditModal({ isOpen, onClose, event, initialDate }: EventEditModalProps) {
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
  const [recurringEndDate, setRecurringEndDate] = useState('')
  
  // Generate time options with 15-minute intervals
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(time)
      }
    }
    return options
  }
  
  const timeOptions = generateTimeOptions()
  
  // Round time to nearest 15-minute interval
  const roundToNearest15 = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const roundedMinutes = Math.round(minutes / 15) * 15
    if (roundedMinutes === 60) {
      return `${(hours + 1).toString().padStart(2, '0')}:00`
    }
    return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`
  }
  
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
      setStartTime(roundToNearest15(format(start, 'HH:mm')))
      setEndDate(format(end, 'yyyy-MM-dd'))
      setEndTime(roundToNearest15(format(end, 'HH:mm')))
      
      if (event.recurringEndDate) {
        setRecurringEndDate(format(new Date(event.recurringEndDate), 'yyyy-MM-dd'))
      }
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
      recurringEndDate: recurringEndDate ? (() => {
        const [year, month, day] = recurringEndDate.split('-').map(Number)
        return new Date(year, month - 1, day, 23, 59, 59)
      })() : null,
    }
    
    if (event) {
      updateEvent(event.id, eventData)
    } else {
      addEvent(eventData)
    }
    
    onClose()
  }
  
  const handleDelete = () => {
    if (event && confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id)
      onClose()
    }
  }
  
  const getCalendarTypeColor = (typeId: string) => {
    const type = calendarTypes.find(t => t.id === typeId)
    return type?.color || '#4A9B4E'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md border border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
              placeholder="Enter event title"
              required
            />
          </div>
          
          {/* Calendar Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendar
            </label>
            <div className="flex items-center gap-2">
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
          </div>
          
          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 text-squarage-green focus:ring-squarage-green/50 rounded"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
              All-day event
            </label>
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                  required
                >
                  <option value="">Select time</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                  required
                >
                  <option value="">Select time</option>
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                placeholder="Add location"
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50 resize-none"
              rows={3}
              placeholder="Add description"
            />
          </div>
          
          {/* Recurring */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repeat
            </label>
            <select
              value={recurringPattern}
              onChange={(e) => setRecurringPattern(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          {recurringPattern !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Repeat
              </label>
              <input
                type="date"
                value={recurringEndDate}
                onChange={(e) => setRecurringEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-squarage-green/50"
                placeholder="Optional end date"
              />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-squarage-green hover:bg-squarage-green/90 text-white rounded-lg transition-colors"
              >
                {event ? 'Update' : 'Create'} Event
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}