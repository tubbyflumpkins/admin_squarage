import { NextResponse } from 'next/server'
import { db, isDatabaseConfigured } from '@/lib/db'
import { todos, categories, owners, subtasks } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Todo as StoreTodo, Subtask as StoreSubtask } from '@/lib/types'

// Fallback to JSON file if database is not configured
async function fallbackToJsonFile() {
  const fs = await import('fs/promises')
  const path = await import('path')
  const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json')
  
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {
      todos: [],
      categories: [],
      owners: []
    }
  }
}

export async function GET() {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, falling back to JSON file')
      const data = await fallbackToJsonFile()
      return NextResponse.json(data)
    }

    // Fetch all data from database
    const [dbTodos, dbCategories, dbOwners, dbSubtasks] = await Promise.all([
      db.select().from(todos).orderBy(desc(todos.createdAt)),
      db.select().from(categories),
      db.select().from(owners),
      db.select().from(subtasks)
    ])

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
    }, {} as Record<string, StoreSubtask[]>)

    // Transform todos to include subtasks
    const transformedTodos: StoreTodo[] = dbTodos.map(todo => ({
      id: todo.id,
      title: todo.title,
      category: todo.category,
      owner: todo.owner,
      priority: todo.priority as 'low' | 'medium' | 'high',
      status: todo.status as StoreTodo['status'],
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
      completed: todo.completed,
      notes: todo.notes || undefined,
      subtasks: subtasksByTodoId[todo.id] || undefined,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt
    }))

    const response = {
      todos: transformedTodos,
      categories: dbCategories,
      owners: dbOwners
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching data from database:', error)
    // Fallback to JSON file on error
    const data = await fallbackToJsonFile()
    return NextResponse.json(data)
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, falling back to JSON file')
      // Fall back to file system
      const fs = await import('fs/promises')
      const path = await import('path')
      const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json')
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
      return NextResponse.json({ success: true })
    }

    // Start a transaction to update all data
    await db.transaction(async (tx) => {
      // Clear existing data
      await tx.delete(subtasks)
      await tx.delete(todos)
      await tx.delete(categories)
      await tx.delete(owners)

      // Insert categories
      if (data.categories && data.categories.length > 0) {
        await tx.insert(categories).values(data.categories)
      }

      // Insert owners
      if (data.owners && data.owners.length > 0) {
        await tx.insert(owners).values(data.owners)
      }

      // Insert todos and subtasks
      if (data.todos && data.todos.length > 0) {
        for (const todo of data.todos) {
          const { subtasks: todoSubtasks, ...todoData } = todo
          
          // Insert todo
          await tx.insert(todos).values({
            id: todoData.id,
            title: todoData.title,
            category: todoData.category,
            owner: todoData.owner,
            priority: todoData.priority,
            status: todoData.status,
            dueDate: todoData.dueDate ? new Date(todoData.dueDate) : null,
            completed: todoData.completed,
            notes: todoData.notes || null,
            createdAt: new Date(todoData.createdAt),
            updatedAt: new Date(todoData.updatedAt)
          })

          // Insert subtasks if they exist
          if (todoSubtasks && todoSubtasks.length > 0) {
            await tx.insert(subtasks).values(
              todoSubtasks.map(subtask => ({
                id: subtask.id,
                todoId: todo.id,
                text: subtask.text,
                completed: subtask.completed
              }))
            )
          }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving data to database:', error)
    return NextResponse.json({ error: 'Failed to save data', details: error }, { status: 500 })
  }
}