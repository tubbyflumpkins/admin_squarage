import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import { expenses, expenseCategories, expensePaidBy } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import type { Expense as StoreExpense } from '@/lib/expenseTypes'

async function fallbackToJsonFile() {
  const fs = await import('fs/promises')
  const path = await import('path')
  const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json')
  
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    const normalizedExpenses = Array.isArray(parsed.expenses)
      ? parsed.expenses.map((expense: any) => ({
        ...expense,
        vendor: typeof expense.vendor === 'string' ? expense.vendor : '',
      }))
      : []
    return {
      expenses: normalizedExpenses,
      categories: parsed.categories || [],
      paidByOptions: parsed.paidByOptions || [],
    }
  } catch {
    return {
      expenses: [],
      categories: [],
      paidByOptions: [],
    }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!isDatabaseConfigured() || !db) {
      const data = await fallbackToJsonFile()
      return NextResponse.json(data)
    }

    const [dbExpenses, dbCategories, dbPaidBy] = await Promise.all([
      db.select().from(expenses).orderBy(desc(expenses.createdAt)),
      db.select().from(expenseCategories),
      db.select().from(expensePaidBy),
    ])

    const transformedExpenses: StoreExpense[] = dbExpenses.map(expense => ({
      id: expense.id,
      paidBy: expense.paidBy,
      name: expense.name,
      vendor: expense.vendor ?? '',
      costCents: expense.costCents ?? 0,
      date: expense.date,
      category: expense.category,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }))

    return NextResponse.json({
      expenses: transformedExpenses,
      categories: dbCategories,
      paidByOptions: dbPaidBy,
    })
  } catch (error) {
    console.error('Error fetching expenses data:', error)
    const data = await fallbackToJsonFile()
    return NextResponse.json(data)
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const hasAnyData = (data.expenses && data.expenses.length > 0) ||
      (data.categories && data.categories.length > 0) ||
      (data.paidByOptions && data.paidByOptions.length > 0)

    if (!hasAnyData && isDatabaseConfigured() && db) {
      const [existingExpenses] = await Promise.all([
        db.select().from(expenses).limit(1),
      ])

      if (existingExpenses.length > 0) {
        return NextResponse.json({
          error: 'Cannot save empty state when database contains data',
          blocked: true,
        }, { status: 400 })
      }
    }

    if (!isDatabaseConfigured() || !db) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const DATA_FILE = path.join(process.cwd(), 'data', 'expenses.json')
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
      return NextResponse.json({ success: true })
    }

    const [existingExpenses, existingCategories, existingPaidBy] = await Promise.all([
      db.select({ id: expenses.id }).from(expenses),
      db.select({ id: expenseCategories.id }).from(expenseCategories),
      db.select({ id: expensePaidBy.id }).from(expensePaidBy),
    ])

    const existingExpenseIds = new Set(existingExpenses.map(item => item.id))
    const existingCategoryIds = new Set(existingCategories.map(item => item.id))
    const existingPaidByIds = new Set(existingPaidBy.map(item => item.id))

    const incomingExpenseIds = new Set(data.expenses?.map((item: any) => item.id) || [])
    const incomingCategoryIds = new Set(data.categories?.map((item: any) => item.id) || [])
    const incomingPaidByIds = new Set(data.paidByOptions?.map((item: any) => item.id) || [])

    const expenseIdsToDelete = Array.from(existingExpenseIds).filter(id => !incomingExpenseIds.has(id))
    const categoryIdsToDelete = Array.from(existingCategoryIds).filter(id => !incomingCategoryIds.has(id))
    const paidByIdsToDelete = Array.from(existingPaidByIds).filter(id => !incomingPaidByIds.has(id))

    if (expenseIdsToDelete.length > 0) {
      await db.delete(expenses).where(
        drizzleSql`${expenses.id} IN (${drizzleSql.join(expenseIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (categoryIdsToDelete.length > 0) {
      await db.delete(expenseCategories).where(
        drizzleSql`${expenseCategories.id} IN (${drizzleSql.join(categoryIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (paidByIdsToDelete.length > 0) {
      await db.delete(expensePaidBy).where(
        drizzleSql`${expensePaidBy.id} IN (${drizzleSql.join(paidByIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }

    if (data.categories && data.categories.length > 0) {
      for (const category of data.categories) {
        const values = {
          id: category.id,
          name: category.name,
          color: category.color,
          createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
        }
        if (existingCategoryIds.has(category.id)) {
          await db.update(expenseCategories)
            .set(values)
            .where(eq(expenseCategories.id, category.id))
        } else {
          await db.insert(expenseCategories).values(values)
        }
      }
    }

    if (data.paidByOptions && data.paidByOptions.length > 0) {
      for (const paidBy of data.paidByOptions) {
        const values = {
          id: paidBy.id,
          name: paidBy.name,
          color: paidBy.color,
          createdAt: paidBy.createdAt ? new Date(paidBy.createdAt) : new Date(),
        }
        if (existingPaidByIds.has(paidBy.id)) {
          await db.update(expensePaidBy)
            .set(values)
            .where(eq(expensePaidBy.id, paidBy.id))
        } else {
          await db.insert(expensePaidBy).values(values)
        }
      }
    }

    if (data.expenses && data.expenses.length > 0) {
      for (const expense of data.expenses) {
        const values = {
          id: expense.id,
          paidBy: expense.paidBy,
          name: expense.name,
          vendor: expense.vendor ?? '',
          costCents: expense.costCents ?? 0,
          date: expense.date ? new Date(expense.date) : null,
          category: expense.category,
          createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
          updatedAt: new Date(),
        }

        if (existingExpenseIds.has(expense.id)) {
          await db.update(expenses)
            .set(values)
            .where(eq(expenses.id, expense.id))
        } else {
          await db.insert(expenses).values(values)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving expenses data:', error)
    return NextResponse.json({ error: 'Failed to save expenses' }, { status: 500 })
  }
}
