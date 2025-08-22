'use client'

import { X } from 'lucide-react'
import useTodoStore from '@/lib/store'
import { TodoStatus } from '@/lib/types'

interface TodoFilterBarProps {
  onClose: () => void
}

export default function TodoFilterBar({ onClose }: TodoFilterBarProps) {
  const { filters, categories, owners, setFilter } = useTodoStore()
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Filters</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={18} className="text-white" />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Status Filter */}
        <div>
          <label className="text-white/70 text-xs block mb-1">Status</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilter({ status: (e.target.value || 'all') as FilterBy })}
            className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="all">All Status</option>
            <option value="pending">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="text-white/70 text-xs block mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => setFilter({ category: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Owner Filter */}
        <div>
          <label className="text-white/70 text-xs block mb-1">Owner</label>
          <select
            value={filters.owner || ''}
            onChange={(e) => setFilter({ owner: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="">All Owners</option>
            {owners.map((own) => (
              <option key={own.id} value={own.name}>
                {own.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Priority Filter */}
        <div>
          <label className="text-white/70 text-xs block mb-1">Priority</label>
          <select
            value={filters.priority || ''}
            onChange={(e) => setFilter({ priority: e.target.value as 'low' | 'medium' | 'high' | undefined })}
            className="w-full px-3 py-2 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        {/* Clear Filters */}
        <button
          onClick={() => setFilter({ status: undefined, category: undefined, owner: undefined, priority: undefined })}
          className="w-full py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )
}