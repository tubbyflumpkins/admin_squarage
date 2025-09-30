import { sql } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sqlClient = neon(process.env.DATABASE_URL)
const db = drizzle(sqlClient)

async function createEmailTables() {
  try {
    console.log('Creating email tables...')

    // Create email_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT,
        react_component TEXT,
        variables JSONB,
        category VARCHAR(50) DEFAULT 'marketing' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('✓ Created email_templates table')

    // Create email_campaigns table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        template_id VARCHAR(255) REFERENCES email_templates(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'draft' NOT NULL,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        recipient_count INTEGER DEFAULT 0 NOT NULL,
        segment_rules JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('✓ Created email_campaigns table')

    // Create email_sends table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_sends (
        id VARCHAR(255) PRIMARY KEY,
        campaign_id VARCHAR(255) REFERENCES email_campaigns(id) ON DELETE CASCADE,
        recipient_email VARCHAR(255) NOT NULL,
        template_id VARCHAR(255) REFERENCES email_templates(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        resend_id VARCHAR(255),
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)
    console.log('✓ Created email_sends table')

    // Create email_queue table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_queue (
        id VARCHAR(255) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        template_id VARCHAR(255) REFERENCES email_templates(id) ON DELETE CASCADE,
        variables JSONB,
        priority INTEGER DEFAULT 5 NOT NULL,
        scheduled_for TIMESTAMP DEFAULT NOW() NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        processed_at TIMESTAMP
      )
    `)
    console.log('✓ Created email_queue table')

    // Create indexes for better performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_sends_recipient ON email_sends(recipient_email)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id)`)
    console.log('✓ Created indexes')

    console.log('\n✅ All email tables created successfully!')

  } catch (error) {
    console.error('Error creating email tables:', error)
    process.exit(1)
  }
}

createEmailTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })