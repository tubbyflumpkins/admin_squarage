import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { todos, users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function migrateTodoOwners() {
  console.log('🔄 Migrating todo owners to new user system...\n')

  try {
    // Get all users
    const allUsers = await db.select().from(users)
    const userMap = new Map(allUsers.map(u => [u.name, u.id]))
    
    console.log('👥 User mapping:')
    userMap.forEach((id, name) => {
      console.log(`  ${name} -> ${id}`)
    })
    
    // Get todos that need updating
    const allTodos = await db.select().from(todos)
    const todosToUpdate = allTodos.filter(t => 
      (t.owner === 'Dylan' || t.owner === 'Thomas') && !t.userId
    )
    
    console.log(`\n📊 Found ${todosToUpdate.length} todos to update`)
    
    // Update each todo
    let updated = 0
    for (const todo of todosToUpdate) {
      const userId = userMap.get(todo.owner)
      if (userId) {
        await db.update(todos)
          .set({ userId })
          .where(eq(todos.id, todo.id))
        updated++
        console.log(`✅ Updated: "${todo.title}" (${todo.owner} -> ${userId})`)
      }
    }
    
    console.log(`\n✨ Successfully updated ${updated} todos!`)
    
    // Verify the update
    const verifyTodos = await db.select().from(todos)
    const withUserId = verifyTodos.filter(t => t.userId).length
    const withoutUserId = verifyTodos.filter(t => !t.userId).length
    
    console.log('\n📈 Final status:')
    console.log(`  Todos with user ID: ${withUserId}`)
    console.log(`  Todos without user ID: ${withoutUserId} (should be "All" todos)`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

migrateTodoOwners()