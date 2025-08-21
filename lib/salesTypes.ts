export type SaleStatus = 'not_started' | 'in_progress' | 'fulfilled' | 'dead'
export type DeliveryMethod = 'shipping' | 'local'

export interface SaleSubtask {
  id: string
  text: string
  completed: boolean
}

export interface Product {
  id: string
  name: string
  revenue: number
  collectionId: string
}

export interface Collection {
  id: string
  name: string
  color: string
}

export interface Sale {
  id: string
  name: string // Customer/order name (renamed from 'order')
  productId?: string // Reference to product
  revenue?: number // Custom revenue for this sale (overrides product default)
  placementDate: Date
  deliveryMethod: DeliveryMethod
  status: SaleStatus
  subtasks?: SaleSubtask[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type SortBy = 'placementDate' | 'status' | 'deliveryMethod' | 'createdAt'
export type FilterBy = 'all' | 'fulfilled' | 'pending'

export interface SalesFilters {
  deliveryMethod?: DeliveryMethod
  status: FilterBy
  sortBy: SortBy
}