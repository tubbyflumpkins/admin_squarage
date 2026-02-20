import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { sql as drizzleSql } from 'drizzle-orm'
import type { AnyColumn } from 'drizzle-orm'

type AuthSession = { user: { id: string; name: string; email: string; role?: string } }

/**
 * Returns the authenticated session or a 401 NextResponse.
 */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session as unknown as AuthSession
}

/**
 * Returns the database instance if configured, or null.
 */
export function getDb() {
  if (!isDatabaseConfigured() || !db) return null
  return db
}

/**
 * Deletes rows from a table where the id column matches any of the given IDs.
 * No-op if ids array is empty.
 */
export async function deleteByIds(
  table: Parameters<NonNullable<typeof db>['delete']>[0],
  idColumn: AnyColumn,
  ids: string[]
) {
  if (ids.length === 0 || !db) return
  await db.delete(table).where(
    drizzleSql`${idColumn} IN (${drizzleSql.join(ids.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
  )
}

/**
 * Reads a JSON fallback file from the data/ directory.
 */
export async function readJsonFallback<T extends Record<string, unknown>>(
  filename: string,
  emptyState: T
): Promise<T> {
  const fs = await import('fs/promises')
  const path = await import('path')
  const filePath = path.join(process.cwd(), 'data', filename)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return emptyState
  }
}

/**
 * Writes data to a JSON fallback file in the data/ directory.
 */
export async function writeJsonFallback(filename: string, data: unknown) {
  const fs = await import('fs/promises')
  const path = await import('path')
  const filePath = path.join(process.cwd(), 'data', filename)
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

/**
 * Guards against saving empty state that would wipe existing data.
 * Returns a blocked response, or null if the save should proceed.
 */
export async function guardEmptyState(
  hasAnyIncomingData: boolean,
  checkExistingData: () => Promise<boolean>
): Promise<NextResponse | null> {
  if (hasAnyIncomingData) return null
  if (!getDb()) return null

  const hasExisting = await checkExistingData()
  if (hasExisting) {
    return NextResponse.json(
      { error: 'Cannot save empty state when database contains data', blocked: true },
      { status: 400 }
    )
  }
  return null
}
