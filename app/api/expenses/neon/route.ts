import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expenses, expenseCategories, expensePaidBy } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Expense as StoreExpense } from '@/lib/expenseTypes'
import {
  requireAuth,
  getDb,
  deleteByIds,
  readJsonFallback,
  writeJsonFallback,
  guardEmptyState,
} from '@/lib/api/helpers'

const EMPTY_STATE = { expenses: [], categories: [], paidByOptions: [] }

async function fallbackToJsonFile() {
  const data = await readJsonFallback('expenses.json', EMPTY_STATE)
  const normalizedExpenses = Array.isArray(data.expenses)
    ? data.expenses.map((expense: any) => ({
      ...expense,
      vendor: typeof expense.vendor === 'string' ? expense.vendor : '',
    }))
    : []
  return { ...data, expenses: normalizedExpenses }
}

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    if (!getDb()) {
      return NextResponse.json(await fallbackToJsonFile())
    }

    const [dbExpenses, dbCategories, dbPaidBy] = await Promise.all([
      db!.select().from(expenses).orderBy(desc(expenses.createdAt)),
      db!.select().from(expenseCategories),
      db!.select().from(expensePaidBy),
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
    return NextResponse.json(await fallbackToJsonFile())
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const hasAnyData = (data.expenses?.length > 0) ||
      (data.categories?.length > 0) ||
      (data.paidByOptions?.length > 0)

    const blocked = await guardEmptyState(hasAnyData, async () => {
      const rows = await db!.select().from(expenses).limit(1)
      return rows.length > 0
    })
    if (blocked) return blocked

    if (!getDb()) {
      await writeJsonFallback('expenses.json', data)
      return NextResponse.json({ success: true })
    }

    // Get existing IDs for UPSERT diff
    const [existingExpenses, existingCategories, existingPaidBy] = await Promise.all([
      db!.select({ id: expenses.id }).from(expenses),
      db!.select({ id: expenseCategories.id }).from(expenseCategories),
      db!.select({ id: expensePaidBy.id }).from(expensePaidBy),
    ])

    const existingExpenseIds = new Set(existingExpenses.map(item => item.id))
    const existingCategoryIds = new Set(existingCategories.map(item => item.id))
    const existingPaidByIds = new Set(existingPaidBy.map(item => item.id))

    const incomingExpenseIds = new Set(data.expenses?.map((item: any) => item.id) || [])
    const incomingCategoryIds = new Set(data.categories?.map((item: any) => item.id) || [])
    const incomingPaidByIds = new Set(data.paidByOptions?.map((item: any) => item.id) || [])

    // Delete removed items
    await deleteByIds(expenses, expenses.id, Array.from(existingExpenseIds).filter(id => !incomingExpenseIds.has(id)))
    await deleteByIds(expenseCategories, expenseCategories.id, Array.from(existingCategoryIds).filter(id => !incomingCategoryIds.has(id)))
    await deleteByIds(expensePaidBy, expensePaidBy.id, Array.from(existingPaidByIds).filter(id => !incomingPaidByIds.has(id)))

    // UPSERT categories
    for (const category of data.categories || []) {
      const values = {
        id: category.id,
        name: category.name,
        color: category.color,
        createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
      }
      if (existingCategoryIds.has(category.id)) {
        await db!.update(expenseCategories).set(values).where(eq(expenseCategories.id, category.id))
      } else {
        await db!.insert(expenseCategories).values(values)
      }
    }

    // UPSERT paidByOptions
    for (const paidBy of data.paidByOptions || []) {
      const values = {
        id: paidBy.id,
        name: paidBy.name,
        color: paidBy.color,
        createdAt: paidBy.createdAt ? new Date(paidBy.createdAt) : new Date(),
      }
      if (existingPaidByIds.has(paidBy.id)) {
        await db!.update(expensePaidBy).set(values).where(eq(expensePaidBy.id, paidBy.id))
      } else {
        await db!.insert(expensePaidBy).values(values)
      }
    }

    // UPSERT expenses
    for (const expense of data.expenses || []) {
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
        await db!.update(expenses).set(values).where(eq(expenses.id, expense.id))
      } else {
        await db!.insert(expenses).values(values)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving expenses data:', error)
    return NextResponse.json({ error: 'Failed to save expenses' }, { status: 500 })
  }
}
