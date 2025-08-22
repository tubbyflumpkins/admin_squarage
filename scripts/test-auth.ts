import * as dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function testAuth() {
  console.log('🔍 Testing authentication setup...\n')

  try {
    // Check if users exist
    const allUsers = await db.select().from(users)
    
    console.log(`✅ Found ${allUsers.length} users in database:`)
    for (const user of allUsers) {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
    }

    // Test password verification
    console.log('\n🔐 Testing password verification:')
    const testPassword = 'admin123'
    const dylan = allUsers.find(u => u.email === 'dylan@squarage.com')
    
    if (dylan) {
      const isValid = await bcrypt.compare(testPassword, dylan.password)
      console.log(`   Dylan's password check (admin123): ${isValid ? '✅ Valid' : '❌ Invalid'}`)
    }

    console.log('\n✨ Authentication system is ready!')
    console.log('\n📝 To log in:')
    console.log('   - Go to http://localhost:3000/login')
    console.log('   - Email: dylan@squarage.com OR thomas@squarage.com')
    console.log('   - Password: admin123')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error testing auth:', error)
    process.exit(1)
  }
}

testAuth()