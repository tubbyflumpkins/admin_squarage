import * as dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Create database connection
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function resetPassword() {
  const email = process.argv[2] || 'dylan@squarage.com'
  const newPassword = process.argv[3] || 'admin123'
  
  console.log(`🔐 Resetting password for ${email}...`)
  
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update the user's password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email))
    
    console.log(`✅ Password reset successfully!`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 New password: ${newPassword}`)
    
    // Verify the password works
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0])
    
    if (user) {
      const isValid = await bcrypt.compare(newPassword, user.password)
      console.log(`✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    process.exit(1)
  }
}

resetPassword()