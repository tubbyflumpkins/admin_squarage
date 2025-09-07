import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { quickLinks } from '@/lib/db/schema'
import { eq, sql as drizzleSql } from 'drizzle-orm'
import type { QuickLink as StoreQuickLink } from '@/lib/quickLinksTypes'

// Helper function to get favicon URL
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Use Google's favicon service as a reliable fallback
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return ''
  }
}

export async function GET() {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured for quick links')
      return NextResponse.json({ quickLinks: [] })
    }

    console.log('Fetching quick links from database...')
    
    // Fetch all quick links ordered by orderIndex
    const dbQuickLinks = await db
      .select()
      .from(quickLinks)
      .orderBy(quickLinks.orderIndex)

    // Convert database records to store format
    const storeQuickLinks: StoreQuickLink[] = dbQuickLinks.map(link => ({
      id: link.id,
      name: link.name,
      url: link.url,
      faviconUrl: link.faviconUrl,
      orderIndex: link.orderIndex,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }))

    console.log(`Fetched ${storeQuickLinks.length} quick links`)
    return NextResponse.json({ quickLinks: storeQuickLinks })
  } catch (error) {
    console.error('Failed to fetch quick links:', error)
    return NextResponse.json({ error: 'Failed to fetch quick links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { quickLinks: storeQuickLinks } = body as { quickLinks: StoreQuickLink[] }

    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, cannot save quick links')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Safety check: don't delete all data
    if (!storeQuickLinks || storeQuickLinks.length === 0) {
      const existingCount = await db
        .select({ count: drizzleSql<number>`count(*)::int` })
        .from(quickLinks)
      
      if (existingCount[0]?.count > 0) {
        console.error('Attempted to delete all quick links - blocking operation')
        return NextResponse.json({ error: 'Cannot delete all quick links' }, { status: 400 })
      }
    }

    console.log(`Saving ${storeQuickLinks?.length || 0} quick links to database...`)

    // Use UPSERT pattern for each quick link
    for (const link of storeQuickLinks || []) {
      // Auto-generate favicon URL if not present
      const faviconUrl = link.faviconUrl || getFaviconUrl(link.url)
      
      // Ensure dates are Date objects
      const createdAt = link.createdAt ? new Date(link.createdAt) : new Date()
      const updatedAt = link.updatedAt ? new Date(link.updatedAt) : new Date()
      
      await db
        .insert(quickLinks)
        .values({
          id: link.id,
          name: link.name,
          url: link.url,
          faviconUrl: faviconUrl,
          orderIndex: link.orderIndex,
          createdAt: createdAt,
          updatedAt: updatedAt,
        })
        .onConflictDoUpdate({
          target: quickLinks.id,
          set: {
            name: link.name,
            url: link.url,
            faviconUrl: faviconUrl,
            orderIndex: link.orderIndex,
            updatedAt: new Date(),
          },
        })
    }

    // Delete any quick links that are no longer in the store
    if (storeQuickLinks && storeQuickLinks.length > 0) {
      const storeIds = storeQuickLinks.map(l => l.id)
      await db
        .delete(quickLinks)
        .where(drizzleSql`${quickLinks.id} NOT IN ${storeIds}`)
    }

    console.log('Quick links saved successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save quick links:', error)
    return NextResponse.json({ error: 'Failed to save quick links' }, { status: 500 })
  }
}