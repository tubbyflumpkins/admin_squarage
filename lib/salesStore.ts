import { create } from 'zustand'
import { Sale, SalesFilters, SortBy, SaleStatus, FilterBy, SaleSubtask, DeliveryMethod, Collection, Product } from './salesTypes'

interface SalesStore {
  // State
  sales: Sale[]
  collections: Collection[]
  products: Product[]
  filters: SalesFilters
  
  // Loading state
  isLoading: boolean
  hasLoadedFromServer: boolean
  
  // Actions
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
  
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSale: (id: string, sale: Partial<Sale>) => void
  deleteSale: (id: string) => void
  reorderSales: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<SalesFilters>) => void
  getFilteredSales: () => Sale[]
  
  // Collection management
  addCollection: (collection: Omit<Collection, 'id'>) => void
  updateCollection: (id: string, collection: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  
  // Product management
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProductsByCollection: (collectionId: string) => Product[]
  
  // Subtask management
  addSubtask: (saleId: string, text: string) => void
  updateSubtask: (saleId: string, subtaskId: string, updates: Partial<SaleSubtask>) => void
  deleteSubtask: (saleId: string, subtaskId: string) => void
  toggleSubtask: (saleId: string, subtaskId: string) => void
  
  // Notes management
  updateNotes: (saleId: string, notes: string) => void
}

// Debounce timer for saves
let saveDebounceTimer: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 1000

