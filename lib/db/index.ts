import { neon, neonConfig, Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

// Configure Neon for optimal Vercel serverless performance
// This enables fetch-based queries which are faster in serverless environments
neonConfig.poolQueryViaFetch = true

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

// For Vercel serverless, we use the neon function for queries
// This automatically manages connections efficiently in serverless environments
export const sql = databaseUrl ? neon(databaseUrl) : null

// Create drizzle instance with the optimized neon connection
export const db = sql ? drizzle(sql, { schema }) : null

// Create a function to get a pooled connection for complex operations
// This should be called inside request handlers, not globally
export const getPooledDb = () => {
  if (!databaseUrl) return null
  
  // Create a new pool instance for this request
  // In serverless, this will be efficiently managed
  const pool = new Pool({ connectionString: databaseUrl })
  return drizzlePool(pool, { schema })
}

// Export a function to check if database is configured
export const isDatabaseConfigured = () => {
  return !!databaseUrl && !!sql && !!db
}