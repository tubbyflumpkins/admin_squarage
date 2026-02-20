import { create } from 'zustand'
import {
  Sale,
  SalesFilters,
  SortBy,
  FilterBy,
  SaleSubtask,
  Collection,
  Product,
  SaleChannel,
  CollectionColor,
} from './salesTypes'
import { createEntityStoreSlice } from './createEntityStore'
import { loadingCoordinator } from './loadingCoordinator'

interface SalesStore {
  sales: Sale[]
  collections: Collection[]
  products: Product[]
  channels: SaleChannel[]
  filters: SalesFilters
  isLoading: boolean
  hasLoadedFromServer: boolean
  loadFromServer: () => Promise<void>
  saveToServer: (options?: { immediate?: boolean }) => Promise<void>
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSale: (id: string, sale: Partial<Sale>, options?: { immediate?: boolean }) => void
  deleteSale: (id: string) => void
  reorderSales: (activeId: string, overId: string) => void
  setFilter: (filter: Partial<SalesFilters>) => void
  getFilteredSales: () => Sale[]
  addCollection: (collection: Omit<Collection, 'id'>) => void
  updateCollection: (id: string, collection: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  addCollectionColor: (collectionId: string, color: string) => void
  removeCollectionColor: (collectionId: string, color: string) => void
  setCollectionColors: (collectionId: string, colors: CollectionColor[]) => void
  updateCollectionColor: (
    collectionId: string,
    color: string,
    updates: Partial<CollectionColor>
  ) => void
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProductsByCollection: (collectionId: string) => Product[]
  addChannel: (channel: Omit<SaleChannel, 'id' | 'createdAt'>) => void
  updateChannel: (id: string, channel: Partial<SaleChannel>) => void
  deleteChannel: (id: string) => void
  addSubtask: (saleId: string, text: string) => void
  updateSubtask: (saleId: string, subtaskId: string, updates: Partial<SaleSubtask>) => void
  deleteSubtask: (saleId: string, subtaskId: string) => void
  toggleSubtask: (saleId: string, subtaskId: string) => void
  updateNotes: (saleId: string, notes: string) => void
}

const normalizeColorName = (value: string, providedName?: string) => {
  if (providedName && providedName.trim().length > 0) {
    return providedName.trim()
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Unnamed Color'
  }
  const trimmedValue = value.trim()
  return trimmedValue.startsWith('#') ? trimmedValue.toUpperCase() : trimmedValue
}

const createCollectionColor = (value: string, name?: string): CollectionColor => {
  const safeValue = typeof value === 'string' ? value.trim() : ''
  return {
    value: safeValue,
    name: normalizeColorName(safeValue, name),
  }
}

const normalizeCollectionColors = (
  rawColors: unknown,
  fallbackColor: string
): CollectionColor[] => {
  const normalized: CollectionColor[] = []
  const seen = new Set<string>()

  if (Array.isArray(rawColors)) {
    rawColors.forEach(entry => {
      if (typeof entry === 'string') {
        const color = createCollectionColor(entry)
        if (!color.value) return
        if (!seen.has(color.value)) {
          normalized.push(color)
          seen.add(color.value)
        }
      } else if (entry && typeof entry === 'object') {
        const value = typeof (entry as any).value === 'string' ? (entry as any).value : undefined
        if (!value) return
        const color = createCollectionColor(value, typeof (entry as any).name === 'string' ? (entry as any).name : undefined)
        if (!color.value) return
        if (!seen.has(color.value)) {
          normalized.push(color)
          seen.add(color.value)
        }
      }
    })
  }

  const fallback = typeof fallbackColor === 'string' ? fallbackColor.trim() : ''
  if (fallback && !seen.has(fallback)) {
    const fb = createCollectionColor(fallback)
    if (fb.value) {
      normalized.unshift(fb)
    }
  }

  if (normalized.length === 0 && fallback) {
    const fb = createCollectionColor(fallback)
    if (fb.value) {
      return [fb]
    }
  }

  return normalized
}

const normalizeCollectionRecord = (
  collection: Collection | (Collection & { availableColors?: unknown })
): Collection => {
  const fallbackColor = typeof collection.color === 'string' ? collection.color : ''
  const normalized = {
    ...collection,
    availableColors: normalizeCollectionColors(collection.availableColors, fallbackColor),
  }
  return normalized as Collection
}

let hasPendingChannels = false

const loadSave = createEntityStoreSlice<SalesStore>({
  coordinatorKey: 'sales-data',
  endpoint: '/api/sales/neon',
  parseResponse: (data, state) => {
    const normalizedChannels: SaleChannel[] = (data.channels || []).map(
      (channel: any) => ({
        ...channel,
        createdAt: channel.createdAt ? new Date(channel.createdAt) : new Date(),
      })
    )
    const normalizedCollections: Collection[] = (data.collections || []).map(
      (collection: any) => normalizeCollectionRecord(collection)
    )
    const existingChannels = state.channels || []
    const pendingChannels = existingChannels.filter(
      channel => !normalizedChannels.some(existing => existing.id === channel.id)
    )
    hasPendingChannels = pendingChannels.length > 0

    return {
      sales: data.sales || [],
      collections: normalizedCollections,
      products: data.products || [],
      channels: [...normalizedChannels, ...pendingChannels],
    }
  },
  serializeState: (state) => ({
    sales: state.sales,
    collections: state.collections,
    products: state.products,
    channels: state.channels,
  }),
  afterLoad: (get) => {
    if (hasPendingChannels) {
      hasPendingChannels = false
      void get().saveToServer({ immediate: true })
    }
  },
  afterSave: () => {
    loadingCoordinator.clearCache('dashboard-all-data')
    loadingCoordinator.clearCache('sales-data')
  },
})

const useSalesStore = create<SalesStore>((set, get) => ({
  sales: [],
  collections: [],
  products: [],
  channels: [],
  filters: {
    deliveryMethod: undefined,
    status: 'all' as FilterBy,
    sortBy: 'placementDate' as SortBy,
    productId: undefined,
    selectedColor: undefined,
    channelId: undefined,
  },
  ...loadSave(set, get),

  addSale: (sale) => {
    const newSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({ sales: [newSale, ...state.sales] }))
    get().saveToServer()
  },

  updateSale: (id, updates, options) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === id ? { ...sale, ...updates, updatedAt: new Date() } : sale
      ),
    }))
    get().saveToServer(options)
  },

  deleteSale: (id) => {
    set((state) => ({ sales: state.sales.filter((sale) => sale.id !== id) }))
    get().saveToServer()
  },

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
    get().saveToServer()
  },

  setFilter: (filter) => {
    set((state) => ({ filters: { ...state.filters, ...filter } }))
  },

  getFilteredSales: () => {
    const state = get()
    let filtered = [...state.sales]

    if (state.filters.deliveryMethod) {
      filtered = filtered.filter((s) => s.deliveryMethod === state.filters.deliveryMethod)
    }
    if (state.filters.productId) {
      if (state.filters.productId.startsWith('col-')) {
        const collectionProducts = state.products
          .filter(p => p.collectionId === state.filters.productId)
          .map(p => p.id)
        filtered = filtered.filter((s) => s.productId && collectionProducts.includes(s.productId))
      } else {
        filtered = filtered.filter((s) => s.productId === state.filters.productId)
      }
    }
    if (state.filters.selectedColor) {
      filtered = filtered.filter((s) => s.selectedColor === state.filters.selectedColor)
    }
    if (state.filters.channelId) {
      filtered = filtered.filter((s) => s.channelId === state.filters.channelId)
    }
    if (state.filters.status === 'fulfilled') {
      filtered = filtered.filter((s) => s.status === 'fulfilled')
    } else if (state.filters.status === 'pending') {
      filtered = filtered.filter((s) => s.status !== 'fulfilled' && s.status !== 'dead')
    }

    const active = filtered.filter((s) => s.status !== 'fulfilled' && s.status !== 'dead')
    const completed = filtered.filter((s) => s.status === 'fulfilled' || s.status === 'dead')

    active.sort((a, b) =>
      new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    )
    completed.sort((a, b) =>
      new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    )

    return [...active, ...completed]
  },

  addCollection: (collection) => {
    const newCollection: Collection = normalizeCollectionRecord({
      ...collection,
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })
    set(state => ({ collections: [...state.collections, newCollection] }))
    get().saveToServer()
  },

  updateCollection: (id, updates) => {
    set(state => ({
      collections: state.collections.map(col =>
        col.id === id ? normalizeCollectionRecord({ ...col, ...updates }) : col
      ),
    }))
    get().saveToServer()
  },

  deleteCollection: (id) => {
    set(state => ({
      collections: state.collections.filter(col => col.id !== id),
      products: state.products.filter(prod => prod.collectionId !== id),
    }))
    get().saveToServer()
  },

  addCollectionColor: (collectionId, color) => {
    set(state => ({
      collections: state.collections.map(col => {
        if (col.id !== collectionId) return col
        const existing = col.availableColors || []
        if (existing.some(entry => entry.value === color)) return col
        const nextColors = normalizeCollectionColors(
          [...existing, createCollectionColor(color)],
          col.color
        )
        return { ...col, availableColors: nextColors }
      }),
    }))
    get().saveToServer()
  },

  removeCollectionColor: (collectionId, color) => {
    set(state => ({
      collections: state.collections.map(col =>
        col.id === collectionId
          ? {
              ...col,
              availableColors: normalizeCollectionColors(
                (col.availableColors || []).filter(entry => entry.value !== color),
                col.color
              ),
            }
          : col
      ),
    }))
    get().saveToServer()
  },

  setCollectionColors: (collectionId, colors) => {
    set(state => ({
      collections: state.collections.map(col =>
        col.id === collectionId
          ? { ...col, availableColors: normalizeCollectionColors(colors, col.color) }
          : col
      ),
    }))
    get().saveToServer()
  },

  updateCollectionColor: (collectionId, color, updates) => {
    set(state => ({
      collections: state.collections.map(col => {
        if (col.id !== collectionId) return col
        const nextColors = (col.availableColors || []).map(entry => {
          if (entry.value !== color) return entry
          const nextValue =
            typeof updates.value === 'string' && updates.value.trim().length > 0
              ? updates.value.trim()
              : entry.value
          const nextName = updates.name !== undefined ? updates.name : entry.name
          return createCollectionColor(nextValue, nextName)
        })
        return { ...col, availableColors: normalizeCollectionColors(nextColors, col.color) }
      }),
    }))
    get().saveToServer()
  },

  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    set((state) => ({ products: [...state.products, newProduct] }))
    get().saveToServer()
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((prod) =>
        prod.id === id ? { ...prod, ...updates } : prod
      ),
    }))
    get().saveToServer()
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((prod) => prod.id !== id),
      sales: state.sales.map((sale) =>
        sale.productId === id ? { ...sale, productId: undefined } : sale
      ),
    }))
    get().saveToServer()
  },

  getProductsByCollection: (collectionId) => {
    return get().products.filter((prod) => prod.collectionId === collectionId)
  },

  addChannel: (channel) => {
    const newChannel: SaleChannel = {
      ...channel,
      id: `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    set((state) => ({ channels: [...state.channels, newChannel] }))
    get().saveToServer({ immediate: true })
  },

  updateChannel: (id, updates) => {
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === id ? { ...channel, ...updates } : channel
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  deleteChannel: (id) => {
    set((state) => ({
      channels: state.channels.filter((channel) => channel.id !== id),
      sales: state.sales.map((sale) =>
        sale.channelId === id ? { ...sale, channelId: undefined } : sale
      ),
    }))
    get().saveToServer({ immediate: true })
  },

  addSubtask: (saleId, text) => {
    const newSubtask: SaleSubtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
    }
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? { ...sale, subtasks: [...(sale.subtasks || []), newSubtask], updatedAt: new Date() }
          : sale
      ),
    }))
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
    get().saveToServer()
  },

  deleteSubtask: (saleId, subtaskId) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId
          ? { ...sale, subtasks: sale.subtasks?.filter((st) => st.id !== subtaskId), updatedAt: new Date() }
          : sale
      ),
    }))
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
    get().saveToServer()
  },

  updateNotes: (saleId, notes) => {
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId ? { ...sale, notes, updatedAt: new Date() } : sale
      ),
    }))
    get().saveToServer()
  },
}))

export default useSalesStore
