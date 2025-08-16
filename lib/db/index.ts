import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Get the database URL from environment variable
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // In development, try to load from .env.local
  if (process.env.NODE_ENV === 'development') {
    console.warn('DATABASE_URL not found. Please set it in .env.local')
    // Return a placeholder to prevent immediate crashes during development
    return ''
  }
  
  throw new Error('DATABASE_URL environment variable is not set')
}

const databaseUrl = getDatabaseUrl()

// Create the connection only if we have a valid URL
export const sql = databaseUrl ? neon(databaseUrl) : null

// Create drizzle instance
export const db = sql ? drizzle(sql, { schema }) : null

// Export a function to check if database is configured
export const isDatabaseConfigured = () => {
  return !!databaseUrl && !!sql && !!db
}