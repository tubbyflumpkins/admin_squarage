import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'

config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function addEmailSubscribersTable() {
  const client = postgres(DATABASE_URL)
  const db = drizzle(client, { schema })

  try {
    console.log('Creating email_subscribers table...')

    // Create the email_subscribers table
    await client`
      CREATE TABLE IF NOT EXISTS email_subscribers (
        id varchar(255) PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        source varchar(50) DEFAULT 'popup' NOT NULL,
        discount_code varchar(50),
        consent_marketing boolean DEFAULT false NOT NULL,
        consent_timestamp timestamp,
        ip_address varchar(45),
        user_agent text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `

    console.log('✅ email_subscribers table created successfully!')

  } catch (error) {
    console.error('Error creating table:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

addEmailSubscribersTable()