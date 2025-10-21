/**
 * Dashboard API - Fetches all dashboard data in a single request
 * This reduces database connections from 4+ separate API calls to just 1
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, isDatabaseConfigured } from '@/lib/db'
import {
  todos,
  categories,
  owners,
  subtasks,
  users,
  sales,
  collections,
  products,
  saleSubtasks,
  saleChannels,
  calendarEvents,
  calendarTypes,
  eventReminders,
  quickLinks
} from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Dashboard API] Loading all dashboard data in single request...')
    
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('[Dashboard API] Database not configured')
      return NextResponse.json({
        todos: { todos: [], categories: [], owners: [] },
        sales: { sales: [], collections: [], products: [], channels: [] },
        calendar: { events: [], calendarTypes: [], reminders: [] },
        quickLinks: { quickLinks: [] }
      })
    }

    // Fetch ALL data in parallel with a single database round trip
    // This is much more efficient than separate API calls
    const [
      dbTodos,
      dbCategories,
      dbOwners,
      dbSubtasks,
      dbUsers,
      dbSales,
      dbCollections,
      dbProducts,
      dbSaleSubtasks,
      dbSaleChannels,
      dbEvents,
      dbCalendarTypes,
      dbEventReminders,
      dbQuickLinks
    ] = await Promise.all([
      db.select().from(todos).orderBy(desc(todos.createdAt)),
      db.select().from(categories),
      db.select().from(owners),
      db.select().from(subtasks),
      db.select().from(users),
      db.select().from(sales).orderBy(desc(sales.createdAt)),
      db.select().from(collections),
      db.select().from(products),
      db.select().from(saleSubtasks),
      db.select().from(saleChannels).orderBy(saleChannels.name),
      db.select().from(calendarEvents).orderBy(desc(calendarEvents.createdAt)),
      db.select().from(calendarTypes),
      db.select().from(eventReminders),
      db.select().from(quickLinks).orderBy(desc(quickLinks.createdAt))
    ])

    console.log('[Dashboard API] Data fetched successfully:', {
      todos: dbTodos.length,
      sales: dbSales.length,
      channels: dbSaleChannels.length,
      events: dbEvents.length,
      quickLinks: dbQuickLinks.length
    })

    // Group subtasks by todo ID
    const subtasksByTodoId = dbSubtasks.reduce((acc, subtask) => {
      if (!acc[subtask.todoId]) {
        acc[subtask.todoId] = []
      }
      acc[subtask.todoId].push({
        id: subtask.id,
        text: subtask.text,
        completed: subtask.completed
      })
      return acc
    }, {} as Record<string, any[]>)

    // Group sale subtasks by sale ID
    const saleSubtasksBySaleId = dbSaleSubtasks.reduce((acc, subtask) => {
      if (!acc[subtask.saleId]) {
        acc[subtask.saleId] = []
      }
      acc[subtask.saleId].push({
        id: subtask.id,
        text: subtask.text,
        completed: subtask.completed
      })
      return acc
    }, {} as Record<string, any[]>)

    // Create owner list from users
    const userColors: Record<string, string> = {
      'Dylan': '#F7901E',
      'Thomas': '#01BAD5',
    }
    
    const dbOwnersProcessed = [
      { id: 'all', name: 'All', color: '#4A9B4E', createdAt: new Date() },
      ...dbUsers.map(user => ({
        id: user.id,
        name: user.name,
        color: userColors[user.name] || '#8D5524',
        createdAt: user.createdAt
      }))
    ]

    // Transform todos
    const transformedTodos = dbTodos.map(todo => ({
      id: todo.id,
      title: todo.title,
      category: todo.category,
      owner: todo.owner,
      priority: todo.priority,
      status: todo.status,
      dueDate: todo.dueDate,
      completed: todo.completed,
      notes: todo.notes || undefined,
      subtasks: subtasksByTodoId[todo.id] || undefined,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt
    }))

    // Transform sales
    const transformedSales = dbSales.map(sale => ({
      id: sale.id,
      name: sale.name,
      productId: sale.productId || undefined,
      revenue: sale.revenue || undefined,
      selectedColor: sale.selectedColor || undefined,
      placementDate: sale.placementDate,
      deliveryMethod: sale.deliveryMethod,
      channelId: sale.channelId || undefined,
      status: sale.status,
      notes: sale.notes || undefined,
      subtasks: saleSubtasksBySaleId[sale.id] || undefined,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt
    }))

    // Return all data in structured format
    return NextResponse.json({
      todos: {
        todos: transformedTodos,
        categories: dbCategories,
        owners: dbOwnersProcessed
      },
      sales: {
        sales: transformedSales,
        collections: dbCollections,
        products: dbProducts,
        channels: dbSaleChannels
      },
      calendar: {
        events: dbEvents,
        calendarTypes: dbCalendarTypes,
        reminders: dbEventReminders
      },
      quickLinks: {
        quickLinks: dbQuickLinks
      }
    })
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard data:', error)
    return NextResponse.json({ 
      error: 'Failed to load dashboard data', 
      details: error 
    }, { status: 500 })
  }
}