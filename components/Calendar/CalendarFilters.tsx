'use client'

import { Search, X } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'

export default function CalendarFilters() {
  const { filters, setFilters, calendarTypes } = useCalendarStore()
  
  const handleCalendarTypeChange = (typeId: string) => {
    setFilters({ 
      calendarTypeId: typeId === 'all' ? undefined : typeId 
    })
  }
  
  const handleSearchChange = (query: string) => {
    setFilters({ searchQuery: query })
  }
  
  const clearFilters = () => {
    setFilters({ 
      calendarTypeId: undefined, 
      searchQuery: '' 
    })
  }
  
  const hasActiveFilters = filters.calendarTypeId || filters.searchQuery
  
  return (
    <div className="flex items-center gap-4">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-squarage-green/50 transition-all"
          />
        </div>
      </div>
      
      {/* Calendar Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Calendar:</span>
        <select
          value={filters.calendarTypeId || 'all'}
          onChange={(e) => handleCalendarTypeChange(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-squarage-green/50 transition-all"
        >
          <option value="all">All Calendars</option>
          {calendarTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center gap-2 text-gray-600 text-sm border border-gray-300"
        >
          <X size={16} />
          Clear
        </button>
      )}
    </div>
  )
}