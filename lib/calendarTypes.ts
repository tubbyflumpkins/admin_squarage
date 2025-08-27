// Calendar feature type definitions

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  calendarTypeId?: string | null
  startTime: Date
  endTime: Date
  allDay: boolean
  recurringPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurringEndDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CalendarType {
  id: string
  name: string
  color: string
  createdAt: Date
}

export interface EventReminder {
  id: string
  eventId: string
  minutesBefore: number
  createdAt: Date
}

export interface CalendarFilters {
  calendarTypeId?: string
  searchQuery?: string
  showCompleted?: boolean
}

export type CalendarView = 'month' | 'week' | 'day'

export type CalendarSortBy = 'time' | 'title' | 'type'

// Helper type for creating new events
export type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>

// Helper type for creating new calendar types
export type NewCalendarType = Omit<CalendarType, 'id' | 'createdAt'>

// Helper type for creating new reminders
export type NewEventReminder = Omit<EventReminder, 'id' | 'createdAt'>

// Type for calendar grid cells (used in month view)
export interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

// Type for time slots (used in week/day views)
export interface TimeSlot {
  time: Date
  events: CalendarEvent[]
}

// Type for recurring event generation
export interface RecurringEventInstance extends CalendarEvent {
  originalEventId: string
  instanceDate: Date
}