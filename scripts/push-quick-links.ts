import { config } from 'dotenv'
import path from 'path'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables first
config({ path: path.resolve(process.cwd(), '.env.local') })

async function pushQuickLinksTable() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables')
    }
    
    console.log('Connecting to database...')
    const client = neon(DATABASE_URL)
    const db = drizzle(client)
    
    console.log('Creating quick_links table...')
    
    // Create the quick_links table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quick_links (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        favicon_url TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)
    
    console.log('✅ Quick links table created successfully!')
    
    // Exit the process
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating quick_links table:', error)
    process.exit(1)
  }
}

pushQuickLinksTable()