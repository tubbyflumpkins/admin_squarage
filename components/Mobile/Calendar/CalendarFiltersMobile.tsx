'use client'

import { Search, X } from 'lucide-react'
import useCalendarStore from '@/lib/calendarStore'

interface CalendarFiltersMobileProps {
  onClose: () => void
}

export default function CalendarFiltersMobile({ onClose }: CalendarFiltersMobileProps) {
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
    onClose()
  }
  
  const hasActiveFilters = filters.calendarTypeId || filters.searchQuery
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
        <input
          type="text"
          placeholder="Search events..."
          value={filters.searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all"
        />
      </div>
      
      {/* Calendar Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/70">Calendar:</span>
        <select
          value={filters.calendarTypeId || 'all'}
          onChange={(e) => handleCalendarTypeChange(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all"
        >
          <option value="all" className="bg-squarage-green text-white">All Calendars</option>
          {calendarTypes.map(type => (
            <option key={type.id} value={type.id} className="bg-squarage-green text-white">
              {type.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center justify-center gap-2 text-white text-sm"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white text-sm"
        >
          Done
        </button>
      </div>
    </div>
  )
}