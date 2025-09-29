import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/lib/db/schema'

config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function verifyEmailSubscribers() {
  const client = postgres(DATABASE_URL)
  const db = drizzle(client, { schema })

  try {
    console.log('Fetching email subscribers from database...\n')

    const subscribers = await db.select().from(schema.emailSubscribers)

    if (subscribers.length === 0) {
      console.log('No subscribers found.')
    } else {
      console.log(`Found ${subscribers.length} subscriber(s):\n`)
      subscribers.forEach((sub, index) => {
        console.log(`${index + 1}. Email: ${sub.email}`)
        console.log(`   Source: ${sub.source}`)
        console.log(`   Marketing Consent: ${sub.consentMarketing}`)
        console.log(`   Discount Code: ${sub.discountCode || 'None'}`)
        console.log(`   Created: ${sub.createdAt}`)
        console.log()
      })
    }

  } catch (error) {
    console.error('Error fetching subscribers:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

verifyEmailSubscribers()