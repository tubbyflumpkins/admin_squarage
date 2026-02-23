'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'
import { useDropdown } from '@/hooks/useDropdown'

interface FilterOption {
  id: string
  name: string
  color?: string
}

interface SalesFilterDropdownProps {
  type: 'product' | 'color'
  options: FilterOption[]
  selectedValue: string | undefined
  onSelect: (value: string | undefined) => void
  className?: string
}

export default function SalesFilterDropdown({
  type,
  options,
  selectedValue,
  onSelect,
  className
}: SalesFilterDropdownProps) {
  const { isOpen, toggle, close, containerRef } = useDropdown({ mode: 'inline' })
  const { collections, products } = useSalesStore()

  const selectedOption = options.find(opt =>
    type === 'color' ? opt.color === selectedValue : opt.id === selectedValue
  )
  const label = type === 'product' ? 'Product' : 'Color'

  // Check if selected value is a collection ID
  const selectedCollection = type === 'product' && selectedValue?.startsWith('col-')
    ? collections.find(c => c.id === selectedValue)
    : null

  const handleSelect = (value: string | undefined) => {
    onSelect(value)
    close()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => toggle()}
        className={cn(
          "w-full px-2 py-1.5 flex items-center justify-center gap-1 hover:text-squarage-green transition-colors",
          "text-xs font-medium whitespace-nowrap overflow-visible",
          (selectedValue || isOpen) && type === 'product' && selectedOption?.color !== '#FFFFFF' && "text-white hover:text-white",
          (selectedValue || isOpen) && type === 'product' && selectedOption?.color === '#FFFFFF' && "text-black hover:text-black",
          selectedCollection && selectedCollection.color !== '#FFFFFF' && "text-white hover:text-white",
          selectedCollection && selectedCollection.color === '#FFFFFF' && "text-black hover:text-black",
          isOpen && "bg-squarage-green text-white hover:text-white"
        )}
        style={{
          backgroundColor: !isOpen ? (
            type === 'product' && selectedCollection ? selectedCollection.color :
            type === 'product' && selectedOption?.color ? selectedOption.color :
            type === 'color' && selectedOption ? selectedOption.color :
            undefined
          ) : undefined,
        }}
      >
        <span className={cn(
          type === 'color' && "min-w-fit"
        )}>
          {type === 'product' && selectedCollection ? selectedCollection.name :
           type === 'product' && selectedOption ? selectedOption.name :
           type === 'color' && selectedOption ? selectedOption.name :
           label}
        </span>
      </button>

      {isOpen && type === 'product' && (
        <div className="absolute z-50 mt-2 backdrop-blur-xl bg-white/40 border-2 border-white/60 rounded-2xl shadow-2xl p-5"
             style={{ left: '50%', transform: 'translateX(-50%)', minWidth: '450px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent rounded-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-squarage-black drop-shadow-sm">Select Product or Collection</h3>
              <button
                onClick={close}
                className="text-squarage-black/60 hover:text-squarage-black transition-colors hover:scale-110 transform"
              >
                <X size={16} />
              </button>
            </div>

            {/* All Products Button */}
            <button
              onClick={() => handleSelect(undefined)}
              className={cn(
                "w-full mb-4 px-4 py-2.5 text-sm font-medium rounded-xl",
                "backdrop-blur-sm bg-white/50 border border-white/60",
                "hover:bg-white/70 hover:scale-[1.02] hover:shadow-lg",
                "transition-all duration-200 transform",
                !selectedValue && "ring-2 ring-squarage-green bg-squarage-green/20"
              )}
            >
              All Products
            </button>

            {/* Collections Grid */}
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
              {collections.map(collection => {
                const collectionProducts = products.filter(p => p.collectionId === collection.id)
                return (
                  <div key={collection.id} className="space-y-2">
                    {/* Collection Header - Clickable */}
                    <button
                      onClick={() => handleSelect(collection.id)}
                      className={cn(
                        "w-full px-3 py-2 text-xs font-bold text-white rounded-xl",
                        "shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 transform",
                        selectedValue === collection.id && "ring-2 ring-offset-2 ring-offset-white/50 ring-squarage-green"
                      )}
                      style={{
                        backgroundColor: collection.color,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      {collection.name}
                      <div className="text-[10px] opacity-90 font-normal">
                        {collectionProducts.length} product{collectionProducts.length !== 1 ? 's' : ''}
                      </div>
                    </button>

                    {/* Products in Collection */}
                    <div className="space-y-1.5">
                      {collectionProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleSelect(product.id)}
                          className={cn(
                            "w-full px-2.5 py-1.5 text-xs text-left rounded-lg",
                            "backdrop-blur-sm bg-white/60 border border-white/70",
                            "hover:bg-white/80 hover:scale-[1.02] hover:shadow-md",
                            "transition-all duration-150 transform",
                            selectedValue === product.id && "ring-2 ring-squarage-green bg-squarage-green/10"
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
                )
              })}
            </div>
          </div>
        </div>
      )}

      {isOpen && type === 'color' && (
        <div className="absolute z-50 mt-2 backdrop-blur-xl bg-white/40 border-2 border-white/60 rounded-2xl shadow-2xl p-4"
             style={{ left: '50%', transform: 'translateX(-50%)', minWidth: '240px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent rounded-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-squarage-black drop-shadow-sm">Select Color</h3>
              <button
                onClick={close}
                className="text-squarage-black/60 hover:text-squarage-black transition-colors hover:scale-110 transform"
              >
                <X size={14} />
              </button>
            </div>

            {/* All Colors Button */}
            <button
              onClick={() => handleSelect(undefined)}
              className={cn(
                "w-full mb-3 px-3 py-2 text-xs font-medium rounded-xl",
                "backdrop-blur-sm bg-white/50 border border-white/60",
                "hover:bg-white/70 hover:scale-[1.02] hover:shadow-lg",
                "transition-all duration-200 transform",
                !selectedValue && "ring-2 ring-squarage-green bg-squarage-green/20"
              )}
            >
              All Colors
            </button>

            {/* Color Grid */}
            <div className="grid grid-cols-5 gap-2 p-1">
              {options.map((option) => (
                <button
                  key={option.color}
                  onClick={() => handleSelect(option.color)}
                  className={cn(
                    "w-9 h-9 rounded-lg border-2 shadow-md",
                    "hover:scale-110 hover:shadow-lg transition-all duration-200 transform",
                    selectedValue === option.color ?
                      "border-squarage-black ring-2 ring-squarage-green" :
                      "border-white/80 hover:border-white"
                  )}
                  style={{
                    backgroundColor: option.color,
                    backdropFilter: 'blur(4px)'
                  }}
                  title={option.name || option.color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
