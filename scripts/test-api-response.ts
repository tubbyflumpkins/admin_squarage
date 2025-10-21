// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Simulate what the API endpoint does
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { desc } from 'drizzle-orm'
import * as schema from '../lib/db/schema'

async function testAPIResponse() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found')
      process.exit(1)
    }

    console.log('Simulating GET /api/sales/neon...\n')

    const sql = neon(process.env.DATABASE_URL)
    const db = drizzle(sql, { schema })

    // This is what the API does
    const [dbSales, dbSaleSubtasks, dbCollections, dbProducts, dbChannels] = await Promise.all([
      db.select().from(schema.sales).orderBy(desc(schema.sales.createdAt)),
      db.select().from(schema.saleSubtasks),
      db.select().from(schema.collections).orderBy(schema.collections.name),
      db.select().from(schema.products).orderBy(schema.products.name),
      db.select().from(schema.saleChannels).orderBy(schema.saleChannels.name)
    ])

    console.log('📊 Database Query Results:')
    console.log(`   Sales: ${dbSales.length}`)
    console.log(`   Collections: ${dbCollections.length}`)
    console.log(`   Products: ${dbProducts.length}`)
    console.log(`   Channels: ${dbChannels.length}`)
    console.log()

    console.log('🔍 Channels from database:')
    dbChannels.forEach((channel, i) => {
      console.log(`   ${i + 1}. ${channel.name}`)
      console.log(`      ID: ${channel.id}`)
      console.log(`      Created: ${channel.createdAt}`)
    })
    console.log()

    // Transform channels like the API does
    const transformedChannels = dbChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      createdAt: channel.createdAt,
    }))

    console.log('📤 API Response (channels):')
    console.log(JSON.stringify(transformedChannels, null, 2))

    const response = {
      sales: dbSales.length,
      collections: dbCollections.length,
      products: dbProducts.length,
      channels: transformedChannels,
    }

    console.log('\n✅ Full API Response Summary:')
    console.log(JSON.stringify(response, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

testAPIResponse()
