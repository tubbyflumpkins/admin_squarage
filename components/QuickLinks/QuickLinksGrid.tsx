'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useQuickLinksStore from '@/lib/quickLinksStore'
import QuickLinkItem from './QuickLinkItem'
import AddQuickLinkModal from './AddQuickLinkModal'
import Button from '@/components/UI/Button'
import { QuickLink } from '@/lib/quickLinksTypes'

// Sortable wrapper component
function SortableQuickLinkItem({ quickLink, onUpdate, onDelete, onEdit }: {
  quickLink: QuickLink
  onUpdate: (id: string, updates: Partial<QuickLink>) => void
  onDelete: (id: string) => void
  onEdit: (quickLink: QuickLink) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quickLink.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QuickLinkItem
        quickLink={quickLink}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEdit={onEdit}
        isDragging={isDragging}
        dragListeners={listeners}
      />
    </div>
  )
}

export default function QuickLinksGrid() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingQuickLink, setEditingQuickLink] = useState<QuickLink | null>(null)
  
  const {
    quickLinks,
    filters,
    loadFromServer,
    addQuickLink,
    updateQuickLink,
    deleteQuickLink,
    reorderQuickLinks,
    setFilter,
    getFilteredQuickLinks,
  } = useQuickLinksStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadFromServer().then(() => {
      setIsHydrated(true)
    })
  }, [loadFromServer])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderQuickLinks(active.id as string, over.id as string)
    }
  }

  const handleAddQuickLink = (quickLink: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex'>) => {
    if (editingQuickLink) {
      updateQuickLink(editingQuickLink.id, quickLink)
    } else {
      addQuickLink(quickLink)
    }
    setEditingQuickLink(null)
  }

  const handleEdit = (quickLink: QuickLink) => {
    setEditingQuickLink(quickLink)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quick link?')) {
      deleteQuickLink(id)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-squarage-black/60"></div>
      </div>
    )
  }

  const filteredQuickLinks = getFilteredQuickLinks()

  return (
    <>
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-squarage-black/60" />
            <input
              type="text"
              placeholder="Search quick links..."
              value={filters.searchTerm || ''}
              onChange={(e) => setFilter({ searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm text-squarage-black placeholder-squarage-black/50 rounded-lg border border-squarage-black/20 focus:outline-none focus:border-squarage-black/40"
            />
          </div>
        </div>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilter({ sortBy: e.target.value as any })}
          className="px-4 py-2 bg-white/50 backdrop-blur-sm text-squarage-black rounded-lg border border-squarage-black/20 focus:outline-none focus:border-squarage-black/40"
        >
          <option value="manual">Manual Order</option>
          <option value="name">Name</option>
          <option value="date">Date Added</option>
        </select>

        <Button
          onClick={() => {
            setEditingQuickLink(null)
            setIsAddModalOpen(true)
          }}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </Button>
      </div>

      {/* Quick Links Grid */}
      {filteredQuickLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-squarage-black/60">
          <p className="text-lg mb-2">No quick links found</p>
          <p className="text-sm">Add your first quick link to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredQuickLinks.map(ql => ql.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredQuickLinks.map((quickLink) => (
                <SortableQuickLinkItem
                  key={quickLink.id}
                  quickLink={quickLink}
                  onUpdate={updateQuickLink}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Modal */}
      <AddQuickLinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingQuickLink(null)
        }}
        onSave={handleAddQuickLink}
        editingQuickLink={editingQuickLink}
      />
    </>
  )
}