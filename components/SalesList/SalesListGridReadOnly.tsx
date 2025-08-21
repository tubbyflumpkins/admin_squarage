'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Sale, Product, Collection } from '@/lib/salesTypes'
import { cn } from '@/lib/utils'
import SalesItemWidget from './SalesItemWidget'

interface SalesListGridReadOnlyProps {
  isWidget?: boolean
  containerHeight?: string
}

export default function SalesListGridReadOnly({ isWidget = false, containerHeight = '400px' }: SalesListGridReadOnlyProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [data, setData] = useState<{ sales: Sale[], products: Product[], collections: Collection[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch data directly from API - NO ZUSTAND AT ALL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sales/neon')
        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
        }
      } catch (error) {
        console.error('Error fetching data for read-only widget:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Sort sales matching the sales tracker logic
  const getSortedSales = () => {
    if (!data?.sales) return []
    
    const sales = [...data.sales]
    
    // Separate by status
    const active = sales.filter(s => s.status !== 'fulfilled' && s.status !== 'dead')
    const fulfilled = sales.filter(s => s.status === 'fulfilled')
    const dead = sales.filter(s => s.status === 'dead')
    
    // Sort each group by placement date (oldest to newest for active, matching salesStore)
    active.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })
    
    fulfilled.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })
    
    dead.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })
    
    // Return with active first, then fulfilled, then dead at bottom
    return [...active, ...fulfilled, ...dead]
  }

  const sortedSales = getSortedSales()

  if (!isHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/70">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {isWidget && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Sales Tracker</h2>
        </div>
      )}

      {/* Column Headers */}
      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        <div className="grid grid-cols-[80px_1fr_100px_100px] text-xs font-medium text-brown-medium uppercase tracking-wider">
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
          {sortedSales.map((sale) => (
            <div key={sale.id} className="hover:bg-squarage-white/30">
              <SalesItemWidget
                sale={sale}
                products={data?.products || []}
                collections={data?.collections || []}
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