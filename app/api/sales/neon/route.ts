import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { sales, saleSubtasks, collections, products, saleChannels } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import type { Sale as StoreSale, SaleSubtask as StoreSaleSubtask, Collection as StoreCollection, Product as StoreProduct, SaleChannel as StoreSaleChannel } from '@/lib/salesTypes'

// Fallback to JSON file if database is not configured
async function fallbackToJsonFile() {
  const fs = await import('fs/promises')
  const path = await import('path')
  const DATA_FILE = path.join(process.cwd(), 'data', 'sales.json')
  
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {
      sales: [],
      collections: [],
      products: [],
      channels: [],
    }
  }
}

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
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Log environment info for debugging
    console.log('GET /api/sales/neon - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      IS_VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, falling back to JSON file')
      const data = await fallbackToJsonFile()
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

    console.log('Database is configured, fetching sales data...')
    
    // Fetch all data from database
    const [dbSales, dbSaleSubtasks, dbCollections, dbProducts, dbChannels] = await Promise.all([
      db.select().from(sales).orderBy(desc(sales.createdAt)),
      db.select().from(saleSubtasks),
      db.select().from(collections).orderBy(collections.name),
      db.select().from(products).orderBy(products.name),
      db.select().from(saleChannels).orderBy(saleChannels.name)
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
    
    console.log('Sales data fetched successfully:', {
      sales: transformedSales.length,
      collections: transformedCollections.length,
      products: transformedProducts.length,
      channels: transformedChannels.length,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching sales data from database:', error)
    // Fallback to JSON file on error
    const data = await fallbackToJsonFile()
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
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Log incoming data for debugging
    console.log('POST /api/sales/neon - Received data:', {
      salesCount: data.sales?.length || 0,
      collectionsCount: data.collections?.length || 0,
      productsCount: data.products?.length || 0,
      channelsCount: data.channels?.length || 0,
      hasCollections: !!data.collections,
      hasProducts: !!data.products,
      hasChannels: !!data.channels,
    })
    
    // CRITICAL VALIDATION: Never accept empty state that would delete all data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format received')
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Check if this would result in deleting all data
    const hasAnyData = (data.sales && data.sales.length > 0) || 
                       (data.collections && data.collections.length > 0) || 
                       (data.products && data.products.length > 0) ||
                       (data.channels && data.channels.length > 0)
    
    if (!hasAnyData) {
      // Fetch current data to check if database has existing data
      if (isDatabaseConfigured() && db) {
        const [existingSales, existingCollections, existingProducts] = await Promise.all([
          db.select().from(sales).limit(1),
          db.select().from(collections).limit(1),
          db.select().from(products).limit(1)
        ])
        
        if (existingSales.length > 0 || existingCollections.length > 0 || existingProducts.length > 0) {
          console.error('BLOCKED: Attempted to delete all sales data with empty state')
          return NextResponse.json({ 
            error: 'Cannot save empty state when database contains data', 
            blocked: true 
          }, { status: 400 })
        }
      }
    }
    
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, falling back to JSON file')
      // Fall back to file system
      const fs = await import('fs/promises')
      const path = await import('path')
      const DATA_FILE = path.join(process.cwd(), 'data', 'sales.json')
      
      // Ensure directory exists
      const dir = path.dirname(DATA_FILE)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
      return NextResponse.json({ success: true })
    }

    // Use UPSERT pattern instead of DELETE-then-INSERT
    // This is much safer and prevents accidental data loss
    
    // Step 1: Get all existing IDs
    const [existingSales, existingSaleSubtasks, existingCollections, existingProducts, existingChannels] = await Promise.all([
      db.select({ id: sales.id }).from(sales),
      db.select({ id: saleSubtasks.id }).from(saleSubtasks),
      db.select({ id: collections.id }).from(collections),
      db.select({ id: products.id }).from(products),
      db.select({ id: saleChannels.id }).from(saleChannels)
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
    if (saleSubtaskIdsToDelete.length > 0) {
      await db.delete(saleSubtasks).where(
        drizzleSql`${saleSubtasks.id} IN (${drizzleSql.join(saleSubtaskIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (saleIdsToDelete.length > 0) {
      await db.delete(sales).where(
        drizzleSql`${sales.id} IN (${drizzleSql.join(saleIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (productIdsToDelete.length > 0) {
      await db.delete(products).where(
        drizzleSql`${products.id} IN (${drizzleSql.join(productIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (collectionIdsToDelete.length > 0) {
      await db.delete(collections).where(
        drizzleSql`${collections.id} IN (${drizzleSql.join(collectionIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (channelIdsToDelete.length > 0) {
      await db.delete(saleChannels).where(
        drizzleSql`${saleChannels.id} IN (${drizzleSql.join(channelIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }

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
          ? db.update(sales)
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
          : db.insert(sales).values(saleValues)
        
        salePromises.push(salePromise)
        
        // Handle subtasks for this sale
        if (saleSubtaskList && saleSubtaskList.length > 0) {
          // First get existing subtasks (this needs to be sequential)
          const existingSaleSubtasksList = await db.select({ id: saleSubtasks.id })
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
            db.update(collections)
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
            db.insert(collections).values(collectionValues)
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
            db.update(products)
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
            db.insert(products).values(productValues)
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
