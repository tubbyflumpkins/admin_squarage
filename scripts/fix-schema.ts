import { config } from 'dotenv'
// Load environment variables FIRST
config({ path: '.env.local' })

import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function updateSchema() {
  try {
    // Check if database is configured
    if (!db) {
      console.error('Database not configured')
      process.exit(1)
    }

    console.log('Updating database schema...')
    
    // Check if 'order' column exists
    try {
      await db.execute(sql`SELECT "order" FROM sales LIMIT 1`)
      console.log('Renaming order column to name...')
      await db.execute(sql`ALTER TABLE sales RENAME COLUMN "order" TO name`)
      console.log('Column renamed successfully')
    } catch (e: any) {
      if (e.cause?.code === '42703') {
        console.log('Column already renamed or does not exist')
      } else {
        throw e
      }
    }
    
    console.log('Creating collections table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('Collections table created')
    
    console.log('Creating products table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        revenue INTEGER NOT NULL,
        collection_id VARCHAR(255) NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('Products table created')
    
    console.log('Adding product_id column to sales...')
    await db.execute(sql`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL
    `)
    console.log('Product_id column added')
    
    console.log('✅ Schema updated successfully!')
    
  } catch (e: any) {
    console.error('Error:', e.message)
    if (e.cause) console.error('Cause:', e.cause.message)
    process.exit(1)
  }
}

updateSchema()