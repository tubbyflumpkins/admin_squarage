import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quickLinks } from '@/lib/db/schema'
import { sql as drizzleSql } from 'drizzle-orm'
import type { QuickLink as StoreQuickLink } from '@/lib/quickLinksTypes'
import { requireAuth, getDb, guardEmptyState } from '@/lib/api/helpers'

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
  } catch {
    return ''
  }
}

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    if (!getDb()) {
      return NextResponse.json({ quickLinks: [] })
    }

    const dbQuickLinks = await db!
      .select()
      .from(quickLinks)
      .orderBy(quickLinks.orderIndex)

    const storeQuickLinks: StoreQuickLink[] = dbQuickLinks.map(link => ({
      id: link.id,
      name: link.name,
      url: link.url,
      faviconUrl: link.faviconUrl,
      orderIndex: link.orderIndex,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    }))

    return NextResponse.json({ quickLinks: storeQuickLinks })
  } catch (error) {
    console.error('Failed to fetch quick links:', error)
    return NextResponse.json({ error: 'Failed to fetch quick links' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { quickLinks: storeQuickLinks } = body as { quickLinks: StoreQuickLink[] }

    if (!getDb()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const blocked = await guardEmptyState(
      storeQuickLinks?.length > 0,
      async () => {
        const rows = await db!.select({ count: drizzleSql<number>`count(*)::int` }).from(quickLinks)
        return (rows[0]?.count ?? 0) > 0
      }
    )
    if (blocked) return blocked

    // UPSERT each quick link
    for (const link of storeQuickLinks || []) {
      const faviconUrl = link.faviconUrl || getFaviconUrl(link.url)
      const createdAt = link.createdAt ? new Date(link.createdAt) : new Date()
      const updatedAt = link.updatedAt ? new Date(link.updatedAt) : new Date()

      await db!
        .insert(quickLinks)
        .values({
          id: link.id,
          name: link.name,
          url: link.url,
          faviconUrl,
          orderIndex: link.orderIndex,
          createdAt,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: quickLinks.id,
          set: {
            name: link.name,
            url: link.url,
            faviconUrl,
            orderIndex: link.orderIndex,
            updatedAt: new Date(),
          },
        })
    }

    // Delete links no longer in the store
    if (storeQuickLinks && storeQuickLinks.length > 0) {
      const storeIds = storeQuickLinks.map(l => l.id)
      await db!
        .delete(quickLinks)
        .where(drizzleSql`${quickLinks.id} NOT IN ${storeIds}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save quick links:', error)
    return NextResponse.json({ error: 'Failed to save quick links' }, { status: 500 })
  }
}
