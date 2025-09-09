import dotenv from 'dotenv'
import path from 'path'

// Load environment variables FIRST before any other imports
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql as drizzleSql } from 'drizzle-orm'

async function createNotificationTables() {
  try {
    console.log('Creating notification tables...')
    
    // Create database connection
    const sqlClient = neon(process.env.DATABASE_URL!)
    const db = drizzle(sqlClient)
    
    // Create notifications table
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS notifications (
        id varchar(255) PRIMARY KEY,
        user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        title text NOT NULL,
        message text NOT NULL,
        related_id varchar(255),
        metadata jsonb,
        read boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log('✅ Created notifications table')
    
    // Create push_subscriptions table
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id varchar(255) PRIMARY KEY,
        user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint text NOT NULL UNIQUE,
        p256dh text NOT NULL,
        auth text NOT NULL,
        user_agent text,
        created_at timestamp DEFAULT now() NOT NULL,
        last_used timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log('✅ Created push_subscriptions table')
    
    // Create notification_preferences table
    await db.execute(drizzleSql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        push_enabled boolean DEFAULT true NOT NULL,
        email_enabled boolean DEFAULT false NOT NULL,
        task_created boolean DEFAULT true NOT NULL,
        task_assigned boolean DEFAULT true NOT NULL,
        task_due boolean DEFAULT true NOT NULL,
        status_changed boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log('✅ Created notification_preferences table')
    
    console.log('\n✨ All notification tables created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error creating notification tables:', error)
    process.exit(1)
  }
}

createNotificationTables()