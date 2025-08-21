'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import useSalesStore from '@/lib/salesStore'
import SalesItem from './SalesItem'
import SalesItemEditable from './SalesItemEditable'
import CollectionProductEditModal from './CollectionProductEditModal'
import type { Sale } from '@/lib/salesTypes'

interface SalesListGridProps {
  isFullPage?: boolean
  isGlassView?: boolean
}

export default function SalesListGrid({ isFullPage = false, isGlassView = false }: SalesListGridProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  const {
    sales,
    filters,
    isLoading,
    hasLoadedFromServer,
    loadFromServer,
    getFilteredSales,
    deleteSale,
    reorderSales,
    addSale,
    setFilter
  } = useSalesStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load data from server on mount
  useEffect(() => {
    const loadData = async () => {
      // Load data from server on mount
      await loadFromServer()
      setIsHydrated(true)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderSales(active.id as string, over.id as string)
    }
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
  }

  const handleSaveNew = (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
    addSale(saleData)
    setIsAddingNew(false)
  }

  const handleCancelEdit = () => {
    setIsAddingNew(false)
  }

  const handleEdit = (sale: Sale) => {
    // For now, edit is handled inline with double-click on fields
    // This function is kept for compatibility but not used
  }

  const filteredSales = getFilteredSales()

  // Sorting options
  const handleSort = (sortBy: 'placementDate' | 'status' | 'deliveryMethod' | 'createdAt') => {
    setFilter({ sortBy })
  }

  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading your sales...</div>
          <div className="text-white/70 text-sm">Fetching data from server</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header with Add Sale and Settings buttons */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
        >
          <Plus size={18} className="text-squarage-black" />
          <span>Add Sale</span>
        </button>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-white/50 rounded-xl border border-white/60 text-squarage-black font-medium hover:bg-white/65 hover:scale-105 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 transform shadow-lg"
          title="Settings"
        >
          <Settings2 size={18} className="text-squarage-black" />
          <span>Settings</span>
        </button>
      </div>

      {/* Column Headers */}
      <div className="bg-squarage-white/50 rounded-t-lg border border-brown-light/30">
        <div className="grid grid-cols-[14px_110px_1fr_200px_80px_120px_100px_30px_32px] text-xs font-medium text-brown-medium uppercase tracking-wider">
          <div className="px-2 py-1.5" /> {/* Space for drag handle */}
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20">Status</div>
          
          <button
            onClick={() => handleSort('placementDate')}
            className="px-2 py-1.5 flex items-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Name
          </button>
          
          <div className="px-2 py-1.5 border-l border-brown-light/20">Product</div>
          
          <div className="px-2 py-1.5 text-right border-l border-brown-light/20">Revenue</div>
          
          <button
            onClick={() => handleSort('placementDate')}
            className="px-2 py-1.5 flex items-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Placed
          </button>
          
          <button
            onClick={() => handleSort('deliveryMethod')}
            className="px-2 py-1.5 flex items-center gap-1 hover:text-squarage-green transition-colors border-l border-brown-light/20"
          >
            Delivery
          </button>
          
          <div className="px-1 py-1.5 text-center border-l border-brown-light/20" title="Subtasks">
            📋
          </div>
          
          <div className="px-2 py-1.5 text-center border-l border-brown-light/20"></div>
        </div>
      </div>

      {/* Sales Items Container */}
      <div 
        className={cn(
          "border-x border-b border-brown-light/30 rounded-b-lg bg-squarage-white",
          !isFullPage && "overflow-y-auto scrollbar-thin"
        )}
        style={{ height: isFullPage ? 'auto' : '500px' }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredSales.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-brown-light/20">
              {isAddingNew && (
                <div className="hover:bg-squarage-white/30">
                  <SalesItemEditable
                    isNew
                    onSave={handleSaveNew}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}
              
              {filteredSales.map((sale) => (
                <div key={sale.id} className="hover:bg-squarage-white/30">
                  <SalesItem
                    sale={sale}
                    onEdit={handleEdit}
                    onDelete={deleteSale}
                    isGlassView={false}
                  />
                </div>
              ))}
              
              {filteredSales.length === 0 && !isAddingNew && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-brown-light mb-4">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="mx-auto"
                    >
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                  </div>
                  <p className="text-brown-medium text-lg font-medium mb-2">No sales yet</p>
                  <p className="text-brown-light text-sm">Click &quot;Add Sale&quot; to create your first sale</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      {/* Settings Modal */}
      <CollectionProductEditModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  )
}