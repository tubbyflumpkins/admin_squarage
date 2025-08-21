'use client'

import { format } from 'date-fns'
import { Sale, Product, Collection, SaleStatus } from '@/lib/salesTypes'
import { cn, hexToPastel } from '@/lib/utils'
import SalesStatusDropdown from './SalesStatusDropdown'
import ProductDropdown from './ProductDropdown'
import useSalesStore from '@/lib/salesStore'

interface SalesItemWidgetProps {
  sale: Sale
  products: Product[]
  collections: Collection[]
}

export default function SalesItemWidget({ sale, products, collections }: SalesItemWidgetProps) {
  const updateSale = useSalesStore(state => state.updateSale)
  
  // Get product details
  const product = products.find(p => p.id === sale.productId)

  // Status colors for background - matching SalesItem exactly
  const statusColors = {
    not_started: '#F87171', // Red-400
    in_progress: '#F5B74C', // squarage-yellow
    fulfilled: '#4A9B4E', // squarage-green
    dead: '#6B7280', // Gray-500
  }

  const currentStatus = sale.status
  const statusBgColor = hexToPastel(statusColors[currentStatus])

  const handleStatusChange = (newStatus: SaleStatus) => {
    updateSale(sale.id, { status: newStatus })
  }

  return (
    <div 
      className={cn(
        "transition-all duration-200 relative",
        currentStatus === 'fulfilled' && 'bg-green-200/80',
        currentStatus === 'dead' && 'bg-red-200/80'
      )}
      style={{
        backgroundColor: currentStatus === 'fulfilled' ? undefined : 
                        currentStatus === 'dead' ? undefined : 
                        statusBgColor
      }}
    >
      <div className="grid grid-cols-[80px_1fr_100px_100px] text-sm relative">
        {/* Strike-through line for fulfilled and dead sales */}
        {(currentStatus === 'fulfilled' || currentStatus === 'dead') && (
          <div 
            className={cn(
              "absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 pointer-events-none z-10",
              currentStatus === 'fulfilled' ? 'bg-green-700' : 'bg-red-700'
            )}
          />
        )}
        
        {/* Status */}
        <div className="px-2 py-1 flex items-center justify-center">
          <SalesStatusDropdown
            value={currentStatus}
            onChange={handleStatusChange}
            compact
          />
        </div>

        {/* Name */}
        <div className={cn(
          'px-2 py-1 flex items-center border-l border-brown-light/20 font-semibold',
          currentStatus === 'fulfilled' && 'text-green-900',
          currentStatus === 'dead' && 'text-red-900',
          (currentStatus === 'not_started' || currentStatus === 'in_progress') && 'text-squarage-black'
        )}>
          <span className="w-full truncate">{sale.name}</span>
        </div>

        {/* Product */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <ProductDropdown
            value={sale.productId || ''}
            onChange={(productId) => updateSale(sale.id, { productId })}
            compact
          />
        </div>

        {/* Date Placed */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          <span className="text-brown-dark text-xs">
            {sale.placementDate ? format(new Date(sale.placementDate), 'MM/dd/yy') : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}