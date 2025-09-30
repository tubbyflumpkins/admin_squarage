import { sql } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { emailTemplates } from '../lib/db/schema'
import { randomUUID } from 'crypto'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sqlClient = neon(process.env.DATABASE_URL)
const db = drizzle(sqlClient)

async function seedWelcomeTemplate() {
  try {
    console.log('Seeding welcome email template...')

    const now = new Date()

    // Check if welcome template already exists
    const existing = await db
      .select()
      .from(emailTemplates)
      .where(sql`id = 'welcome-email'`)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('Welcome template already exists, updating...')
      await db
        .update(emailTemplates)
        .set({
          name: 'Welcome Email - 10% Discount',
          subject: 'Welcome to Squarage! Your 10% discount is inside',
          reactComponent: 'WelcomeEmail',
          variables: {
            discountCode: 'string',
            customerEmail: 'string'
          },
          category: 'transactional',
          isActive: true,
          updatedAt: now
        })
        .where(sql`id = 'welcome-email'`)
    } else {
      console.log('Creating new welcome template...')
      await db.insert(emailTemplates).values({
        id: 'welcome-email',
        name: 'Welcome Email - 10% Discount',
        subject: 'Welcome to Squarage! Your 10% discount is inside',
        htmlContent: null, // We use React component instead
        reactComponent: 'WelcomeEmail',
        variables: {
          discountCode: 'string',
          customerEmail: 'string'
        },
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
    }

    console.log('✅ Welcome template seeded successfully!')

    // Also create a few other sample templates
    const sampleTemplates = [
      {
        id: randomUUID(),
        name: 'Order Confirmation',
        subject: 'Your Squarage order has been confirmed',
        htmlContent: '<h1>Order Confirmed!</h1><p>Thank you for your order {{orderNumber}}</p>',
        reactComponent: null,
        variables: { orderNumber: 'string', customerName: 'string' },
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: randomUUID(),
        name: 'New Collection Launch',
        subject: 'Introducing our newest collection: {{collectionName}}',
        htmlContent: '<h1>New Collection Available</h1><p>Check out our latest designs</p>',
        reactComponent: null,
        variables: { collectionName: 'string' },
        category: 'marketing',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: randomUUID(),
        name: 'Abandoned Cart Reminder',
        subject: "Don't forget your items!",
        htmlContent: '<h1>You left something behind</h1><p>Complete your purchase and save 5%</p>',
        reactComponent: null,
        variables: { cartItems: 'array', cartTotal: 'number' },
        category: 'marketing',
        isActive: false,
        createdAt: now,
        updatedAt: now
      }
    ]

    console.log('Adding sample templates...')
    for (const template of sampleTemplates) {
      try {
        await db.insert(emailTemplates).values(template)
        console.log(`  ✓ Added: ${template.name}`)
      } catch (error) {
        // Skip if already exists
        console.log(`  - Skipped: ${template.name} (may already exist)`)
      }
    }

    console.log('\n✅ All templates seeded successfully!')

  } catch (error) {
    console.error('Error seeding templates:', error)
    process.exit(1)
  }
}

seedWelcomeTemplate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })