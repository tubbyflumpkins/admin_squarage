import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { todos, users } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    // Verify this is a legitimate cron request
    // In production, you'd verify a secret token here
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date (start and end of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find all todos due today that are not completed
    const todosDueToday = await db
      .select()
      .from(todos)
      .where(and(
        gte(todos.dueDate, today),
        lte(todos.dueDate, tomorrow),
        eq(todos.completed, false),
        eq(todos.status, 'not_started')
      ))

    if (todosDueToday.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No todos due today' 
      })
    }

    // Group todos by owner
    const todosByOwner = new Map<string, typeof todosDueToday>()
    
    for (const todo of todosDueToday) {
      if (todo.owner && todo.owner !== 'All') {
        if (!todosByOwner.has(todo.owner)) {
          todosByOwner.set(todo.owner, [])
        }
        todosByOwner.get(todo.owner)!.push(todo)
      }
    }

    // Get all users
    const allUsers = await db.select().from(users)
    const userMap = new Map(allUsers.map(u => [u.name, u]))

    // Send notifications to each owner
    const notifications = []
    for (const [ownerName, ownerTodos] of todosByOwner) {
      const user = userMap.get(ownerName)
      if (!user) continue

      const taskCount = ownerTodos.length
      const taskList = ownerTodos
        .slice(0, 5) // Show max 5 tasks in notification
        .map(t => `• ${t.title}`)
        .join('\n')
      
      const message = taskCount === 1 
        ? `You have 1 task due today:\n${taskList}`
        : `You have ${taskCount} tasks due today:\n${taskList}${taskCount > 5 ? `\n...and ${taskCount - 5} more` : ''}`

      notifications.push(
        createNotification({
          userId: user.id,
          type: 'task_due',
          title: '⏰ Tasks Due Today',
          message,
          metadata: {
            taskCount,
            tasks: ownerTodos.map(t => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              category: t.category
            }))
          }
        })
      )
    }

    // Send all notifications
    const results = await Promise.allSettled(notifications)
    const successCount = results.filter(r => r.status === 'fulfilled').length

    return NextResponse.json({ 
      success: true,
      message: `Sent ${successCount} daily reminder notifications`,
      stats: {
        todosDueToday: todosDueToday.length,
        owners: todosByOwner.size,
        notificationsSent: successCount
      }
    })
  } catch (error) {
    console.error('Error sending daily reminders:', error)
    return NextResponse.json({ 
      error: 'Failed to send daily reminders' 
    }, { status: 500 })
  }
}

// Also support GET for easy testing
export async function GET(request: Request) {
  // In production, you might want to disable this or add authentication
  return POST(request)
}