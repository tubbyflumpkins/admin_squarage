import { NextResponse } from 'next/server'
import { db, isDatabaseConfigured } from '@/lib/db'
import { todos, categories, owners, subtasks } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
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
    // Log environment info for debugging
    console.log('GET /api/todos/neon - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      IS_VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })
    
    // Check if database is configured
    if (!isDatabaseConfigured() || !db) {
      console.log('Database not configured, falling back to JSON file')
      const data = await fallbackToJsonFile()
      return NextResponse.json(data)
    }

    console.log('Database is configured, fetching data...')
    
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
      dueDate: todo.dueDate,
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
    
    console.log('Data fetched successfully:', {
      todos: transformedTodos.length,
      categories: dbCategories.length,
      owners: dbOwners.length
    })

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
    
    // CRITICAL VALIDATION: Never accept empty state that would delete all data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format received')
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Check if this would result in deleting all data
    const hasAnyData = (data.todos && data.todos.length > 0) || 
                       (data.categories && data.categories.length > 0) || 
                       (data.owners && data.owners.length > 0)
    
    if (!hasAnyData) {
      // Fetch current data to check if database has existing data
      if (isDatabaseConfigured() && db) {
        const [existingTodos] = await Promise.all([
          db.select().from(todos).limit(1)
        ])
        
        if (existingTodos.length > 0) {
          console.error('BLOCKED: Attempted to delete all data with empty state')
          return NextResponse.json({ 
            error: 'Cannot save empty state when database contains data', 
            blocked: true 
          }, { status: 400 })
        }
      }
    }
    
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

    // Use UPSERT pattern instead of DELETE-then-INSERT
    // This is much safer and prevents accidental data loss
    
    // Step 1: Get all existing IDs
    const [existingTodos, existingCategories, existingOwners, existingSubtasks] = await Promise.all([
      db.select({ id: todos.id }).from(todos),
      db.select({ id: categories.id }).from(categories),
      db.select({ id: owners.id }).from(owners),
      db.select({ id: subtasks.id }).from(subtasks)
    ])
    
    const existingTodoIds = new Set(existingTodos.map(t => t.id))
    const existingCategoryIds = new Set(existingCategories.map(c => c.id))
    const existingOwnerIds = new Set(existingOwners.map(o => o.id))
    const existingSubtaskIds = new Set(existingSubtasks.map(s => s.id))
    
    // Step 2: Prepare incoming data IDs
    const incomingTodoIds = new Set(data.todos?.map((t: any) => t.id) || [])
    const incomingCategoryIds = new Set(data.categories?.map((c: any) => c.id) || [])
    const incomingOwnerIds = new Set(data.owners?.map((o: any) => o.id) || [])
    const incomingSubtaskIds = new Set<string>()
    
    // Collect all subtask IDs
    if (data.todos) {
      for (const todo of data.todos) {
        if (todo.subtasks) {
          for (const subtask of todo.subtasks) {
            incomingSubtaskIds.add(subtask.id)
          }
        }
      }
    }
    
    // Step 3: Delete items that are no longer in the incoming data
    // This is safer because we only delete specific items, not everything
    const todoIdsToDelete = Array.from(existingTodoIds).filter(id => !incomingTodoIds.has(id))
    const categoryIdsToDelete = Array.from(existingCategoryIds).filter(id => !incomingCategoryIds.has(id))
    const ownerIdsToDelete = Array.from(existingOwnerIds).filter(id => !incomingOwnerIds.has(id))
    const subtaskIdsToDelete = Array.from(existingSubtaskIds).filter(id => !incomingSubtaskIds.has(id))
    
    // Delete removed items
    if (subtaskIdsToDelete.length > 0) {
      await db.delete(subtasks).where(
        drizzleSql`${subtasks.id} IN (${drizzleSql.join(subtaskIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (todoIdsToDelete.length > 0) {
      await db.delete(todos).where(
        drizzleSql`${todos.id} IN (${drizzleSql.join(todoIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (categoryIdsToDelete.length > 0) {
      await db.delete(categories).where(
        drizzleSql`${categories.id} IN (${drizzleSql.join(categoryIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    if (ownerIdsToDelete.length > 0) {
      await db.delete(owners).where(
        drizzleSql`${owners.id} IN (${drizzleSql.join(ownerIdsToDelete.map(id => drizzleSql`${id}`), drizzleSql`, `)})`
      )
    }
    
    // Step 4: UPSERT categories
    if (data.categories && data.categories.length > 0) {
      for (const category of data.categories) {
        if (existingCategoryIds.has(category.id)) {
          // Update existing
          await db.update(categories)
            .set({
              name: category.name,
              color: category.color
            })
            .where(eq(categories.id, category.id))
        } else {
          // Insert new
          await db.insert(categories).values(category)
        }
      }
    }
    
    // Step 5: UPSERT owners
    if (data.owners && data.owners.length > 0) {
      for (const owner of data.owners) {
        if (existingOwnerIds.has(owner.id)) {
          // Update existing
          await db.update(owners)
            .set({
              name: owner.name,
              color: owner.color
            })
            .where(eq(owners.id, owner.id))
        } else {
          // Insert new
          await db.insert(owners).values(owner)
        }
      }
    }
    
    // Step 6: UPSERT todos and subtasks
    if (data.todos && data.todos.length > 0) {
      for (const todo of data.todos) {
        const { subtasks: todoSubtasks, ...todoData } = todo
        
        const todoValues = {
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
        }
        
        if (existingTodoIds.has(todo.id)) {
          // Update existing todo
          await db.update(todos)
            .set({
              title: todoValues.title,
              category: todoValues.category,
              owner: todoValues.owner,
              priority: todoValues.priority,
              status: todoValues.status,
              dueDate: todoValues.dueDate,
              completed: todoValues.completed,
              notes: todoValues.notes,
              updatedAt: todoValues.updatedAt
            })
            .where(eq(todos.id, todo.id))
        } else {
          // Insert new todo
          await db.insert(todos).values(todoValues)
        }
        
        // Handle subtasks
        if (todoSubtasks && todoSubtasks.length > 0) {
          // Get existing subtasks for this todo
          const existingTodoSubtasks = await db.select({ id: subtasks.id })
            .from(subtasks)
            .where(eq(subtasks.todoId, todo.id))
          const existingTodoSubtaskIds = new Set(existingTodoSubtasks.map(s => s.id))
          
          for (const subtask of todoSubtasks) {
            const subtaskValues = {
              id: subtask.id,
              todoId: todo.id,
              text: subtask.text,
              completed: subtask.completed
            }
            
            if (existingTodoSubtaskIds.has(subtask.id)) {
              // Update existing subtask
              await db.update(subtasks)
                .set({
                  text: subtaskValues.text,
                  completed: subtaskValues.completed
                })
                .where(eq(subtasks.id, subtask.id))
            } else {
              // Insert new subtask
              await db.insert(subtasks).values(subtaskValues)
            }
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, method: 'upsert' })
  } catch (error) {
    console.error('Error saving data to database:', error)
    return NextResponse.json({ error: 'Failed to save data', details: error }, { status: 500 })
  }
}