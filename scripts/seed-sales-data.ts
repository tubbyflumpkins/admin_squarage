// Load environment variables at the very beginning
require('dotenv').config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../lib/db/schema'

async function seedSalesData() {
  console.log('🌱 Seeding sales data...')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local')
    process.exit(1)
  }

  // Create db connection directly
  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  try {
    // Create sample sales
    const sampleSales = [
      {
        id: 'sale-1',
        name: 'Custom Storage Unit - 10x10',
        placementDate: new Date('2024-01-15'),
        deliveryMethod: 'shipping' as const,
        status: 'fulfilled' as const,
        notes: 'Customer requested expedited shipping. Delivered on time.',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'sale-2',
        name: 'Premium Storage Container - Climate Controlled',
        placementDate: new Date('2024-01-20'),
        deliveryMethod: 'local' as const,
        status: 'in_progress' as const,
        notes: 'Local pickup scheduled for next week.',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-21'),
      },
      {
        id: 'sale-3',
        name: 'Portable Storage Shed - 8x12',
        placementDate: new Date('2024-01-25'),
        deliveryMethod: 'shipping' as const,
        status: 'not_started' as const,
        notes: 'Awaiting materials from supplier.',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        id: 'sale-4',
        name: 'Mini Storage Locker Set (5 units)',
        placementDate: new Date('2024-01-18'),
        deliveryMethod: 'local' as const,
        status: 'fulfilled' as const,
        notes: 'Bulk order for local business.',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22'),
      },
      {
        id: 'sale-5',
        name: 'Garage Organization System',
        placementDate: new Date('2024-01-28'),
        deliveryMethod: 'shipping' as const,
        status: 'in_progress' as const,
        notes: 'Custom configuration requested.',
        createdAt: new Date('2024-01-28'),
        updatedAt: new Date('2024-01-29'),
      }
    ]

    // Insert sales
    for (const sale of sampleSales) {
      await db.insert(schema.sales).values(sale)
      console.log(`✅ Created sale: ${sale.name}`)
    }

    // Create sample subtasks
    const sampleSubtasks = [
      // Subtasks for sale-1
      { id: 'subtask-1-1', saleId: 'sale-1', text: 'Process payment', completed: true },
      { id: 'subtask-1-2', saleId: 'sale-1', text: 'Prepare for shipping', completed: true },
      { id: 'subtask-1-3', saleId: 'sale-1', text: 'Send tracking information', completed: true },
      
      // Subtasks for sale-2
      { id: 'subtask-2-1', saleId: 'sale-2', text: 'Confirm pickup time with customer', completed: true },
      { id: 'subtask-2-2', saleId: 'sale-2', text: 'Prepare unit for pickup', completed: false },
      { id: 'subtask-2-3', saleId: 'sale-2', text: 'Complete final quality check', completed: false },
      
      // Subtasks for sale-3
      { id: 'subtask-3-1', saleId: 'sale-3', text: 'Order materials from supplier', completed: false },
      { id: 'subtask-3-2', saleId: 'sale-3', text: 'Schedule production', completed: false },
      
      // Subtasks for sale-5
      { id: 'subtask-5-1', saleId: 'sale-5', text: 'Review custom specifications', completed: true },
      { id: 'subtask-5-2', saleId: 'sale-5', text: 'Create custom layout design', completed: true },
      { id: 'subtask-5-3', saleId: 'sale-5', text: 'Order special components', completed: false },
      { id: 'subtask-5-4', saleId: 'sale-5', text: 'Assemble system', completed: false },
    ]

    // Insert subtasks
    for (const subtask of sampleSubtasks) {
      await db.insert(schema.saleSubtasks).values(subtask)
    }
    console.log(`✅ Created ${sampleSubtasks.length} subtasks`)

    console.log('✨ Sales data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding sales data:', error)
    process.exit(1)
  }

  process.exit(0)
}

seedSalesData()