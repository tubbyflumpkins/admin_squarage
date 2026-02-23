import { create } from 'zustand'
import {
  CalendarEvent,
  CalendarType,
  CalendarFilters,
  CalendarView,
  CalendarSortBy,
  EventReminder
} from './calendarTypes'
import { createEntityStoreSlice } from './createEntityStore'

interface CalendarStore {
  events: CalendarEvent[]
  calendarTypes: CalendarType[]
  reminders: EventReminder[]
  currentView: CalendarView
  selectedDate: Date
  filters: CalendarFilters
  sortBy: CalendarSortBy
  isLoading: boolean
  hasLoadedFromServer: boolean
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  addCalendarType: (name: string, color: string) => void
  updateCalendarType: (id: string, name: string, color: string) => void
  deleteCalendarType: (id: string) => void
  addReminder: (eventId: string, minutesBefore: number) => void
  updateReminder: (id: string, minutesBefore: number) => void
  deleteReminder: (id: string) => void
  getEventReminders: (eventId: string) => EventReminder[]
  setView: (view: CalendarView) => void
  navigateToDate: (date: Date) => void
  goToToday: () => void
  navigateNext: () => void
  navigatePrevious: () => void
  setFilters: (filters: Partial<CalendarFilters>) => void
  setSortBy: (sortBy: CalendarSortBy) => void
  getFilteredEvents: () => CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[]
}

const defaultCalendarTypes: Omit<CalendarType, 'id' | 'createdAt'>[] = [
  { name: 'Work', color: '#4A9B4E' },
  { name: 'Personal', color: '#01BAD5' },
  { name: 'Events', color: '#F7901E' },
]

/** Duration of the event in milliseconds (so recurring instances keep the same length). */
const eventDurationMs = (event: CalendarEvent): number =>
  new Date(event.endTime).getTime() - new Date(event.startTime).getTime()

/** Check if a recurring pattern matches a specific date relative to the event's start. */
const recurringMatchesDate = (event: CalendarEvent, checkDate: Date): boolean => {
  const pattern = event.recurringPattern
  if (!pattern || pattern === 'none') return false

  const start = new Date(event.startTime)
  const check = new Date(checkDate)

  // Recurring end date boundary
  if (event.recurringEndDate && check > new Date(event.recurringEndDate)) return false
  // Only future occurrences (not before the original)
  if (check < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false

  if (pattern === 'daily') return true

  if (pattern === 'weekly') {
    return check.getDay() === start.getDay()
  }

  if (pattern === 'monthly') {
    return check.getDate() === start.getDate()
  }

  if (pattern === 'yearly') {
    return check.getDate() === start.getDate() && check.getMonth() === start.getMonth()
  }

  return false
}

const eventOccursOnDate = (event: CalendarEvent, date: Date): boolean => {
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)
  const checkDate = new Date(date)

  // Normalize for day-level comparison
  const startDay = new Date(eventStart)
  startDay.setHours(0, 0, 0, 0)
  const endDay = new Date(eventEnd)
  endDay.setHours(23, 59, 59, 999)
  const checkDay = new Date(checkDate)
  checkDay.setHours(12, 0, 0, 0)

  // Original occurrence
  if (checkDay >= startDay && checkDay <= endDay) return true

  // Recurring occurrences
  return recurringMatchesDate(event, checkDate)
}

const eventInDateRange = (event: CalendarEvent, startDate: Date, endDate: Date): boolean => {
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)

  // Original occurrence overlaps range
  if (
    (eventStart >= startDate && eventStart <= endDate) ||
    (eventEnd >= startDate && eventEnd <= endDate) ||
    (eventStart <= startDate && eventEnd >= endDate)
  ) return true

  // Check recurring occurrences within the range
  const pattern = event.recurringPattern
  if (!pattern || pattern === 'none') return false

  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const rangeEnd = new Date(endDate)
  rangeEnd.setHours(23, 59, 59, 999)

  while (current <= rangeEnd) {
    if (recurringMatchesDate(event, current)) return true
    current.setDate(current.getDate() + 1)
  }

  return false
}

const loadSave = createEntityStoreSlice<CalendarStore>({
  coordinatorKey: 'calendar-data',
  endpoint: '/api/calendar/neon',
  parseResponse: (data) => {
    const events = (data.events || []).map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      recurringEndDate: event.recurringEndDate ? new Date(event.recurringEndDate) : null,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }))
    const calendarTypes = (data.calendarTypes || []).map((type: any) => ({
      ...type,
      createdAt: new Date(type.createdAt),
    }))
    const reminders = (data.reminders || []).map((reminder: any) => ({
      ...reminder,
      createdAt: new Date(reminder.createdAt),
    }))
    return { events, calendarTypes, reminders }
  },
  serializeState: (state) => ({
    events: state.events,
    calendarTypes: state.calendarTypes,
    reminders: state.reminders,
  }),
  afterLoad: (get) => {
    if (get().calendarTypes.length === 0) {
      defaultCalendarTypes.forEach(type => {
        get().addCalendarType(type.name, type.color)
      })
    }
  },
})

