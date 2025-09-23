import * as dotenv from 'dotenv'
import * as path from 'path'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function addNotificationIndexes() {
  console.log('Adding indexes to notifications table...')
  
  try {
    // Check if DATABASE_URL is configured
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      console.error('DATABASE_URL not found in environment variables')
      process.exit(1)
    }

    // Create database connection
    const sql_client = neon(connectionString)
    const db = drizzle(sql_client)

    // Create index for fetching user notifications sorted by creation date
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
      ON notifications(user_id, created_at DESC)
    `)
    console.log('✅ Created index: idx_notifications_user_created')

    // Create index for counting unread notifications
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
      ON notifications(user_id, read, created_at DESC)
    `)
    console.log('✅ Created index: idx_notifications_user_read_created')

    // Create index for finding notifications by type
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
      ON notifications(user_id, type, created_at DESC)
    `)
    console.log('✅ Created index: idx_notifications_user_type')

    // Create index for cleanup operations (finding old read notifications)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_read_created 
      ON notifications(read, created_at)
      WHERE read = true
    `)
    console.log('✅ Created index: idx_notifications_read_created')

    // Add indexes for push_subscriptions table too
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
      ON push_subscriptions(user_id)
    `)
    console.log('✅ Created index: idx_push_subscriptions_user')

    // Add index for notification preferences
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
      ON notification_preferences(user_id)
    `)
    console.log('✅ Created index: idx_notification_preferences_user')

    console.log('\n✨ All indexes created successfully!')
    console.log('\nThese indexes will:')
    console.log('- Speed up notification queries by user')
    console.log('- Optimize unread count calculations')
    console.log('- Improve cleanup operations')
    console.log('- Reduce Neon compute usage significantly')
    
  } catch (error) {
    console.error('Error adding indexes:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the migration
addNotificationIndexes()