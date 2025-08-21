'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'

interface ProductDropdownProps {
  value?: string
  onChange: (value: string | undefined) => void
  compact?: boolean
}

export default function ProductDropdown({ value, onChange, compact = false }: ProductDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { products, collections } = useSalesStore()
  
  // Get selected product and its collection
  const selectedProduct = products.find(p => p.id === value)
  const selectedCollection = selectedProduct 
    ? collections.find(c => c.id === selectedProduct.collectionId)
    : null

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (productId: string | undefined) => {
    onChange(productId)
    setIsOpen(false)
  }

  // Group products by collection
  const productsByCollection = collections.map(collection => ({
    collection,
    products: products.filter(p => p.collectionId === collection.id)
  })).filter(group => group.products.length > 0)

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-1 rounded font-medium hover:opacity-80 transition-all whitespace-nowrap",
          compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
          selectedCollection ? "text-white" : "bg-gray-100 text-gray-700"
        )}
        style={{
          backgroundColor: selectedCollection ? selectedCollection.color : undefined,
        }}
      >
        <span className="truncate font-bold">
          {selectedProduct ? selectedProduct.name : "Select..."}
        </span>
        <ChevronDown className={compact ? "w-3 h-3" : "w-4 h-4"} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto",
          compact ? "text-xs" : "text-sm"
        )}>
          {/* Option to clear selection */}
          <button
            onClick={() => handleSelect(undefined)}
            className={cn(
              "w-full text-left hover:bg-gray-50 transition-colors",
              compact ? "px-1.5 py-1" : "px-2 py-1.5",
              !value && "bg-gray-50"
            )}
          >
            <span className="text-gray-500">None</span>
          </button>
          
          {/* Products grouped by collection */}
          {productsByCollection.map(({ collection, products }) => (
            <div key={collection.id}>
              <div 
                className={cn(
                  "font-semibold border-t",
                  compact ? "px-1.5 py-1" : "px-2 py-1.5"
                )}
                style={{ 
                  backgroundColor: `${collection.color}20`,
                  borderTopColor: collection.color 
                }}
              >
                {collection.name}
              </div>
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product.id)}
                  className={cn(
                    "w-full text-left hover:bg-gray-50 transition-colors",
                    compact ? "px-3 py-1" : "px-4 py-1.5",
                    value === product.id && "bg-blue-50"
                  )}
                >
                  <span 
                    className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: collection.color }}
                  >
                    {product.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
          
          {productsByCollection.length === 0 && (
            <div className={cn(
              "text-gray-500 text-center",
              compact ? "px-1.5 py-2" : "px-2 py-3"
            )}>
              No products available
            </div>
          )}
        </div>
      )}
    </div>
  )
}