import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { todos, categories, owners, subtasks, users } from '@/lib/db/schema'
import { eq, desc, sql as drizzleSql } from 'drizzle-orm'
import type { Todo as StoreTodo, Subtask as StoreSubtask } from '@/lib/types'
import { createNotification } from '@/lib/notifications'
import {
  requireAuth,
  getDb,
  deleteByIds,
  readJsonFallback,
  writeJsonFallback,
  guardEmptyState,
} from '@/lib/api/helpers'

const EMPTY_STATE = { todos: [], categories: [], owners: [] }

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const session = auth

  try {
    if (!getDb()) {
      const data = await readJsonFallback('todos.json', EMPTY_STATE)
      return NextResponse.json(data)
    }

    // Fetch all users for the owner dropdown
    const dbUsers = await db!.select().from(users)
    
    // Create owner list from users with consistent colors
    const userColors: Record<string, string> = {
      'Dylan': '#F7901E',  // Orange
      'Thomas': '#01BAD5', // Blue
    }
    
    const dbOwners = [
      { id: 'all', name: 'All', color: '#4A9B4E', createdAt: new Date() },
      ...dbUsers.map(user => ({
        id: user.id,
        name: user.name,
        color: userColors[user.name] || '#8D5524',
        createdAt: user.createdAt
      }))
    ]
    
    // Fetch all todos (admin users can see all todos)
    const [dbTodos, dbCategories, dbSubtasks] = await Promise.all([
      db!.select().from(todos).orderBy(desc(todos.createdAt)),
      db!.select().from(categories),
      db!.select().from(subtasks)
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
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching data from database:', error)
    const data = await readJsonFallback('todos.json', EMPTY_STATE)
    return NextResponse.json(data)
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const session = auth

  try {
    const data = await request.json()

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    const hasAnyData = (data.todos?.length > 0) ||
                       (data.categories?.length > 0) ||
                       (data.owners?.length > 0)

    const blocked = await guardEmptyState(hasAnyData, async () => {
      const rows = await db!.select().from(todos).limit(1)
      return rows.length > 0
    })
    if (blocked) return blocked

    if (!getDb()) {
      await writeJsonFallback('todos.json', data)
      return NextResponse.json({ success: true })
    }

    // Use UPSERT pattern instead of DELETE-then-INSERT
    // This is much safer and prevents accidental data loss
    
    // Step 1: Get all existing IDs
    const [existingTodos, existingCategories, existingOwners, existingSubtasks] = await Promise.all([
      db!.select({ id: todos.id }).from(todos),
      db!.select({ id: categories.id }).from(categories),
      db!.select({ id: owners.id }).from(owners),
      db!.select({ id: subtasks.id }).from(subtasks)
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
    await deleteByIds(subtasks, subtasks.id, subtaskIdsToDelete)
    await deleteByIds(todos, todos.id, todoIdsToDelete)
    await deleteByIds(categories, categories.id, categoryIdsToDelete)
    await deleteByIds(owners, owners.id, ownerIdsToDelete)
    
    // Step 4: UPSERT categories in parallel batches
    if (data.categories && data.categories.length > 0) {
      const categoryPromises = []
      
      for (const category of data.categories) {
        if (existingCategoryIds.has(category.id)) {
          // Update existing
          categoryPromises.push(
            db!.update(categories)
              .set({
                name: category.name,
                color: category.color
              })
              .where(eq(categories.id, category.id))
          )
        } else {
          // Insert new - ensure createdAt is a proper Date object
          const categoryValues = {
            id: category.id,
            name: category.name,
            color: category.color,
            createdAt: category.createdAt ? new Date(category.createdAt) : new Date()
          }
          categoryPromises.push(
            db!.insert(categories).values(categoryValues)
          )
        }
      }
      
      await Promise.all(categoryPromises)
    }
    
    // Step 5: UPSERT owners in parallel batches
    if (data.owners && data.owners.length > 0) {
      const ownerPromises = []
      
      for (const owner of data.owners) {
        if (existingOwnerIds.has(owner.id)) {
          // Update existing
          ownerPromises.push(
            db!.update(owners)
              .set({
                name: owner.name,
                color: owner.color
              })
              .where(eq(owners.id, owner.id))
          )
        } else {
          // Insert new - ensure createdAt is a proper Date object
          const ownerValues = {
            id: owner.id,
            name: owner.name,
            color: owner.color,
            createdAt: owner.createdAt ? new Date(owner.createdAt) : new Date()
          }
          ownerPromises.push(
            db!.insert(owners).values(ownerValues)
          )
        }
      }
      
      await Promise.all(ownerPromises)
    }
    
    // Track changes for notifications
    const notificationTriggers: Array<{
      type: 'created' | 'assigned' | 'status_changed'
      todo: any
      previousStatus?: string
      previousOwner?: string
    }> = []

    // Get existing todos to track changes
    const existingTodosMap = new Map()
    if (existingTodoIds.size > 0) {
      const existingTodosData = await db!
        .select()
        .from(todos)
        .where(drizzleSql`${todos.id} IN (${drizzleSql.join(Array.from(existingTodoIds).map(id => drizzleSql`${id}`), drizzleSql`, `)})`)
      
      for (const todo of existingTodosData) {
        existingTodosMap.set(todo.id, todo)
      }
    }

    // Step 6: UPSERT todos and subtasks - process in batches for better performance
    if (data.todos && data.todos.length > 0) {
      // Process todos in smaller batches to avoid too many concurrent queries
      const BATCH_SIZE = 5
      for (let i = 0; i < data.todos.length; i += BATCH_SIZE) {
        const todoBatch = data.todos.slice(i, i + BATCH_SIZE)
        const todoPromises = []
        
        for (const todo of todoBatch) {
          const { subtasks: todoSubtasks, ...todoData } = todo
          
          const todoValues = {
            id: todoData.id,
            title: todoData.title,
            category: todoData.category,
            owner: todoData.owner,
            userId: session.user.id, // Associate with current user
            priority: todoData.priority,
            status: todoData.status,
            dueDate: todoData.dueDate ? new Date(todoData.dueDate) : null,
            completed: todoData.completed,
            notes: todoData.notes || null,
            createdAt: new Date(todoData.createdAt),
            updatedAt: new Date(todoData.updatedAt)
          }
          
          // Track changes for notifications
          if (existingTodoIds.has(todo.id)) {
            const existingTodo = existingTodosMap.get(todo.id)
            if (existingTodo) {
              // Check for status change
              if (existingTodo.status !== todoData.status) {
                notificationTriggers.push({
                  type: 'status_changed',
                  todo: todoData,
                  previousStatus: existingTodo.status
                })
              }
              // Check for owner change (assignment)
              if (existingTodo.owner !== todoData.owner) {
                notificationTriggers.push({
                  type: 'assigned',
                  todo: todoData,
                  previousOwner: existingTodo.owner
                })
              }
            }
          } else {
            // New todo created
            notificationTriggers.push({
              type: 'created',
              todo: todoData
            })
          }
          
          // Create promise for todo upsert
          const todoPromise = existingTodoIds.has(todo.id)
            ? db!.update(todos)
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
            : db!.insert(todos).values(todoValues)
          
          todoPromises.push(todoPromise)
          
          // Handle subtasks for this todo
          if (todoSubtasks && todoSubtasks.length > 0) {
            // First get existing subtasks (this needs to be sequential)
            const existingTodoSubtasks = await db!.select({ id: subtasks.id })
              .from(subtasks)
              .where(eq(subtasks.todoId, todo.id))
            const existingTodoSubtaskIds = new Set(existingTodoSubtasks.map(s => s.id))
            
            // Then create promises for all subtask operations
            const subtaskPromises = todoSubtasks.map((subtask: any) => {
              const subtaskValues = {
                id: subtask.id,
                todoId: todo.id,
                text: subtask.text,
                completed: subtask.completed
              }
              
              if (existingTodoSubtaskIds.has(subtask.id)) {
                // Update existing subtask
                return db!.update(subtasks)
                  .set({
                    text: subtaskValues.text,
                    completed: subtaskValues.completed
                  })
                  .where(eq(subtasks.id, subtask.id))
              } else {
                // Insert new subtask
                return db!.insert(subtasks).values(subtaskValues)
              }
            })
            
            todoPromises.push(...subtaskPromises)
          }
        }
        
        // Execute all operations for this batch in parallel
        await Promise.all(todoPromises)
      }
    }
    
    // Send notifications for tracked changes
    if (notificationTriggers.length > 0) {
      // Get all users for owner lookups
      const allUsers = await db!.select().from(users)
      const userMap = new Map(allUsers.map(u => [u.name, u]))
      const userIdMap = new Map(allUsers.map(u => [u.id, u]))
      
      // Get the current user's name for attribution
      const currentUserName = session.user?.name || 'Someone'
      
      // Process notifications asynchronously (don't wait)
      Promise.all(notificationTriggers.map(async (trigger) => {
        try {
          // Determine who should receive notifications
          const recipientUsers: string[] = []
          let notificationMessage = ''
          let notificationTitle = ''
          
          // Determine recipients based on task owner
          if (trigger.todo.owner === 'All') {
            // Task assigned to "All" - notify everyone
            recipientUsers.push(...allUsers.map(u => u.id))
          } else if (trigger.todo.owner) {
            // Task assigned to specific person
            const targetUser = userMap.get(trigger.todo.owner)
            if (targetUser) {
              recipientUsers.push(targetUser.id)
            }
          }
          
          // Build notification message with user attribution
          const statusMap: Record<string, string> = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'dead': 'Dead'
          }
          
          if (trigger.type === 'created') {
            notificationTitle = '➕ New Task'
            if (trigger.todo.owner === 'All') {
              notificationMessage = `${currentUserName} created a new task: "${trigger.todo.title}"`
            } else if (trigger.todo.owner === currentUserName) {
              notificationMessage = `${currentUserName} created a new task for themselves: "${trigger.todo.title}"`
            } else {
              notificationMessage = `${currentUserName} created a new task and assigned it to you: "${trigger.todo.title}"`
            }
          } else if (trigger.type === 'assigned') {
            notificationTitle = '👤 Task Reassigned'
            if (trigger.todo.owner === 'All') {
              notificationMessage = `${currentUserName} assigned "${trigger.todo.title}" to everyone`
            } else if (trigger.todo.owner === currentUserName) {
              notificationMessage = `${currentUserName} assigned "${trigger.todo.title}" to themselves`
            } else {
              notificationMessage = `${currentUserName} assigned "${trigger.todo.title}" to you`
            }
          } else if (trigger.type === 'status_changed') {
            const newStatus = statusMap[trigger.todo.status] || trigger.todo.status
            notificationTitle = '✅ Status Changed'
            notificationMessage = `${currentUserName} marked "${trigger.todo.title}" as ${newStatus}`
            
            // If task is marked as completed or dead, notify EVERYONE
            if (trigger.todo.status === 'completed' || trigger.todo.status === 'dead') {
              // Clear existing recipients and add all users
              recipientUsers.length = 0
              recipientUsers.push(...allUsers.map(u => u.id))
            }
          }
          
          // Send notification to all recipients
          for (const userId of recipientUsers) {
            // NEVER send self-notifications - always exclude the person making the change
            // This prevents Dylan from getting notifications for his own changes
            if (userId !== session.user.id) {
              await createNotification({
                userId: userId,
                type: trigger.type === 'created' ? 'task_created' : 
                      trigger.type === 'assigned' ? 'task_assigned' : 'status_changed',
                title: notificationTitle,
                message: notificationMessage,
                relatedId: trigger.todo.id,
                metadata: {
                  todoTitle: trigger.todo.title,
                  category: trigger.todo.category,
                  priority: trigger.todo.priority,
                  dueDate: trigger.todo.dueDate,
                  previousStatus: trigger.previousStatus,
                  previousOwner: trigger.previousOwner,
                  actionBy: currentUserName
                }
              })
            }
          }
        } catch (error) {
          console.error('Error sending notification:', error)
          // Don't fail the request if notification fails
        }
      })).catch(error => {
        console.error('Error processing notifications:', error)
      })
    }
    
    return NextResponse.json({ success: true, method: 'upsert' })
  } catch (error) {
    console.error('Error saving data to database:', error)
    return NextResponse.json({ error: 'Failed to save data', details: error }, { status: 500 })
  }
}