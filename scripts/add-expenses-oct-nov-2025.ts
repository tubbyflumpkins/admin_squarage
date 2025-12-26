import { randomUUID } from 'crypto'
import { and, gte, lte } from 'drizzle-orm'
import dotenv from 'dotenv'
import { expenses } from '../lib/db/schema'

dotenv.config({ path: '.env.local', override: true })

type ExpenseSeed = {
  paidBy: string
  name: string
  vendor: string
  costCents: number
  date: string
  category: string
}

const entries: ExpenseSeed[] = [
  {
    paidBy: 'Squarage',
    name: 'Anthropic',
    vendor: 'Anthropic',
    costCents: -500,
    date: '2025-10-01',
    category: 'Admin',
  },
  {
    paidBy: 'Squarage',
    name: 'Robert McNeel & Assocs',
    vendor: 'Robert McNeel',
    costCents: -19500,
    date: '2025-10-07',
    category: 'Design',
  },
  {
    paidBy: 'Squarage',
    name: 'Facebook Ads',
    vendor: 'Facebook',
    costCents: -474,
    date: '2025-10-07',
    category: 'Marketing',
  },
  {
    paidBy: 'Squarage',
    name: 'Amazon Purchase',
    vendor: 'Amazon',
    costCents: -58058,
    date: '2025-10-15',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Transfer to Dylan (USAA)',
    vendor: 'USAA',
    costCents: -11814,
    date: '2025-10-15',
    category: 'Transfer',
  },
  {
    paidBy: 'Squarage',
    name: 'Shopify Subscription',
    vendor: 'Shopify',
    costCents: -3900,
    date: '2025-10-16',
    category: 'Website',
  },
  {
    paidBy: 'Squarage',
    name: 'Baller Hardware',
    vendor: 'Baller Hardware',
    costCents: -1404,
    date: '2025-10-17',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Home Depot',
    vendor: 'Home Depot',
    costCents: -10157,
    date: '2025-10-18',
    category: 'Materials',
  },
  {
    paidBy: 'Revenue',
    name: 'Shopify Transfer',
    vendor: 'Shopify',
    costCents: 124654,
    date: '2025-10-20',
    category: 'Revenue',
  },
  {
    paidBy: 'Squarage',
    name: 'Interest Deposit',
    vendor: 'Bank Interest',
    costCents: 126,
    date: '2025-10-31',
    category: 'Transfer',
  },
  {
    paidBy: 'Squarage',
    name: 'Transfer to Dylan (USAA)',
    vendor: 'USAA',
    costCents: -115000,
    date: '2025-11-03',
    category: 'Transfer',
  },
  {
    paidBy: 'Squarage',
    name: 'Home Depot',
    vendor: 'Home Depot',
    costCents: -3723,
    date: '2025-11-04',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Home Depot',
    vendor: 'Home Depot',
    costCents: -2050,
    date: '2025-11-04',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Amazon Purchase',
    vendor: 'Amazon',
    costCents: -1590,
    date: '2025-11-14',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Shopify Subscription',
    vendor: 'Shopify',
    costCents: -3900,
    date: '2025-11-15',
    category: 'Website',
  },
  {
    paidBy: 'Squarage',
    name: 'Baller Hardware',
    vendor: 'Baller Hardware',
    costCents: -1578,
    date: '2025-11-24',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Baller Hardware',
    vendor: 'Baller Hardware',
    costCents: -987,
    date: '2025-11-24',
    category: 'Materials',
  },
  {
    paidBy: 'Squarage',
    name: 'Interest Adjustment',
    vendor: 'Bank Interest',
    costCents: 1,
    date: '2025-08-19',
    category: 'Transfer',
  },
  {
    paidBy: 'Squarage',
    name: 'Interest Deposit',
    vendor: 'Bank Interest',
    costCents: 34,
    date: '2025-11-30',
    category: 'Transfer',
  },
]

const formatDateKey = (date: Date | null) => {
  if (!date) return 'null'
  return date.toISOString().slice(0, 10)
}

const run = async () => {
  const { db, isDatabaseConfigured } = await import('../lib/db')
  if (!isDatabaseConfigured() || !db) {
    throw new Error('DATABASE_URL not configured. Cannot insert expenses.')
  }

  const minDate = new Date('2025-08-19')
  const maxDate = new Date('2025-11-30')

  const existing = await db
    .select({
      paidBy: expenses.paidBy,
      name: expenses.name,
      costCents: expenses.costCents,
      date: expenses.date,
    })
    .from(expenses)
    .where(and(gte(expenses.date, minDate), lte(expenses.date, maxDate)))

  const existingKeys = new Set(
    existing.map(item => [
      formatDateKey(item.date),
      item.name,
      String(item.costCents ?? 0),
      item.paidBy,
    ].join('|'))
  )

  const now = new Date()
  const rowsToInsert = entries
    .filter(entry => {
      const key = [
        entry.date,
        entry.name,
        String(entry.costCents),
        entry.paidBy,
      ].join('|')
      return !existingKeys.has(key)
    })
    .map(entry => ({
      id: randomUUID(),
      paidBy: entry.paidBy,
      name: entry.name,
      vendor: entry.vendor,
      costCents: entry.costCents,
      date: new Date(entry.date),
      category: entry.category,
      createdAt: now,
      updatedAt: now,
    }))

  if (rowsToInsert.length === 0) {
    console.log('No new expenses to insert.')
    return
  }

  await db.insert(expenses).values(rowsToInsert)
  console.log(`Inserted ${rowsToInsert.length} expenses.`)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
