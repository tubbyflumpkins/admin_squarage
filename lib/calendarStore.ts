import { create } from 'zustand'
import { 
  CalendarEvent, 
  CalendarType, 
  CalendarFilters, 
  CalendarView,
  CalendarSortBy,
  EventReminder 
} from './calendarTypes'
import { loadingCoordinator } from './loadingCoordinator'

interface CalendarStore {
  // State
  events: CalendarEvent[]
  calendarTypes: CalendarType[]
  reminders: EventReminder[]
  currentView: CalendarView
  selectedDate: Date
  filters: CalendarFilters
  sortBy: CalendarSortBy
  
  // Loading state
  isLoading: boolean
  hasLoadedFromServer: boolean
  
  // Actions
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
  
  // Event management
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  
  // Calendar type management
  addCalendarType: (name: string, color: string) => void
  updateCalendarType: (id: string, name: string, color: string) => void
  deleteCalendarType: (id: string) => void
  
  // Reminder management
  addReminder: (eventId: string, minutesBefore: number) => void
  updateReminder: (id: string, minutesBefore: number) => void
  deleteReminder: (id: string) => void
  getEventReminders: (eventId: string) => EventReminder[]
  
  // View management
  setView: (view: CalendarView) => void
  navigateToDate: (date: Date) => void
  goToToday: () => void
  navigateNext: () => void
  navigatePrevious: () => void
  
  // Filtering and sorting
  setFilters: (filters: Partial<CalendarFilters>) => void
  setSortBy: (sortBy: CalendarSortBy) => void
  getFilteredEvents: () => CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  getEventsForDateRange: (startDate: Date, endDate: Date) => CalendarEvent[]
}

// Debounce timer for saves
let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 5000 // Increased from 1s to 5s to reduce database calls

// Default calendar types
const defaultCalendarTypes: Omit<CalendarType, 'id' | 'createdAt'>[] = [
  { name: 'Work', color: '#4A9B4E' },
  { name: 'Personal', color: '#01BAD5' },
  { name: 'Events', color: '#F7901E' },
]

// Helper function to check if an event occurs on a specific date
const eventOccursOnDate = (event: CalendarEvent, date: Date): boolean => {
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)
  const checkDate = new Date(date)
  
  // Reset times for date comparison
  eventStart.setHours(0, 0, 0, 0)
  eventEnd.setHours(23, 59, 59, 999)
  checkDate.setHours(12, 0, 0, 0)
  
  return checkDate >= eventStart && checkDate <= eventEnd
}

// Helper function to check if an event is within a date range
const eventInDateRange = (event: CalendarEvent, startDate: Date, endDate: Date): boolean => {
  const eventStart = new Date(event.startTime)
  const eventEnd = new Date(event.endTime)
  
  return (
    (eventStart >= startDate && eventStart <= endDate) ||
    (eventEnd >= startDate && eventEnd <= endDate) ||
    (eventStart <= startDate && eventEnd >= endDate)
  )
}

