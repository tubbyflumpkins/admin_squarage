'use client'

import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'
import { useDropdown } from '@/hooks/useDropdown'

interface ProductDropdownProps {
  value?: string
  onChange: (value: string | undefined) => void
  compact?: boolean
  selectedColor?: string
}

export default function ProductDropdown({ value, onChange, compact = false, selectedColor }: ProductDropdownProps) {
  const { isOpen, toggle, close, containerRef } = useDropdown({ mode: 'inline' })

  const { products, collections } = useSalesStore()

  // Get selected product and its collection
  const selectedProduct = products.find(p => p.id === value)
  const selectedCollection = selectedProduct
    ? collections.find(c => c.id === selectedProduct.collectionId)
    : null

  const handleSelect = (productId: string | undefined) => {
    onChange(productId)
    close()
  }

  // Group products by collection
  const productsByCollection = collections.map(collection => ({
    collection,
    products: products.filter(p => p.collectionId === collection.id)
  })).filter(group => group.products.length > 0)

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => toggle()}
        className={cn(
          "flex w-full items-center justify-center gap-1 rounded font-medium hover:opacity-80 transition-all whitespace-nowrap",
          compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
          !selectedCollection && "bg-gray-100 text-gray-700",
          selectedCollection && (selectedColor === '#FFFFFF' || selectedCollection.color === '#FFFFFF') ? "text-black" :
          selectedCollection ? "text-white" : ""
        )}
        style={{
          backgroundColor: selectedColor || (selectedCollection ? selectedCollection.color : undefined),
        }}
      >
        <span className="truncate font-bold">
          {selectedProduct ? selectedProduct.name : "Select"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 backdrop-blur-xl bg-white/40 border-2 border-white/60 rounded-2xl shadow-2xl p-4"
             style={{ left: '50%', transform: 'translateX(-50%)', minWidth: '380px', maxWidth: '90vw' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent rounded-2xl pointer-events-none" />
          <div className="relative">
            {/* Header */}
            <div className="mb-3">
              <h3 className="text-xs font-bold text-squarage-black drop-shadow-sm">Select Product</h3>
            </div>

            {/* Option to clear selection */}
            <button
              onClick={() => handleSelect(undefined)}
              className={cn(
                "w-full mb-3 px-3 py-2 text-xs font-medium rounded-xl text-left",
                "backdrop-blur-sm bg-white/50 border border-white/60",
                "hover:bg-white/70 hover:scale-[1.01] hover:shadow-lg",
                "transition-all duration-200 transform",
                !value && "ring-2 ring-squarage-green bg-squarage-green/20"
              )}
            >
              <span className="text-gray-600">No Product</span>
            </button>

            {/* Collections Grid */}
            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {productsByCollection.map(({ collection, products }) => (
                <div key={collection.id} className="space-y-2">
                  {/* Collection Header (not clickable in product selector) */}
                  <div
                    className="w-full px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-md"
                    style={{
                      backgroundColor: collection.color,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {collection.name}
                  </div>

                  {/* Products in Collection */}
                  <div className="space-y-1">
                    {products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product.id)}
                        className={cn(
                          "w-full px-2.5 py-1.5 text-xs text-left rounded-lg",
                          "backdrop-blur-sm bg-white/60 border border-white/70",
                          "hover:bg-white/80 hover:scale-[1.02] hover:shadow-md",
                          "transition-all duration-150 transform",
                          value === product.id && "ring-2 ring-squarage-green bg-squarage-green/10"
                        )}
                        style={{
                          borderColor: `${collection.color}40`
                        }}
                      >
                        <div className="font-semibold text-squarage-black">{product.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {productsByCollection.length === 0 && (
              <div className="text-center py-4 text-xs text-gray-500">
                No products available. Add products in Settings.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
