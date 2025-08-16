import * as dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { todos, categories, owners, subtasks } from '../lib/db/schema'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function seedTestData() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in .env.local')
    process.exit(1)
  }

  console.log('Seeding test data to Neon...')

  try {
    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql)

    // Clear existing data
    console.log('Clearing existing data...')
    await db.delete(subtasks)
    await db.delete(todos)
    await db.delete(categories)
    await db.delete(owners)

    // Insert test categories
    const testCategories = [
      { id: '5weyogmrh55', name: 'Sales', color: '#4A9B4E' },
      { id: 'kc72pc4kog', name: 'Manufacturing', color: '#F7901E' },
      { id: 'r96gwuh95e', name: 'Admin', color: '#F04E23' },
      { id: '73jc041cxf8', name: 'Design', color: '#9B59B6' },
      { id: 'xki6q8x1gpe', name: 'Website', color: '#01BAD5' },
      { id: '4t6kjmc15eb', name: 'Marketing', color: '#F8BBD0' }
    ]
    console.log(`Inserting ${testCategories.length} categories...`)
    await db.insert(categories).values(testCategories)

    // Insert test owners
    const testOwners = [
      { id: '1', name: 'Dylan', color: '#5A9FD4' },
      { id: 'c2b9o1ok3v', name: 'Thomas', color: '#5A9FD4' },
      { id: 'kfjg246ae5o', name: 'Dyl & Tho', color: '#5A9FD4' }
    ]
    console.log(`Inserting ${testOwners.length} owners...`)
    await db.insert(owners).values(testOwners)

    // Insert test todos
    const testTodos = [
      {
        id: 'test1',
        title: 'Test Neon Database Connection',
        category: 'Website',
        owner: 'Dylan',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2025-08-20'),
        completed: false,
        notes: 'Testing the new Neon database integration',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test2',
        title: 'Deploy to Vercel',
        category: 'Admin',
        owner: 'Thomas',
        priority: 'medium',
        status: 'not_started',
        dueDate: new Date('2025-08-22'),
        completed: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test3',
        title: 'Create Marketing Campaign',
        category: 'Marketing',
        owner: 'Dyl & Tho',
        priority: 'low',
        status: 'not_started',
        dueDate: null,
        completed: false,
        notes: 'Plan for Q4 2025',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    console.log(`Inserting ${testTodos.length} todos...`)
    for (const todo of testTodos) {
      await db.insert(todos).values(todo)
    }

    // Insert test subtasks
    const testSubtasks = [
      { id: 'sub1', todoId: 'test1', text: 'Set up Neon account', completed: true },
      { id: 'sub2', todoId: 'test1', text: 'Configure database schema', completed: true },
      { id: 'sub3', todoId: 'test1', text: 'Test API endpoints', completed: false },
      { id: 'sub4', todoId: 'test2', text: 'Add environment variables', completed: false },
      { id: 'sub5', todoId: 'test2', text: 'Push to GitHub', completed: false }
    ]
    console.log(`Inserting ${testSubtasks.length} subtasks...`)
    await db.insert(subtasks).values(testSubtasks)

    console.log('\n✅ Test data seeded successfully!')
    console.log('\nYou can now:')
    console.log('1. Open http://localhost:3000 to see the todos')
    console.log('2. All CRUD operations will work with the database')
    console.log('3. Deploy to Vercel with DATABASE_URL environment variable')

  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

// Run seeding
seedTestData()