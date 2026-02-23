import { create } from 'zustand'
import { QuickLink, QuickLinksFilters } from './quickLinksTypes'
import { createEntityStoreSlice } from './createEntityStore'

interface QuickLinksStore {
  quickLinks: QuickLink[]
  filters: QuickLinksFilters
  isLoading: boolean
  hasLoadedFromServer: boolean
  loadFromServer: () => Promise<void>
  saveToServer: (options?: { immediate?: boolean }) => Promise<void>
  addQuickLink: (quickLink: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex'>) => void
  updateQuickLink: (id: string, quickLink: Partial<QuickLink>) => void
  deleteQuickLink: (id: string) => void
  reorderQuickLinks: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<QuickLinksFilters>) => void
  getFilteredQuickLinks: () => QuickLink[]
}

const loadSave = createEntityStoreSlice<QuickLinksStore>({
  coordinatorKey: 'quicklinks-data',
  endpoint: '/api/quick-links/neon',
  parseResponse: (data) => ({
    quickLinks: data.quickLinks || [],
  }),
  serializeState: (state) => ({
    quickLinks: state.quickLinks,
  }),
})

const useQuickLinksStore = create<QuickLinksStore>((set, get) => ({
  quickLinks: [],
  filters: { searchTerm: '', sortBy: 'manual' },
  ...loadSave(set, get),

  addQuickLink: (quickLink) => {
    const state = get()
    const maxOrderIndex = Math.max(...state.quickLinks.map(l => l.orderIndex), -1)
    const newQuickLink: QuickLink = {
      ...quickLink,
      id: `ql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderIndex: maxOrderIndex + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({ quickLinks: [...state.quickLinks, newQuickLink] })
    get().saveToServer()
  },

  updateQuickLink: (id, updates) => {
    const state = get()
    set({
      quickLinks: state.quickLinks.map(link =>
        link.id === id ? { ...link, ...updates, updatedAt: new Date() } : link
      ),
    })
    get().saveToServer()
  },

  deleteQuickLink: (id) => {
    const state = get()
    const filtered = state.quickLinks.filter(link => link.id !== id)
    set({
      quickLinks: filtered.map((link, index) => ({ ...link, orderIndex: index })),
    })
    get().saveToServer()
  },

  reorderQuickLinks: (activeId, overId) => {
    const state = get()
    const quickLinks = [...state.quickLinks]
    const activeIndex = quickLinks.findIndex(link => link.id === activeId)
    const overIndex = quickLinks.findIndex(link => link.id === overId)
    if (activeIndex === -1 || overIndex === -1) return
    const [movedItem] = quickLinks.splice(activeIndex, 1)
    quickLinks.splice(overIndex, 0, movedItem)
    set({
      quickLinks: quickLinks.map((link, index) => ({
        ...link,
        orderIndex: index,
        updatedAt: new Date(),
      })),
    })
    get().saveToServer()
  },

  setFilter: (filter) => {
    set((state) => ({ filters: { ...state.filters, ...filter } }))
  },

  getFilteredQuickLinks: () => {
    const state = get()
    let filtered = [...state.quickLinks]
    if (state.filters.searchTerm) {
      const searchLower = state.filters.searchTerm.toLowerCase()
      filtered = filtered.filter(link =>
        link.name.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower)
      )
    }
    switch (state.filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'manual':
      default:
        filtered.sort((a, b) => a.orderIndex - b.orderIndex)
        break
    }
    return filtered
  },
}))

export default useQuickLinksStore
