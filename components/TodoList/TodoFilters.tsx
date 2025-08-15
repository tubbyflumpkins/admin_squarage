'use client'

import { SortBy, FilterBy } from '@/lib/types'
import { ChevronDown } from 'lucide-react'

interface TodoFiltersProps {
  categories: string[]
  owners: string[]
  currentFilters: {
    category?: string
    owner?: string
    priority?: 'low' | 'medium' | 'high'
    status: FilterBy
    sortBy: SortBy
  }
  onFilterChange: (filters: any) => void
}

export default function TodoFilters({
  categories,
  owners,
  currentFilters,
  onFilterChange,
}: TodoFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-brown-medium mb-1">
            Status
          </label>
          <div className="relative">
            <select
              value={currentFilters.status}
              onChange={(e) => onFilterChange({ status: e.target.value as FilterBy })}
              className="w-full appearance-none bg-squarage-white border border-brown-light rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brown-medium mb-1">
            Category
          </label>
          <div className="relative">
            <select
              value={currentFilters.category || ''}
              onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
              className="w-full appearance-none bg-squarage-white border border-brown-light rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brown-medium mb-1">
            Owner
          </label>
          <div className="relative">
            <select
              value={currentFilters.owner || ''}
              onChange={(e) => onFilterChange({ owner: e.target.value || undefined })}
              className="w-full appearance-none bg-squarage-white border border-brown-light rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
            >
              <option value="">All Owners</option>
              {owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brown-medium mb-1">
            Priority
          </label>
          <div className="relative">
            <select
              value={currentFilters.priority || ''}
              onChange={(e) => onFilterChange({ priority: e.target.value || undefined })}
              className="w-full appearance-none bg-squarage-white border border-brown-light rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brown-medium mb-1">
            Sort By
          </label>
          <div className="relative">
            <select
              value={currentFilters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortBy })}
              className="w-full appearance-none bg-squarage-white border border-brown-light rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-squarage-green focus:border-transparent"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="owner">Owner</option>
              <option value="createdAt">Created Date</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}