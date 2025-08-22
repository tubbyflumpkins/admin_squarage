import * as dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Now import database after env vars are loaded
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { users } from '../lib/db/schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seedUsers() {
  console.log('🌱 Seeding users...')

  try {
    // Hash passwords
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create initial admin users
    const initialUsers = [
      {
        id: 'user-dylan',
        name: 'Dylan',
        email: 'dylan@squarage.com',
        password: hashedPassword,
        role: 'admin',
      },
      {
        id: 'user-thomas',
        name: 'Thomas',
        email: 'thomas@squarage.com',
        password: hashedPassword,
        role: 'admin',
      },
    ]

    // Insert users
    for (const user of initialUsers) {
      await db.insert(users).values(user).onConflictDoNothing()
      console.log(`✅ Created user: ${user.name} (${user.email})`)
    }

    console.log('✨ Users seeded successfully!')
    console.log('📝 Default password for all users: admin123')
    console.log('⚠️  Please change the passwords after first login!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    process.exit(1)
  }
}

seedUsers()