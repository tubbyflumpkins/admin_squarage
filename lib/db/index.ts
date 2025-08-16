import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

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

// Create the connection only if we have a valid URL
export const sql = databaseUrl ? neon(databaseUrl) : null

// Create drizzle instance
export const db = sql ? drizzle(sql, { schema }) : null

// Export a function to check if database is configured
export const isDatabaseConfigured = () => {
  return !!databaseUrl && !!sql && !!db
}