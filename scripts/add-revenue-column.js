require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')

async function addRevenueColumn() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment')
      process.exit(1)
    }

    console.log('Connecting to database...')
    const sql = neon(DATABASE_URL)
    const db = drizzle(sql)

    console.log('Adding revenue column to sales table...')
    try {
      await db.execute(`
        ALTER TABLE sales 
        ADD COLUMN IF NOT EXISTS revenue INTEGER
      `)
      console.log('Revenue column added successfully')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Revenue column already exists')
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

addRevenueColumn()