'use client'

import { useState, useEffect } from 'react'
import useSalesStore from '@/lib/salesStore'
import { cn } from '@/lib/utils'
import SalesItemWidget from './SalesItemWidget'

interface SalesListGridReadOnlyProps {
  isWidget?: boolean
  containerHeight?: string
}

export default function SalesListGridReadOnly({ isWidget = false, containerHeight = '400px' }: SalesListGridReadOnlyProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  const { sales, products, collections, hasLoadedFromServer } = useSalesStore()

  useEffect(() => {
    if (hasLoadedFromServer) {
      setIsHydrated(true)
    }
  }, [hasLoadedFromServer])

  // Sort sales matching the sales tracker logic
  const getSortedSales = () => {
    const salesCopy = [...sales]

    // Separate by status
    const active = salesCopy.filter(s => s.status !== 'fulfilled' && s.status !== 'dead')
    const fulfilled = salesCopy.filter(s => s.status === 'fulfilled')
    const dead = salesCopy.filter(s => s.status === 'dead')

    // Sort each group by placement date (oldest to newest for active)
    active.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })

    fulfilled.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })

    dead.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })

    return [...active, ...fulfilled, ...dead]
  }

  const sortedSales = getSortedSales()

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/70">Loading...</div>
      </div>
    )
  }

  // Calculate pipeline metrics
  const pipelineSales = sortedSales.filter(s => s.status === 'not_started' || s.status === 'in_progress')
  const pipelineCount = pipelineSales.length

  const pipelineRevenue = pipelineSales.reduce((sum, sale) => {
    let revenue = 0
    if (typeof sale.revenue === 'number' && sale.revenue >= 0) {
      revenue = sale.revenue
    } else if (sale.productId) {
      const product = products.find(p => p.id === sale.productId)
      if (product && typeof product.revenue === 'number') {
        revenue = product.revenue
      }
    }
    return sum + revenue
  }, 0)

  return (
    <>
      {isWidget && (
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-white">Sales Tracker</h2>
          <span className="text-sm text-white/80">
            Pipeline: {pipelineCount} (${(pipelineRevenue / 100).toLocaleString()})
          </span>
        </div>
      )}

      {/* Column Headers */}
      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        <div className="grid grid-cols-[100px_1fr_100px_100px] text-xs font-medium text-brown-medium uppercase tracking-wider">
          <div className="px-2 py-1.5 text-center">Status</div>
          <div className="px-2 py-1.5 border-l border-brown-light/20">Name</div>
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Product</div>
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Date</div>
        </div>
      </div>

      <div
        className={cn(
          "border-x border-b border-brown-light/30 rounded-b-lg bg-squarage-white",
          "overflow-y-auto scrollbar-thin"
        )}
        style={{ height: containerHeight }}
      >
        <div className="divide-y divide-brown-light/20">
          {sortedSales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="hover:bg-squarage-white/30">
              <SalesItemWidget
                sale={sale}
                products={products}
                collections={collections}
              />
            </div>
          ))}

          {sortedSales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-brown-medium text-lg font-medium mb-2">No sales yet</p>
              <p className="text-brown-light text-sm">Click to view the sales tracker</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
