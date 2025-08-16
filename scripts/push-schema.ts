import * as dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function pushSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local')
    process.exit(1)
  }

  console.log('Creating database schema...')

  try {
    const db = neon(process.env.DATABASE_URL)

    // Create categories table
    await db`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "color" varchar(7) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `
    console.log('✓ Created categories table')

    // Create owners table
    await db`
      CREATE TABLE IF NOT EXISTS "owners" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "color" varchar(7) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `
    console.log('✓ Created owners table')

    // Create todos table
    await db`
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "category" varchar(255) NOT NULL,
        "owner" varchar(255) NOT NULL,
        "priority" varchar(10) NOT NULL,
        "status" varchar(20) NOT NULL,
        "due_date" timestamp,
        "completed" boolean DEFAULT false NOT NULL,
        "notes" text,
        "created_at" timestamp NOT NULL,
        "updated_at" timestamp NOT NULL
      )
    `
    console.log('✓ Created todos table')

    // Create subtasks table
    await db`
      CREATE TABLE IF NOT EXISTS "subtasks" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "todo_id" varchar(255) NOT NULL,
        "text" text NOT NULL,
        "completed" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "subtasks_todo_id_todos_id_fk" 
        FOREIGN KEY ("todo_id") 
        REFERENCES "todos"("id") 
        ON DELETE cascade 
        ON UPDATE no action
      )
    `
    console.log('✓ Created subtasks table')

    console.log('\n✅ Database schema created successfully!')
    console.log('\nYou can now:')
    console.log('1. Run "npm run db:migrate-data" to migrate existing data')
    console.log('2. Run "npm run dev" to start the application')

  } catch (error) {
    console.error('Failed to create schema:', error)
    process.exit(1)
  }
}

// Run the schema push
pushSchema()