export interface QuickLink {
  id: string
  name: string
  url: string
  faviconUrl?: string | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export interface QuickLinksFilters {
  searchTerm?: string
  sortBy: 'name' | 'date' | 'manual'
}