import { create } from 'zustand'
import { QuickLink, QuickLinksFilters } from './quickLinksTypes'
import { loadingCoordinator } from './loadingCoordinator'

interface QuickLinksStore {
  // State
  quickLinks: QuickLink[]
  filters: QuickLinksFilters
  
  // Loading state
  isLoading: boolean
  hasLoadedFromServer: boolean
  
  // Actions
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
  
  addQuickLink: (quickLink: Omit<QuickLink, 'id' | 'createdAt' | 'updatedAt' | 'orderIndex'>) => void
  updateQuickLink: (id: string, quickLink: Partial<QuickLink>) => void
  deleteQuickLink: (id: string) => void
  reorderQuickLinks: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<QuickLinksFilters>) => void
  getFilteredQuickLinks: () => QuickLink[]
}

// Debounce timer for saves
let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 5000 // Increased from 1s to 5s to reduce database calls

const useQuickLinksStore = create<QuickLinksStore>((set, get) => ({
  // Initial state
  quickLinks: [],
  filters: {
    searchTerm: '',
    sortBy: 'manual',
  },
  
  // Loading state
  isLoading: false,
  hasLoadedFromServer: false,
  
  // Load data from server with coordination to prevent multiple simultaneous loads
  loadFromServer: async () => {
    const state = get()
    
    // Use the loading coordinator to prevent multiple simultaneous requests
    return loadingCoordinator.coordinatedLoad(
      'quicklinks-data',
      async () => {
        set({ isLoading: true })
        
        try {
          console.log('Loading quick links from server...')
          const response = await fetch('/api/quick-links/neon', {
            credentials: 'include'
          })
          
          if (!response.ok) {
            console.error(`API returned ${response.status}: ${response.statusText}`)
            if (response.status === 401) {
              console.error('Authentication error - redirecting to login')
              if (typeof window !== 'undefined') {
                window.location.href = '/login'
              }
              throw new Error('Authentication required')
            }
            throw new Error(`Failed to load quick links: ${response.statusText}`)
          }
          
          const data = await response.json()
          console.log('Loaded quick links:', data)
          
          set({
            quickLinks: data.quickLinks || [],
            isLoading: false,
            hasLoadedFromServer: true
          })
          
          return data
        } catch (error) {
          console.error('Failed to load quick links:', error)
          set({ 
            isLoading: false,
            hasLoadedFromServer: true 
          })
          throw error
        }
      },
      { bypassCache: state.isLoading }
    )
  },

  // Save data to server
  saveToServer: async () => {
    const state = get()
    
    // Don't save while loading
    if (state.isLoading) {
      console.log('Skipping save - currently loading')
      return
    }
    
    // Don't save before initial load
    if (!state.hasLoadedFromServer) {
      console.log('Skipping save - not loaded from server yet')
      return
    }
    
    // Debounce saves
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }
    
    // Debounce the save (5 second delay to batch multiple changes)
    saveDebounceTimer = setTimeout(async () => {
      try {
        console.log('Saving quick links to server...')
        const response = await fetch('/api/quick-links/neon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ quickLinks: state.quickLinks }),
        })
        
        if (!response.ok) {
          console.error(`Save failed with status ${response.status}`)
          if (response.status === 401) {
            console.error('Authentication error - redirecting to login')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return
          }
          throw new Error(`Failed to save: ${response.statusText}`)
        }
        
        console.log('Quick links saved successfully')
      } catch (error) {
        console.error('Failed to save quick links:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  },

  // Add new quick link
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

  // Update existing quick link
  updateQuickLink: (id, updates) => {
    const state = get()
    const updatedQuickLinks = state.quickLinks.map(link =>
      link.id === id
        ? { ...link, ...updates, updatedAt: new Date() }
        : link
    )
    
    set({ quickLinks: updatedQuickLinks })
    get().saveToServer()
  },

  // Delete quick link
  deleteQuickLink: (id) => {
    const state = get()
    const filteredQuickLinks = state.quickLinks.filter(link => link.id !== id)
    
    // Reindex remaining links
    const reindexedQuickLinks = filteredQuickLinks.map((link, index) => ({
      ...link,
      orderIndex: index
    }))
    
    set({ quickLinks: reindexedQuickLinks })
    get().saveToServer()
  },

  // Reorder quick links via drag and drop
  reorderQuickLinks: (activeId, overId) => {
    const state = get()
    const quickLinks = [...state.quickLinks]
    
    const activeIndex = quickLinks.findIndex(link => link.id === activeId)
    const overIndex = quickLinks.findIndex(link => link.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    // Remove and insert at new position
    const [movedItem] = quickLinks.splice(activeIndex, 1)
    quickLinks.splice(overIndex, 0, movedItem)
    
    // Reindex all links
    const reindexedQuickLinks = quickLinks.map((link, index) => ({
      ...link,
      orderIndex: index,
      updatedAt: new Date()
    }))
    
    set({ quickLinks: reindexedQuickLinks })
    get().saveToServer()
  },

  // Set filters
  setFilter: (filter) => {
    set((state) => ({
      filters: { ...state.filters, ...filter }
    }))
  },

  // Get filtered and sorted quick links
  getFilteredQuickLinks: () => {
    const state = get()
    let filtered = [...state.quickLinks]
    
    // Apply search filter
    if (state.filters.searchTerm) {
      const searchLower = state.filters.searchTerm.toLowerCase()
      filtered = filtered.filter(link =>
        link.name.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
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