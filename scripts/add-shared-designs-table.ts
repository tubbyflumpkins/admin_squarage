import { config } from 'dotenv'
import path from 'path'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables first
config({ path: path.resolve(process.cwd(), '.env.local') })

// Creates the shared_designs table used by labs' "Share with customer" links.
// Matches sharedDesigns in lib/db/schema.ts. Safe to run more than once.
async function addSharedDesignsTable() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables')
    }

    console.log('Connecting to database...')
    const client = neon(DATABASE_URL)
    const db = drizzle(client)

    console.log('Creating shared_designs table...')

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "shared_designs" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "token" varchar(64) NOT NULL,
        "status" varchar(20) DEFAULT 'open' NOT NULL,
        "customer_name" varchar(255) NOT NULL,
        "customer_email" varchar(255),
        "price_cents" integer NOT NULL,
        "currency" varchar(3) DEFAULT 'USD' NOT NULL,
        "shipping_cents" integer,
        "notes" text DEFAULT '' NOT NULL,
        "variant" varchar(20) NOT NULL,
        "finish" varchar(20) NOT NULL,
        "design" jsonb NOT NULL,
        "render" jsonb NOT NULL,
        "svg_preview" text,
        "shopify_draft_order_id" varchar(255),
        "shopify_draft_order_name" varchar(50),
        "shopify_invoice_url" text,
        "shopify_order_name" varchar(50),
        "status_checked_at" timestamp,
        "paid_at" timestamp,
        "revoked_at" timestamp,
        "created_by" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "shared_designs_token_unique" UNIQUE("token")
      )
    `)

    console.log('✅ shared_designs table created successfully!')

    // Exit the process
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating shared_designs table:', error)
    process.exit(1)
  }
}

addSharedDesignsTable()
