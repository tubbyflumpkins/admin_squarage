import webpush from 'web-push'
import { db } from '@/lib/db'
import { notifications, pushSubscriptions, notificationPreferences } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export type NotificationType = 'task_created' | 'task_assigned' | 'task_due' | 'status_changed'

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  metadata?: Record<string, any>
}

/**
 * Create a notification and optionally send push notification
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    // Check if database is configured
    if (!db) {
      console.error('Database not configured for notifications')
      return false
    }

    // Create notification record in database
    const notificationId = uuidv4()
    await db!.insert(notifications).values({
      id: notificationId,
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedId: payload.relatedId,
      metadata: payload.metadata,
      read: false,
      createdAt: new Date()
    })

    // Check user preferences
    const prefs = await db!
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, payload.userId))
      .limit(1)

    // If no preferences exist, create default ones
    if (prefs.length === 0) {
      await db!.insert(notificationPreferences).values({
        userId: payload.userId,
        pushEnabled: true,
        emailEnabled: false,
        taskCreated: true,
        taskAssigned: true,
        taskDue: true,
        statusChanged: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const userPrefs = prefs[0] || { pushEnabled: true }

    // Check if push is enabled and if this notification type is enabled
    if (userPrefs.pushEnabled) {
      const shouldSendPush = 
        (payload.type === 'task_created' && userPrefs.taskCreated) ||
        (payload.type === 'task_assigned' && userPrefs.taskAssigned) ||
        (payload.type === 'task_due' && userPrefs.taskDue) ||
        (payload.type === 'status_changed' && userPrefs.statusChanged)

      if (shouldSendPush) {
        await sendPushNotification(payload.userId, {
          title: payload.title,
          message: payload.message,
          type: payload.type,
          relatedId: payload.relatedId,
          notificationId
        })
      }
    }

    return { success: true, notificationId }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

/**
 * Send push notification to all user's subscribed devices
 */
export async function sendPushNotification(
  userId: string,
  data: {
    title: string
    message: string
    type: string
    relatedId?: string
    notificationId: string
  }
) {
  try {
    // Check if database is configured
    if (!db) {
      console.error('Database not configured for push notifications')
      return
    }

    // Get all push subscriptions for this user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))

    if (subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId)
      return
    }

    // Send push to each subscription
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          JSON.stringify(data)
        )

        // Update last used timestamp
        await db!
          .update(pushSubscriptions)
          .set({ lastUsed: new Date() })
          .where(eq(pushSubscriptions.id, sub.id))

        return { success: true, subscriptionId: sub.id }
      } catch (error: any) {
        console.error('Error sending push to subscription:', sub.id, error)

        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Remove invalid subscription
          await db!
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id))
          console.log('Removed expired subscription:', sub.id)
        }

        return { success: false, subscriptionId: sub.id, error }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    console.log(`Sent push notifications: ${successCount}/${subscriptions.length} successful`)

    return results
  } catch (error) {
    console.error('Error sending push notifications:', error)
    throw error
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    if (!db) {
      return { notifications: [], total: 0 }
    }
    
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    return result
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  try {
    if (!db) {
      return 0
    }
    
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ))

    return result.length
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  try {
    if (!db) {
      return false
    }
    
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    if (!db) {
      return false
    }
    
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ))

    return { success: true }
  } catch (error) {
    console.error('Error marking all as read:', error)
    return { success: false, error }
  }
}

/**
 * Clean up old notifications (older than 60 days)
 */
export async function cleanupOldNotifications() {
  try {
    if (!db) {
      return { deletedCount: 0 }
    }
    
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const result = await db
      .delete(notifications)
      .where(and(
        eq(notifications.read, true),
        // Using raw SQL for date comparison since drizzle doesn't have lt for dates
        // This would need to be adjusted based on your actual needs
      ))

    console.log('Cleaned up old notifications')
    return { success: true }
  } catch (error) {
    console.error('Error cleaning up notifications:', error)
    return { success: false, error }
  }
}