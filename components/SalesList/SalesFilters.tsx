'use client'

import useSalesStore from '@/lib/salesStore'
import type { DeliveryMethod, FilterBy } from '@/lib/salesTypes'

interface SalesFiltersProps {
  isGlassView?: boolean
  deliveryMethods: DeliveryMethod[]
}

export default function SalesFilters({ isGlassView = false, deliveryMethods }: SalesFiltersProps) {
  const { filters, setFilter } = useSalesStore()

  return (
    <div className={`mt-4 p-3 rounded-lg ${
      isGlassView 
        ? 'bg-white/10 border border-white/20' 
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${
            isGlassView ? 'text-white/70' : 'text-gray-600'
          }`}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilter({ status: e.target.value as FilterBy })}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isGlassView 
                ? 'bg-white/20 border-white/30 text-white' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>

        {/* Delivery Method Filter */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${
            isGlassView ? 'text-white/70' : 'text-gray-600'
          }`}>
            Delivery Method
          </label>
          <select
            value={filters.deliveryMethod || ''}
            onChange={(e) => setFilter({ 
              deliveryMethod: e.target.value ? e.target.value as DeliveryMethod : undefined 
            })}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isGlassView 
                ? 'bg-white/20 border-white/30 text-white' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="">All</option>
            <option value="shipping">Shipping</option>
            <option value="local">Local</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(filters.status !== 'all' || filters.deliveryMethod) && (
          <button
            onClick={() => setFilter({ 
              status: 'all', 
              deliveryMethod: undefined 
            })}
            className={`self-end px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isGlassView 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}