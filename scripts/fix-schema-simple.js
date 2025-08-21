require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')

async function updateSchema() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment')
      process.exit(1)
    }

    console.log('Connecting to database...')
    const sql = neon(DATABASE_URL)
    const db = drizzle(sql)

    console.log('Updating database schema...')
    
    // Check if 'order' column exists and rename it
    try {
      await db.execute(`SELECT "order" FROM sales LIMIT 1`)
      console.log('Renaming order column to name...')
      await db.execute(`ALTER TABLE sales RENAME COLUMN "order" TO name`)
      console.log('Column renamed successfully')
    } catch (e) {
      if (e.code === '42703') {
        console.log('Column already renamed or does not exist')
      } else if (e.message.includes('does not exist')) {
        console.log('Sales table or order column does not exist')
      }
    }
    
    console.log('Creating collections table...')
    await db.execute(`
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('Collections table created')
    
    console.log('Creating products table...')
    await db.execute(`
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
    try {
      await db.execute(`
        ALTER TABLE sales 
        ADD COLUMN product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL
      `)
      console.log('Product_id column added')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Product_id column already exists')
      } else {
        throw e
      }
    }
    
    console.log('✅ Schema updated successfully!')
    process.exit(0)
    
  } catch (e) {
    console.error('Error:', e.message)
    if (e.cause) console.error('Cause:', e.cause.message)
    process.exit(1)
  }
}

updateSchema()