const useSalesStore = create<SalesStore>((set, get) => ({
  // Initial state
  sales: [],
  collections: [],
  products: [],
  filters: {
    deliveryMethod: undefined,
    status: 'all' as FilterBy,
    sortBy: 'placementDate' as SortBy,
  },
  
  // Loading state
  isLoading: false,
  hasLoadedFromServer: false,
  
  // Load data from server
  loadFromServer: async () => {
    const state = get()
    // Prevent concurrent loads but always allow fresh data fetch
    if (state.isLoading) {
      console.log('Already loading sales, skipping concurrent request...')
      return
    }
    
    set({ isLoading: true })
    
    try {
      console.log('Loading sales data from server...')
      const response = await fetch('/api/sales/neon')
      
      if (!response.ok) {
        console.error(`Sales API returned ${response.status}: ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to load sales data: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Sales data loaded from server:', {
        salesCount: data.sales?.length || 0
      })
      
      // Always update state with received data (even if some parts are empty)
      set({
        sales: data.sales || [],
        collections: data.collections || [],
        products: data.products || [],
        isLoading: false,
        hasLoadedFromServer: true
      })
      
      console.log('Sales store updated with:', {
        salesCount: data.sales?.length || 0,
        collectionsCount: data.collections?.length || 0,
        productsCount: data.products?.length || 0
      })
    } catch (error) {
      console.error('Error loading sales data from server:', error)
      // Try to provide helpful error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - could not connect to Sales API')
      }
      set({ 
        isLoading: false,
        hasLoadedFromServer: true // Mark as loaded even on error to prevent infinite retries
      })
    }
  },
  
  // Save data to server (debounced)
  saveToServer: async () => {
    const state = get()
    
    // Don't save if we haven't loaded from server yet
    if (!state.hasLoadedFromServer) {
      console.log('Skipping save - sales data not loaded from server yet')
      return
    }
    
    // Don't save if currently loading
    if (state.isLoading) {
      console.log('Skipping save - currently loading sales data')
      return
    }
    
    // Safety check: Don't save empty state if we supposedly have loaded data
    if (state.hasLoadedFromServer && state.sales.length === 0) {
      // Check if this is a legitimate empty state or a potential data loss
      console.warn('Warning: Attempting to save empty sales state')
    }
    
    // Clear existing timer
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }
    
    // Debounce the save
    saveDebounceTimer = setTimeout(async () => {
      try {
        console.log('Saving sales data to server...')
        const response = await fetch('/api/sales/neon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sales: state.sales,
            collections: state.collections,
            products: state.products
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          if (errorData.blocked) {
            console.error('CRITICAL: Server blocked empty state save to prevent data loss')
          } else {
            console.error('Failed to save sales data:', errorData)
          }
        } else {
          console.log('Sales data saved successfully')
        }
      } catch (error) {
        console.error('Error saving sales data:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  },
  
  // Add a new sale
  addSale: (sale) => {
    const newSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    set((state) => ({
      sales: [newSale, ...state.sales],
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  // Update a sale
  updateSale: (id, updates) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === id
          ? { ...sale, ...updates, updatedAt: new Date() }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  // Delete a sale
  deleteSale: (id) => {
    set((state) => ({
      sales: state.sales.filter((sale) => sale.id !== id),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  // Reorder sales (for drag and drop)
  reorderSales: (activeId, overId) => {
    set((state) => {
      const sales = [...state.sales]
      const oldIndex = sales.findIndex((s) => s.id === activeId)
      const newIndex = sales.findIndex((s) => s.id === overId)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const [removed] = sales.splice(oldIndex, 1)
        sales.splice(newIndex, 0, removed)
      }
      
      return { sales }
    })
    
    // Auto-save
    get().saveToServer()
  },
  
  // Set filter
  setFilter: (filter) => {
    set((state) => ({
      filters: { ...state.filters, ...filter },
    }))
  },
  
  // Get filtered and sorted sales
  getFilteredSales: () => {
    const state = get()
    let filtered = [...state.sales]
    
    // Apply filters
    if (state.filters.deliveryMethod) {
      filtered = filtered.filter((s) => s.deliveryMethod === state.filters.deliveryMethod)
    }
    
    // Apply status filter
    if (state.filters.status === 'fulfilled') {
      filtered = filtered.filter((s) => s.status === 'fulfilled')
    } else if (state.filters.status === 'pending') {
      filtered = filtered.filter((s) => s.status !== 'fulfilled' && s.status !== 'dead')
    }
    
    // Separate active from fulfilled/dead
    const active = filtered.filter((s) => s.status !== 'fulfilled' && s.status !== 'dead')
    const completed = filtered.filter((s) => s.status === 'fulfilled' || s.status === 'dead')
    
    // Sort both groups by placement date (oldest to newest)
    active.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })
    
    completed.sort((a, b) => {
      return new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    })
    
    // Return with active orders first, then completed/dead at the bottom
    return [...active, ...completed]
  },
  
  // Collection management
  addCollection: (collection) => {
    const newCollection: Collection = {
      ...collection,
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    
    set((state) => ({
      collections: [...state.collections, newCollection],
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  updateCollection: (id, updates) => {
    set((state) => ({
      collections: state.collections.map((col) =>
        col.id === id ? { ...col, ...updates } : col
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  deleteCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((col) => col.id !== id),
      // Also delete all products in this collection
      products: state.products.filter((prod) => prod.collectionId !== id),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  // Product management
  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    
    set((state) => ({
      products: [...state.products, newProduct],
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((prod) =>
        prod.id === id ? { ...prod, ...updates } : prod
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((prod) => prod.id !== id),
      // Also remove product references from sales
      sales: state.sales.map((sale) =>
        sale.productId === id ? { ...sale, productId: undefined } : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  getProductsByCollection: (collectionId) => {
    const state = get()
    return state.products.filter((prod) => prod.collectionId === collectionId)
  },
  
  // Subtask management
  addSubtask: (saleId, text) => {
    const newSubtask: SaleSubtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
    }
    
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              subtasks: [...(sale.subtasks || []), newSubtask],
              updatedAt: new Date(),
            }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  updateSubtask: (saleId, subtaskId, updates) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              subtasks: sale.subtasks?.map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
              updatedAt: new Date(),
            }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  deleteSubtask: (saleId, subtaskId) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              subtasks: sale.subtasks?.filter((st) => st.id !== subtaskId),
              updatedAt: new Date(),
            }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  toggleSubtask: (saleId, subtaskId) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              subtasks: sale.subtasks?.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
              updatedAt: new Date(),
            }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
  
  // Notes management
  updateNotes: (saleId, notes) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? { ...sale, notes, updatedAt: new Date() }
          : sale
      ),
    }))
    
    // Auto-save
    get().saveToServer()
  },
}))

export default useSalesStore