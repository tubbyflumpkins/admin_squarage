import { config } from 'dotenv'
import path from 'path'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables first
config({ path: path.resolve(process.cwd(), '.env.local') })

// Lets one labs share link carry several options: the rows of a link share its token, so the
// token stops being unique (it gets a plain index instead) and each row gets a permanent
// option number. Also adds the shipping weight columns. Matches sharedDesigns in lib/db/schema.ts.
// Safe to run more than once.
async function addSharedDesignOptions() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables')
    }

    console.log('Connecting to database...')
    const client = neon(DATABASE_URL)
    const db = drizzle(client)

    console.log('Updating shared_designs for multiple options per link...')

    await db.execute(sql`ALTER TABLE "shared_designs" ADD COLUMN IF NOT EXISTS "option_number" integer DEFAULT 1 NOT NULL`)
    await db.execute(sql`ALTER TABLE "shared_designs" DROP CONSTRAINT IF EXISTS "shared_designs_token_unique"`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "shared_designs_token_idx" ON "shared_designs" USING btree ("token")`)
    // Shipping weight borrowed from a Warped product, so Shopify's carrier rates match the real thing
    await db.execute(sql`ALTER TABLE "shared_designs" ADD COLUMN IF NOT EXISTS "shipping_weight_lb" real`)
    await db.execute(sql`ALTER TABLE "shared_designs" ADD COLUMN IF NOT EXISTS "ships_like" varchar(255)`)

    console.log('✅ shared_designs updated successfully!')

    // Exit the process
    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating shared_designs:', error)
    process.exit(1)
  }
}

addSharedDesignOptions()
