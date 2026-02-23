import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sales, saleSubtasks, collections, products, saleChannels } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Sale as StoreSale, SaleSubtask as StoreSaleSubtask, Collection as StoreCollection, Product as StoreProduct, SaleChannel as StoreSaleChannel } from '@/lib/salesTypes'
import {
  requireAuth,
  getDb,
  deleteByIds,
  readJsonFallback,
  writeJsonFallback,
  guardEmptyState,
} from '@/lib/api/helpers'

const EMPTY_SALES_STATE = { sales: [], collections: [], products: [], channels: [] }

const formatColorLabel = (value: string, providedName?: string) => {
  if (providedName && providedName.trim().length > 0) {
    return providedName.trim()
  }
  if (typeof value !== 'string') return 'Unknown'
  const trimmed = value.trim()
  if (trimmed.length === 0) return 'Unknown'
  return trimmed.startsWith('#') ? trimmed.toUpperCase() : trimmed
}

const normalizeAvailableColors = (
  raw: unknown,
  fallbackColor: string
): NonNullable<StoreCollection['availableColors']> => {
  const normalized: NonNullable<StoreCollection['availableColors']> = []
  const seen = new Set<string>()

  if (Array.isArray(raw)) {
    raw.forEach(entry => {
      if (typeof entry === 'string') {
        const value = entry.trim()
        if (!value || seen.has(value)) return
        normalized.push({ value, name: formatColorLabel(value) })
        seen.add(value)
      } else if (entry && typeof entry === 'object') {
        const value = typeof (entry as any).value === 'string' ? (entry as any).value.trim() : ''
        if (!value || seen.has(value)) return
        const name =
          typeof (entry as any).name === 'string' ? (entry as any).name : undefined
        normalized.push({ value, name: formatColorLabel(value, name) })
        seen.add(value)
      }
    })
  }

  const fallback = typeof fallbackColor === 'string' ? fallbackColor.trim() : ''
  if (fallback && !seen.has(fallback)) {
    normalized.unshift({ value: fallback, name: formatColorLabel(fallback) })
  }

  return normalized
}

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    if (!getDb()) {
      const data = await readJsonFallback('sales.json', EMPTY_SALES_STATE)
      const normalized = {
        ...data,
        collections: Array.isArray(data.collections)
          ? data.collections.map((col: any) => ({
              ...col,
              availableColors: normalizeAvailableColors(col.availableColors, col.color),
            }))
          : [],
      }
      return NextResponse.json(normalized)
    }
    
    // Fetch all data from database
    const [dbSales, dbSaleSubtasks, dbCollections, dbProducts, dbChannels] = await Promise.all([
      db!.select().from(sales).orderBy(desc(sales.createdAt)),
      db!.select().from(saleSubtasks),
      db!.select().from(collections).orderBy(collections.name),
      db!.select().from(products).orderBy(products.name),
      db!.select().from(saleChannels).orderBy(saleChannels.name)
    ])

    // Group subtasks by sale ID
    const subtasksBySaleId = dbSaleSubtasks.reduce((acc, subtask) => {
      if (!acc[subtask.saleId]) {
        acc[subtask.saleId] = []
      }
      acc[subtask.saleId].push({
        id: subtask.id,
        text: subtask.text,
        completed: subtask.completed
      })
      return acc
    }, {} as Record<string, StoreSaleSubtask[]>)

    // Transform sales to include subtasks
    const transformedSales: StoreSale[] = dbSales.map(sale => ({
      id: sale.id,
      name: sale.name,
      productId: sale.productId || undefined,
      revenue: sale.revenue || undefined,
      selectedColor: sale.selectedColor || undefined,
      placementDate: sale.placementDate!,
      deliveryMethod: sale.deliveryMethod as 'shipping' | 'local',
      channelId: sale.channelId || undefined,
      status: sale.status as StoreSale['status'],
      notes: sale.notes || undefined,
      subtasks: subtasksBySaleId[sale.id] || undefined,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt
    }))
    
    // Transform collections
    const transformedCollections: StoreCollection[] = dbCollections.map(col => ({
      id: col.id,
      name: col.name,
      color: col.color,
      availableColors: normalizeAvailableColors(col.availableColors, col.color)
    }))
    
    // Transform products
    const transformedProducts: StoreProduct[] = dbProducts.map(prod => ({
      id: prod.id,
      name: prod.name,
      revenue: prod.revenue,
      collectionId: prod.collectionId
    }))

    const transformedChannels: StoreSaleChannel[] = dbChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      createdAt: channel.createdAt,
    }))

    const response = {
      sales: transformedSales || [],
      collections: transformedCollections || [],
      products: transformedProducts || [],
      channels: transformedChannels || [],
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching sales data from database:', error)
    const data = await readJsonFallback('sales.json', EMPTY_SALES_STATE)
    const normalized = {
      ...data,
      collections: Array.isArray(data.collections)
        ? data.collections.map((col: any) => ({
            ...col,
            availableColors: normalizeAvailableColors(col.availableColors, col.color),
          }))
        : [],
    }
    return NextResponse.json(normalized)
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const hasAnyData = (data.sales?.length > 0) ||
                       (data.collections?.length > 0) ||
                       (data.products?.length > 0) ||
                       (data.channels?.length > 0)

    const blocked = await guardEmptyState(hasAnyData, async () => {
      const [existingSales, existingCollections, existingProducts] = await Promise.all([
        db!.select().from(sales).limit(1),
        db!.select().from(collections).limit(1),
        db!.select().from(products).limit(1)
      ])
      return existingSales.length > 0 || existingCollections.length > 0 || existingProducts.length > 0
    })
    if (blocked) return blocked

    if (!getDb()) {
      await writeJsonFallback('sales.json', data)
      return NextResponse.json({ success: true })
    }

    // Use UPSERT pattern instead of DELETE-then-INSERT
    // This is much safer and prevents accidental data loss
    
    // Step 1: Get all existing IDs
    const [existingSales, existingSaleSubtasks, existingCollections, existingProducts, existingChannels] = await Promise.all([
      db!.select({ id: sales.id }).from(sales),
      db!.select({ id: saleSubtasks.id }).from(saleSubtasks),
      db!.select({ id: collections.id }).from(collections),
      db!.select({ id: products.id }).from(products),
      db!.select({ id: saleChannels.id }).from(saleChannels)
    ])

    const existingSaleIds = new Set(existingSales.map(s => s.id))
    const existingSaleSubtaskIds = new Set(existingSaleSubtasks.map(s => s.id))
    const existingCollectionIds = new Set(existingCollections.map(c => c.id))
    const existingProductIds = new Set(existingProducts.map(p => p.id))
    const existingChannelIds = new Set(existingChannels.map(a => a.id))
    
    // Step 2: Prepare incoming data IDs
    const incomingSaleIds = new Set(data.sales?.map((s: any) => s.id) || [])
    const incomingSaleSubtaskIds = new Set<string>()
    const incomingCollectionIds = new Set(data.collections?.map((c: any) => c.id) || [])
    const incomingProductIds = new Set(data.products?.map((p: any) => p.id) || [])
    const incomingChannelIds = new Set(data.channels?.map((c: any) => c.id) || [])
    
    // Collect all subtask IDs
    if (data.sales) {
      for (const sale of data.sales) {
        if (sale.subtasks) {
          for (const subtask of sale.subtasks) {
            incomingSaleSubtaskIds.add(subtask.id)
          }
        }
      }
    }
    
    // Step 3: Delete items that are no longer in the incoming data
    // This is safer because we only delete specific items, not everything
    const saleIdsToDelete = Array.from(existingSaleIds).filter(id => !incomingSaleIds.has(id))
    const saleSubtaskIdsToDelete = Array.from(existingSaleSubtaskIds).filter(id => !incomingSaleSubtaskIds.has(id))
    const collectionIdsToDelete = Array.from(existingCollectionIds).filter(id => !incomingCollectionIds.has(id))
    const productIdsToDelete = Array.from(existingProductIds).filter(id => !incomingProductIds.has(id))
    const channelIdsToDelete = data.channels
      ? Array.from(existingChannelIds).filter(id => !incomingChannelIds.has(id))
      : []
    
    // SAFETY CHECK: Don't delete everything if incoming data seems incomplete
    const totalExisting = existingSaleIds.size + existingCollectionIds.size + existingProductIds.size + existingChannelIds.size
    const totalToDelete = saleIdsToDelete.length + collectionIdsToDelete.length + productIdsToDelete.length + channelIdsToDelete.length
    
    if (totalExisting > 0 && totalToDelete === totalExisting) {
      console.error('SAFETY BLOCK: Refusing to delete all existing data')
      return NextResponse.json({ 
        error: 'Safety check failed: Cannot delete all existing data', 
        blocked: true 
      }, { status: 400 })
    }
    
    // Delete removed items
    await deleteByIds(saleSubtasks, saleSubtasks.id, saleSubtaskIdsToDelete)
    await deleteByIds(sales, sales.id, saleIdsToDelete)
    await deleteByIds(products, products.id, productIdsToDelete)
    await deleteByIds(collections, collections.id, collectionIdsToDelete)
    await deleteByIds(saleChannels, saleChannels.id, channelIdsToDelete)

    // Step 4: UPSERT channels first so sales references are valid
    if (data.channels && data.channels.length > 0) {
      const channelPromises = data.channels.map((channel: any) => {
        const channelValues = {
          id: channel.id,
          name: channel.name,
          createdAt: channel.createdAt ? new Date(channel.createdAt) : new Date(),
        }

        if (existingChannelIds.has(channel.id)) {
          return db!.update(saleChannels)
            .set({
              name: channelValues.name,
            })
            .where(eq(saleChannels.id, channel.id))
        }

        return db!.insert(saleChannels).values(channelValues)
      })

      await Promise.all(channelPromises)
    }

    // Step 5: UPSERT sales and subtasks - process in batches for better performance
    if (data.sales && data.sales.length > 0) {
      // Process sales in smaller batches to avoid too many concurrent queries
      const BATCH_SIZE = 5
      for (let i = 0; i < data.sales.length; i += BATCH_SIZE) {
        const saleBatch = data.sales.slice(i, i + BATCH_SIZE)
        const salePromises = []
        
        for (const sale of saleBatch) {
        const { subtasks: saleSubtaskList, ...saleData } = sale
        
        const saleValues = {
          id: saleData.id,
          name: saleData.name,
          productId: saleData.productId || null,
          revenue: saleData.revenue || null,
          selectedColor: saleData.selectedColor || null,
          placementDate: new Date(saleData.placementDate),
          deliveryMethod: saleData.deliveryMethod,
          channelId: saleData.channelId || null,
          status: saleData.status,
          notes: saleData.notes || null,
          createdAt: new Date(saleData.createdAt),
          updatedAt: new Date(saleData.updatedAt)
        }
        
        // Create promise for sale upsert
        const salePromise = existingSaleIds.has(sale.id)
          ? db!.update(sales)
              .set({
                name: saleValues.name,
                productId: saleValues.productId,
                revenue: saleValues.revenue,
                selectedColor: saleValues.selectedColor,
                placementDate: saleValues.placementDate,
                deliveryMethod: saleValues.deliveryMethod,
                channelId: saleValues.channelId,
                status: saleValues.status,
                notes: saleValues.notes,
                updatedAt: saleValues.updatedAt
              })
              .where(eq(sales.id, sale.id))
          : db!.insert(sales).values(saleValues)
        
        salePromises.push(salePromise)
        
        // Handle subtasks for this sale
        if (saleSubtaskList && saleSubtaskList.length > 0) {
          // First get existing subtasks (this needs to be sequential)
          const existingSaleSubtasksList = await db!.select({ id: saleSubtasks.id })
            .from(saleSubtasks)
            .where(eq(saleSubtasks.saleId, sale.id))
          const existingSaleSubtaskIdsSet = new Set(existingSaleSubtasksList.map(s => s.id))
          
          // Then create promises for all subtask operations
          const subtaskPromises = saleSubtaskList.map((subtask: any) => {
            const subtaskValues = {
              id: subtask.id,
              saleId: sale.id,
              text: subtask.text,
              completed: subtask.completed
            }
            
            if (existingSaleSubtaskIdsSet.has(subtask.id)) {
              // Update existing subtask
              return db!.update(saleSubtasks)
                .set({
                  text: subtaskValues.text,
                  completed: subtaskValues.completed
                })
                .where(eq(saleSubtasks.id, subtask.id))
            } else {
              // Insert new subtask
              return db!.insert(saleSubtasks).values(subtaskValues)
            }
          })
          
          salePromises.push(...subtaskPromises)
        }
      }
      
      // Execute all operations for this batch in parallel
      await Promise.all(salePromises)
      }
    }
    
    // Step 6: UPSERT collections in parallel
    if (data.collections && data.collections.length > 0) {
      const collectionPromises = []
      
      for (const collection of data.collections) {
        const collectionValues = {
          id: collection.id,
          name: collection.name,
          color: collection.color,
          availableColors: normalizeAvailableColors(collection.availableColors, collection.color),
          createdAt: new Date()
        }
        
        if (existingCollectionIds.has(collection.id)) {
          // Update existing collection
          collectionPromises.push(
            db!.update(collections)
              .set({
                name: collectionValues.name,
                color: collectionValues.color,
                availableColors: collectionValues.availableColors
              })
              .where(eq(collections.id, collection.id))
          )
        } else {
          // Insert new collection
          collectionPromises.push(
            db!.insert(collections).values(collectionValues)
          )
        }
      }
      
      await Promise.all(collectionPromises)
    }
    
    // Step 7: UPSERT products in parallel
    if (data.products && data.products.length > 0) {
      const productPromises = []
      
      for (const product of data.products) {
        const productValues = {
          id: product.id,
          name: product.name,
          revenue: product.revenue,
          collectionId: product.collectionId,
          createdAt: new Date()
        }
        
        if (existingProductIds.has(product.id)) {
          // Update existing product
          productPromises.push(
            db!.update(products)
              .set({
                name: productValues.name,
                revenue: productValues.revenue,
                collectionId: productValues.collectionId
              })
              .where(eq(products.id, product.id))
          )
        } else {
          // Insert new product
          productPromises.push(
            db!.insert(products).values(productValues)
          )
        }
      }
      
      await Promise.all(productPromises)
    }
    
    return NextResponse.json({ success: true, method: 'upsert' })
  } catch (error) {
    console.error('Error saving sales data to database:', error)
    return NextResponse.json({ error: 'Failed to save data', details: error }, { status: 500 })
  }
}
