import { config } from 'dotenv'
import path from 'path'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables first
config({ path: path.resolve(process.cwd(), '.env.local') })

// Creates the two tables Squarage Labs keeps its studio data in: labs_designs (the saved
// designs of its /design page) and labs_settings (the bit library, materials and sheet presets,
// one jsonb document per key). Matches labsDesigns / labsSettings in lib/db/schema.ts.
// Safe to run more than once.
async function addLabsTables() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables')
    }

    console.log('Connecting to database...')
    const client = neon(DATABASE_URL)
    const db = drizzle(client)

    console.log('Creating labs_designs table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "labs_designs" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "shelf_type" varchar(20) NOT NULL,
        "collection" varchar(20) NOT NULL,
        "variant" varchar(40),
        "params" jsonb NOT NULL,
        "svg_preview" text,
        "created_by" varchar(255),
        "updated_by" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "deleted_at" timestamp
      )
    `)

    console.log('Creating labs_settings table...')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "labs_settings" (
        "key" varchar(64) PRIMARY KEY NOT NULL,
        "value" jsonb NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "updated_by" varchar(255),
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)

    console.log('✅ labs_designs and labs_settings created successfully!')

    // Exit the process
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating labs tables:', error)
    process.exit(1)
  }
}

addLabsTables()