const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  calendarTypes: [],
  reminders: [],
  currentView: 'month',
  selectedDate: new Date(),
  filters: {},
  sortBy: 'time',
  ...loadSave(set, get),

  addEvent: (eventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set(state => ({ events: [...state.events, newEvent] }))
    get().saveToServer()
  },

  updateEvent: (id, updates) => {
    set(state => ({
      events: state.events.map(event =>
        event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
      )
    }))
    get().saveToServer()
  },

  deleteEvent: (id) => {
    set(state => ({
      events: state.events.filter(event => event.id !== id),
      reminders: state.reminders.filter(reminder => reminder.eventId !== id)
    }))
    get().saveToServer()
  },

  addCalendarType: (name, color) => {
    const newType: CalendarType = {
      id: `type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      createdAt: new Date(),
    }
    set(state => ({ calendarTypes: [...state.calendarTypes, newType] }))
    get().saveToServer()
  },

  updateCalendarType: (id, name, color) => {
    set(state => ({
      calendarTypes: state.calendarTypes.map(type =>
        type.id === id ? { ...type, name, color } : type
      )
    }))
    get().saveToServer()
  },

  deleteCalendarType: (id) => {
    set(state => ({
      calendarTypes: state.calendarTypes.filter(type => type.id !== id),
      events: state.events.map(event =>
        event.calendarTypeId === id
          ? { ...event, calendarTypeId: null, updatedAt: new Date() }
          : event
      )
    }))
    get().saveToServer()
  },

  addReminder: (eventId, minutesBefore) => {
    const newReminder: EventReminder = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      minutesBefore,
      createdAt: new Date(),
    }
    set(state => ({ reminders: [...state.reminders, newReminder] }))
    get().saveToServer()
  },

  updateReminder: (id, minutesBefore) => {
    set(state => ({
      reminders: state.reminders.map(reminder =>
        reminder.id === id ? { ...reminder, minutesBefore } : reminder
      )
    }))
    get().saveToServer()
  },

  deleteReminder: (id) => {
    set(state => ({
      reminders: state.reminders.filter(reminder => reminder.id !== id)
    }))
    get().saveToServer()
  },

  getEventReminders: (eventId) => {
    return get().reminders.filter(reminder => reminder.eventId === eventId)
  },

  setView: (view) => set({ currentView: view }),
  navigateToDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ selectedDate: new Date() }),

  navigateNext: () => {
    const { selectedDate, currentView } = get()
    const newDate = new Date(selectedDate)
    switch (currentView) {
      case 'day': newDate.setDate(newDate.getDate() + 1); break
      case 'week': newDate.setDate(newDate.getDate() + 7); break
      case 'month': newDate.setMonth(newDate.getMonth() + 1); break
    }
    set({ selectedDate: newDate })
  },

  navigatePrevious: () => {
    const { selectedDate, currentView } = get()
    const newDate = new Date(selectedDate)
    switch (currentView) {
      case 'day': newDate.setDate(newDate.getDate() - 1); break
      case 'week': newDate.setDate(newDate.getDate() - 7); break
      case 'month': newDate.setMonth(newDate.getMonth() - 1); break
    }
    set({ selectedDate: newDate })
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }))
  },

  setSortBy: (sortBy) => set({ sortBy }),

  getFilteredEvents: () => {
    const { events, filters, sortBy } = get()
    let filtered = [...events]

    if (filters.calendarTypeId) {
      filtered = filtered.filter(event => event.calendarTypeId === filters.calendarTypeId)
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'type':
          return (a.calendarTypeId || '').localeCompare(b.calendarTypeId || '')
        default:
          return 0
      }
    })

    return filtered
  },

  getEventsForDate: (date) => {
    const { events, filters } = get()
    let filtered = events.filter(event => eventOccursOnDate(event, date))

    if (filters.calendarTypeId) {
      filtered = filtered.filter(event => event.calendarTypeId === filters.calendarTypeId)
    }

    filtered.sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    return filtered
  },

  getEventsForDateRange: (startDate, endDate) => {
    const { events, filters } = get()
    let filtered = events.filter(event => eventInDateRange(event, startDate, endDate))

    if (filters.calendarTypeId) {
      filtered = filtered.filter(event => event.calendarTypeId === filters.calendarTypeId)
    }

    filtered.sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    return filtered
  },
}))

export default useCalendarStore
