import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { rolePermissions } from '../lib/db/schema'
import { ALL_PERMISSIONS } from '../lib/permissionKeys'
import { v4 as uuidv4 } from 'uuid'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function seedRolePermissions() {
  console.log('Seeding role permissions...')

  try {
    const records: { id: string; role: string; permission: string }[] = []

    // user role: all permissions
    for (const perm of ALL_PERMISSIONS) {
      records.push({ id: uuidv4(), role: 'user', permission: perm })
    }

    // creator role: limited permissions (no sales, expenses, email)
    const creatorPermissions = ['todo', 'calendar', 'notes', 'quick-links'] as const
    for (const perm of creatorPermissions) {
      records.push({ id: uuidv4(), role: 'creator', permission: perm })
    }

    // Insert all records
    await db.insert(rolePermissions).values(records)

    console.log(`Inserted ${records.length} role permission records`)
    console.log('  user: all permissions')
    console.log('  creator: todo, calendar, notes, quick-links')
    console.log('Done!')
  } catch (error) {
    console.error('Error seeding role permissions:', error)
    process.exit(1)
  }
}

seedRolePermissions()
