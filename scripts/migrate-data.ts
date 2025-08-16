import * as dotenv from 'dotenv'
import * as fs from 'fs/promises'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { todos, categories, owners, subtasks } from '../lib/db/schema'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function migrateData() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local')
    process.exit(1)
  }

  console.log('Starting data migration to Neon...')

  try {
    // Read existing JSON data
    const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json')
    const jsonData = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(jsonData)

    // Connect to Neon
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql)

    console.log('Connected to Neon database')

    // Start migration
    await db.transaction(async (tx) => {
      // Clear existing data (optional - remove if you want to append)
      console.log('Clearing existing data...')
      await tx.delete(subtasks)
      await tx.delete(todos)
      await tx.delete(categories)
      await tx.delete(owners)

      // Migrate categories
      if (data.categories && data.categories.length > 0) {
        console.log(`Migrating ${data.categories.length} categories...`)
        await tx.insert(categories).values(data.categories)
      }

      // Migrate owners
      if (data.owners && data.owners.length > 0) {
        console.log(`Migrating ${data.owners.length} owners...`)
        await tx.insert(owners).values(data.owners)
      }

      // Migrate todos and subtasks
      if (data.todos && data.todos.length > 0) {
        console.log(`Migrating ${data.todos.length} todos...`)
        
        for (const todo of data.todos) {
          const { subtasks: todoSubtasks, ...todoData } = todo
          
          // Insert todo
          await tx.insert(todos).values({
            id: todoData.id,
            title: todoData.title,
            category: todoData.category,
            owner: todoData.owner,
            priority: todoData.priority,
            status: todoData.status,
            dueDate: todoData.dueDate ? new Date(todoData.dueDate) : null,
            completed: todoData.completed,
            notes: todoData.notes || null,
            createdAt: new Date(todoData.createdAt),
            updatedAt: new Date(todoData.updatedAt)
          })

          // Insert subtasks if they exist
          if (todoSubtasks && todoSubtasks.length > 0) {
            console.log(`  - Migrating ${todoSubtasks.length} subtasks for todo ${todoData.id}`)
            await tx.insert(subtasks).values(
              todoSubtasks.map((subtask: any) => ({
                id: subtask.id,
                todoId: todo.id,
                text: subtask.text,
                completed: subtask.completed
              }))
            )
          }
        }
      }
    })

    console.log('✅ Data migration completed successfully!')
    
    // Verify migration
    const [todoCount, categoryCount, ownerCount, subtaskCount] = await Promise.all([
      db.select().from(todos),
      db.select().from(categories),
      db.select().from(owners),
      db.select().from(subtasks)
    ])
    
    console.log('\nMigration summary:')
    console.log(`- Todos: ${todoCount.length}`)
    console.log(`- Categories: ${categoryCount.length}`)
    console.log(`- Owners: ${ownerCount.length}`)
    console.log(`- Subtasks: ${subtaskCount.length}`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateData()