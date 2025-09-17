import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Configure Neon for optimal Vercel serverless performance
// This enables fetch-based queries which are faster in serverless environments
neonConfig.poolQueryViaFetch = true

// CRITICAL: Set connection limits to prevent exhaustion
neonConfig.fetchConnectionCache = true

// Get the database URL from environment variable
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Log warning but don't throw error - allow fallback to JSON
  console.warn('DATABASE_URL not found. Database features will be disabled.')
  return ''
}

// Safely get the database URL without throwing
let databaseUrl = ''
try {
  databaseUrl = getDatabaseUrl()
} catch (error) {
  console.error('Error getting database URL:', error)
  databaseUrl = ''
}

// SINGLETON PATTERN: Reuse the same connection across all requests
// This prevents creating multiple connections per request
let cachedSql: ReturnType<typeof neon> | null = null
let cachedDb: ReturnType<typeof drizzle> | null = null

// Get or create the SQL connection (singleton)
function getSql() {
  if (!databaseUrl) return null
  if (!cachedSql) {
    cachedSql = neon(databaseUrl, {
      // Use fetch mode for better serverless performance
      fetchOptions: {
        // Reduce connection timeout to fail faster
        timeout: 10000,
      },
    })
  }
  return cachedSql
}

// Get or create the Drizzle instance (singleton)
function getDb() {
  if (!databaseUrl) return null
  if (!cachedDb) {
    const sql = getSql()
    if (!sql) return null
    cachedDb = drizzle(sql, { schema })
  }
  return cachedDb
}

// Export singleton instances
export const sql = getSql()
export const db = getDb()

// DEPRECATED: Do not use pooled connections in serverless
// The neon HTTP driver handles connection management automatically
// Using pools in serverless can lead to connection exhaustion
export const getPooledDb = () => {
  console.warn('getPooledDb() is deprecated. Use the singleton db export instead.')
  return db
}

// Export a function to check if database is configured
export const isDatabaseConfigured = () => {
  return !!databaseUrl && !!sql && !!db
}