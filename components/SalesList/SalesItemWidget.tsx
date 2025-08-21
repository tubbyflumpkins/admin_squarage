'use client'

import { format } from 'date-fns'
import { Sale, Product, Collection, SaleStatus } from '@/lib/salesTypes'
import { cn, hexToPastel } from '@/lib/utils'

interface SalesItemWidgetProps {
  sale: Sale
  products: Product[]
  collections: Collection[]
}

export default function SalesItemWidget({ sale, products, collections }: SalesItemWidgetProps) {
  // Get product and collection details
  const product = products.find(p => p.id === sale.productId)
  const collection = product ? collections.find(c => c.id === product.collectionId) : null

  // Status colors for background - matching SalesItem exactly
  const statusColors = {
    not_started: '#F87171', // Red-400
    in_progress: '#F5B74C', // squarage-yellow
    fulfilled: '#4A9B4E', // squarage-green
    dead: '#6B7280', // Gray-500
  }

  const currentStatus = sale.status
  const statusBgColor = hexToPastel(statusColors[currentStatus])
  
  // Get status display info
  const getStatusLabel = (status: SaleStatus) => {
    switch (status) {
      case 'not_started': return 'Not Started'
      case 'in_progress': return 'In Progress'
      case 'fulfilled': return 'Fulfilled'
      case 'dead': return 'Dead'
      default: return 'Unknown'
    }
  }
  
  const getStatusColors = (status: SaleStatus) => {
    switch (status) {
      case 'not_started': return 'bg-red-400 text-white'
      case 'in_progress': return 'bg-squarage-yellow text-squarage-black'
      case 'fulfilled': return 'bg-squarage-green text-white'
      case 'dead': return 'bg-gray-600 text-white'
      default: return 'bg-gray-100 text-gray-700'
    }
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
        {/* Strike-through line for dead sales only */}
        {currentStatus === 'dead' && (
          <div 
            className={cn(
              "absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 pointer-events-none z-10",
              'bg-red-700'
            )}
          />
        )}
        
        {/* Status - Read only display */}
        <div className="px-2 py-1 flex items-center justify-center">
          <span className={cn(
            "inline-block px-1.5 py-0.5 rounded text-xs font-medium",
            getStatusColors(currentStatus)
          )}>
            {getStatusLabel(currentStatus)}
          </span>
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

        {/* Product - Read only display with color */}
        <div className="px-2 py-1 flex items-center justify-center border-l border-brown-light/20">
          {product ? (
            <span 
              className={cn(
                "inline-block px-2 py-0.5 rounded text-xs font-medium truncate max-w-full",
                collection?.color && collection.color !== '#FFFFFF' ? 'text-white' : 'text-gray-700'
              )}
              style={{ 
                backgroundColor: collection?.color || '#f3f4f6'
              }}
            >
              {product.name}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )}
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