const useCalendarStore = create<CalendarStore>((set, get) => ({
  // Initial state
  events: [],
  calendarTypes: [],
  reminders: [],
  currentView: 'month',
  selectedDate: new Date(),
  filters: {},
  sortBy: 'time',
  
  // Loading state
  isLoading: false,
  hasLoadedFromServer: false,
  
  // Load data from server with coordination to prevent multiple simultaneous loads
  loadFromServer: async () => {
    const state = get()
    
    // Use the loading coordinator to prevent multiple simultaneous requests
    return loadingCoordinator.coordinatedLoad(
      'calendar-data',
      async () => {
        set({ isLoading: true })
        
        try {
          console.log('Loading calendar data from server...')
          const response = await fetch('/api/calendar/neon')
          
          if (!response.ok) {
            console.error(`Calendar API returned ${response.status}: ${response.statusText}`)
            throw new Error(`Failed to load calendar data: ${response.status}`)
          }
      
      const data = await response.json()
      console.log('Calendar data loaded from server:', {
        eventsCount: data.events?.length || 0,
        calendarTypesCount: data.calendarTypes?.length || 0,
        remindersCount: data.reminders?.length || 0
      })
      
      // Convert date strings to Date objects
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
      
      set({
        events,
        calendarTypes,
        reminders,
        isLoading: false,
        hasLoadedFromServer: true
      })
      
          // Create default calendar types if none exist
          if (calendarTypes.length === 0) {
            console.log('Creating default calendar types...')
            defaultCalendarTypes.forEach(type => {
              get().addCalendarType(type.name, type.color)
            })
          }
          
          return data
        } catch (error) {
          console.error('Error loading calendar data from server:', error)
          set({ 
            isLoading: false,
            hasLoadedFromServer: true
          })
          throw error
        }
      },
      { bypassCache: state.isLoading }
    )
  },
  
  // Save data to server (debounced)
  saveToServer: async () => {
    const state = get()
    
    if (!state.hasLoadedFromServer) {
      console.log('Skipping save - calendar data not loaded from server yet')
      return
    }
    
    if (state.isLoading) {
      console.log('Skipping save - currently loading calendar data')
      return
    }
    
    // Clear existing timer
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }
    
    // Set new timer (5 second delay to batch multiple changes)
    saveDebounceTimer = setTimeout(async () => {
      try {
        console.log('Saving calendar data to server...')
        const response = await fetch('/api/calendar/neon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: state.events,
            calendarTypes: state.calendarTypes,
            reminders: state.reminders,
          })
        })
        
        if (!response.ok) {
          console.error(`Failed to save calendar data: ${response.status}`)
        } else {
          console.log('Calendar data saved successfully')
        }
      } catch (error) {
        console.error('Error saving calendar data to server:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  },
  
  // Event management
  addEvent: (eventData) => {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const newEvent: CalendarEvent = {
      ...eventData,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    set(state => ({
      events: [...state.events, newEvent]
    }))
    
    get().saveToServer()
  },
  
  updateEvent: (id, updates) => {
    set(state => ({
      events: state.events.map(event => 
        event.id === id 
          ? { ...event, ...updates, updatedAt: new Date() }
          : event
      )
    }))
    
    get().saveToServer()
  },
  
  deleteEvent: (id) => {
    set(state => ({
      events: state.events.filter(event => event.id !== id),
      // Also delete associated reminders
      reminders: state.reminders.filter(reminder => reminder.eventId !== id)
    }))
    
    get().saveToServer()
  },
  
  // Calendar type management
  addCalendarType: (name, color) => {
    const id = `type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newType: CalendarType = {
      id,
      name,
      color,
      createdAt: new Date(),
    }
    
    set(state => ({
      calendarTypes: [...state.calendarTypes, newType]
    }))
    
    get().saveToServer()
  },
  
  updateCalendarType: (id, name, color) => {
    set(state => ({
      calendarTypes: state.calendarTypes.map(type => 
        type.id === id 
          ? { ...type, name, color }
          : type
      )
    }))
    
    get().saveToServer()
  },
  
  deleteCalendarType: (id) => {
    set(state => ({
      calendarTypes: state.calendarTypes.filter(type => type.id !== id),
      // Set events with this type to have no type
      events: state.events.map(event => 
        event.calendarTypeId === id 
          ? { ...event, calendarTypeId: null, updatedAt: new Date() }
          : event
      )
    }))
    
    get().saveToServer()
  },
  
  // Reminder management
  addReminder: (eventId, minutesBefore) => {
    const id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newReminder: EventReminder = {
      id,
      eventId,
      minutesBefore,
      createdAt: new Date(),
    }
    
    set(state => ({
      reminders: [...state.reminders, newReminder]
    }))
    
    get().saveToServer()
  },
  
  updateReminder: (id, minutesBefore) => {
    set(state => ({
      reminders: state.reminders.map(reminder => 
        reminder.id === id 
          ? { ...reminder, minutesBefore }
          : reminder
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
    const state = get()
    return state.reminders.filter(reminder => reminder.eventId === eventId)
  },
  
  // View management
  setView: (view) => {
    set({ currentView: view })
  },
  
  navigateToDate: (date) => {
    set({ selectedDate: date })
  },
  
  goToToday: () => {
    set({ selectedDate: new Date() })
  },
  
  navigateNext: () => {
    const { selectedDate, currentView } = get()
    const newDate = new Date(selectedDate)
    
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1)
        break
    }
    
    set({ selectedDate: newDate })
  },
  
  navigatePrevious: () => {
    const { selectedDate, currentView } = get()
    const newDate = new Date(selectedDate)
    
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1)
        break
    }
    
    set({ selectedDate: newDate })
  },
  
  // Filtering and sorting
  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },
  
  setSortBy: (sortBy) => {
    set({ sortBy })
  },
  
  getFilteredEvents: () => {
    const { events, filters, sortBy } = get()
    
    let filtered = [...events]
    
    // Apply filters
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
    
    // Sort events
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
    
    // Apply filters
    if (filters.calendarTypeId) {
      filtered = filtered.filter(event => event.calendarTypeId === filters.calendarTypeId)
    }
    
    // Sort by start time
    filtered.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    return filtered
  },
  
  getEventsForDateRange: (startDate, endDate) => {
    const { events, filters } = get()
    
    let filtered = events.filter(event => eventInDateRange(event, startDate, endDate))
    
    // Apply filters
    if (filters.calendarTypeId) {
      filtered = filtered.filter(event => event.calendarTypeId === filters.calendarTypeId)
    }
    
    // Sort by start time
    filtered.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    return filtered
  },
}))

export default useCalendarStore