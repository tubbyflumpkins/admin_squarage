// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Now import after env is loaded
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'

async function testChannels() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found')
      process.exit(1)
    }

    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql, { schema })

    console.log('Fetching all channels from database...\n')
    const channels = await db.select().from(schema.saleChannels)

    if (channels.length === 0) {
      console.log('No channels found in database.')
    } else {
      console.log(`Found ${channels.length} channel(s):\n`)
      channels.forEach((channel, i) => {
        console.log(`${i + 1}. ${channel.name}`)
        console.log(`   ID: ${channel.id}`)
        console.log(`   Created: ${channel.createdAt}`)
        console.log()
      })
    }

    console.log('Fetching all sales with channels...\n')
    const sales = await db.select().from(schema.sales)
    const salesWithChannels = sales.filter(s => s.channelId)

    console.log(`Found ${salesWithChannels.length} sale(s) with channel associations:`)
    salesWithChannels.forEach((sale) => {
      const channel = channels.find(c => c.id === sale.channelId)
      console.log(`  - ${sale.name} → ${channel?.name || 'Unknown'}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testChannels()
