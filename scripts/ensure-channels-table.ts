// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Now import after env is loaded
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql as drizzleSql } from 'drizzle-orm'
import * as schema from '../lib/db/schema'

async function ensureChannelsTable() {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in environment')
      console.log('Make sure .env.local exists and contains DATABASE_URL')
      process.exit(1)
    }

    console.log('✓ DATABASE_URL found')
    console.log('Connecting to database...')

    // Create connection
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql, { schema })

    console.log('✓ Connected to database')
    console.log('Checking if sale_channels table exists...')

    // Try to query the table - if it doesn't exist, this will error
    try {
      const result = await db.select().from(schema.saleChannels).limit(1)
      console.log('✓ sale_channels table already exists!')
      console.log(`  Found ${result.length} existing channels`)

      // Also check if the column exists in sales table
      const salesCheck = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='sales' AND column_name='channel_id'
      `

      if (salesCheck.length > 0) {
        console.log('✓ channel_id column exists in sales table')
      } else {
        console.log('Adding channel_id column to sales table...')
        await sql`ALTER TABLE "sales" ADD COLUMN "channel_id" varchar(255)`
        console.log('✓ Added channel_id column')
      }

      console.log('\n✅ Channel table setup is complete!')
      return
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('sale_channels table does not exist, creating it...')

        // Create the table
        await sql`
          CREATE TABLE "sale_channels" (
            "id" varchar(255) PRIMARY KEY NOT NULL,
            "name" varchar(255) NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          )
        `

        console.log('✓ Created sale_channels table')

        // Add the column to sales table
        console.log('Adding channel_id column to sales table...')
        await sql`
          ALTER TABLE "sales"
          ADD COLUMN "channel_id" varchar(255)
        `

        console.log('✓ Added channel_id column to sales table')

        // Try to add the foreign key constraint
        try {
          await sql`
            ALTER TABLE "sales"
            ADD CONSTRAINT "sales_channel_id_sale_channels_id_fk"
            FOREIGN KEY ("channel_id") REFERENCES "sale_channels"("id") ON DELETE SET NULL
          `
          console.log('✓ Added foreign key constraint')
        } catch (fkError: any) {
          if (fkError.message?.includes('already exists') || fkError.code === '42710') {
            console.log('✓ Foreign key constraint already exists')
          } else {
            console.log('⚠ Could not add foreign key constraint:', fkError.message)
          }
        }

        console.log('\n✅ Channel table created successfully!')
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error('❌ Error ensuring channels table:', error.message)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
    process.exit(1)
  }
}

ensureChannelsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
