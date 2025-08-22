import * as dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function testPasswordChange() {
  console.log('🔐 Testing password change functionality...\n')

  try {
    // Get Dylan's user
    const dylan = await db
      .select()
      .from(users)
      .where(eq(users.email, 'dylan@squarage.com'))
      .limit(1)
      .then(rows => rows[0])

    if (!dylan) {
      console.error('Dylan user not found')
      process.exit(1)
    }

    console.log('✅ Found user:', dylan.name)
    
    // Test current password
    const isValid = await bcrypt.compare('admin123', dylan.password)
    console.log(`✅ Current password (admin123) is valid: ${isValid}`)
    
    console.log('\n📝 Password change instructions:')
    console.log('1. Go to http://localhost:3000/settings')
    console.log('2. Enter current password: admin123')
    console.log('3. Enter and confirm a new password')
    console.log('4. Click "Change Password"')
    console.log('\nThe password will be securely hashed and saved to the database.')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testPasswordChange()