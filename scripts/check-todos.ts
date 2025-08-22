import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { todos, users } from '../lib/db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function checkTodos() {
  console.log('🔍 Checking existing todos in database...\n')

  try {
    // Get all todos
    const allTodos = await db.select().from(todos)
    console.log(`Found ${allTodos.length} todos total`)
    
    // Group by owner
    const byOwner = allTodos.reduce((acc, todo) => {
      acc[todo.owner] = (acc[todo.owner] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\nTodos by owner:')
    Object.entries(byOwner).forEach(([owner, count]) => {
      console.log(`  ${owner}: ${count} todos`)
    })
    
    // Show todos with Dylan or Thomas as owner
    const dylanThomasTodos = allTodos.filter(t => 
      t.owner === 'Dylan' || t.owner === 'Thomas'
    )
    
    console.log(`\n📊 Found ${dylanThomasTodos.length} todos with Dylan or Thomas as owner`)
    
    // Check users
    const allUsers = await db.select().from(users)
    console.log('\n👥 Users in system:')
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`)
    })
    
    // Show sample of todos that need updating
    if (dylanThomasTodos.length > 0) {
      console.log('\n📝 Sample todos that need owner update:')
      dylanThomasTodos.slice(0, 5).forEach(todo => {
        console.log(`  - "${todo.title}" (Owner: ${todo.owner}, User ID: ${todo.userId || 'null'})`)
      })
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkTodos()