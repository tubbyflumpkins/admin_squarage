import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { CollectionColor } from '../salesTypes'

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // bcrypt hashed
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Categories table
export const categories = pgTable('categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Owners table
export const owners = pgTable('owners', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Todos table
export const todos = pgTable('todos', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: text('title').notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'cascade' }), // Link to user who created it
  priority: varchar('priority', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  dueDate: timestamp('due_date'),
  completed: boolean('completed').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// Subtasks table
export const subtasks = pgTable('subtasks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  todoId: varchar('todo_id', { length: 255 }).notNull().references(() => todos.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Expense categories table
export const expenseCategories = pgTable('expense_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Expense paid-by table
export const expensePaidBy = pgTable('expense_paid_by', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Expenses table
export const expenses = pgTable('expenses', {
  id: varchar('id', { length: 255 }).primaryKey(),
  paidBy: varchar('paid_by', { length: 255 }).notNull(),
  name: text('name').notNull(),
  vendor: text('vendor').notNull().default(''),
  costCents: integer('cost_cents').notNull(),
  date: timestamp('date'),
  category: varchar('category', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})


// Collections table
export const collections = pgTable('collections', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Default hex color
  availableColors: jsonb('available_colors').$type<CollectionColor[]>().default([]).notNull(), // Available colors for this collection
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Products table
export const products = pgTable('products', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  revenue: integer('revenue').notNull(), // Store in cents to avoid decimal issues
  collectionId: varchar('collection_id', { length: 255 }).notNull().references(() => collections.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Sales channel options table
export const saleChannels = pgTable('sale_channels', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Sales table
export const sales = pgTable('sales', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(), // Customer/order name (renamed from 'order')
  productId: varchar('product_id', { length: 255 }).references(() => products.id, { onDelete: 'set null' }),
  revenue: integer('revenue'), // Custom revenue for this sale (in cents, can override product default)
  selectedColor: varchar('selected_color', { length: 7 }), // Selected color from collection's available colors
  placementDate: timestamp('placement_date').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 20 }).notNull(), // 'shipping' or 'local'
  channelId: varchar('channel_id', { length: 255 }).references(() => saleChannels.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull(), // 'not_started', 'in_progress', 'fulfilled', 'dead'
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

// Sale subtasks table
export const saleSubtasks = pgTable('sale_subtasks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  saleId: varchar('sale_id', { length: 255 }).notNull().references(() => sales.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


// Calendar Types table
export const calendarTypes = pgTable('calendar_types', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Calendar Events table
export const calendarEvents = pgTable('calendar_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  calendarTypeId: varchar('calendar_type_id', { length: 255 }).references(() => calendarTypes.id, { onDelete: 'set null' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  allDay: boolean('all_day').default(false).notNull(),
  recurringPattern: varchar('recurring_pattern', { length: 50 }), // 'none', 'daily', 'weekly', 'monthly', 'yearly'
  recurringEndDate: timestamp('recurring_end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Event Reminders table
export const eventReminders = pgTable('event_reminders', {
  id: varchar('id', { length: 255 }).primaryKey(),
  eventId: varchar('event_id', { length: 255 }).notNull().references(() => calendarEvents.id, { onDelete: 'cascade' }),
  minutesBefore: integer('minutes_before').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


// Quick Links table
export const quickLinks = pgTable('quick_links', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  faviconUrl: text('favicon_url'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Email Subscribers table
export const emailSubscribers = pgTable('email_subscribers', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  source: varchar('source', { length: 50 }).default('popup').notNull(),
  discountCode: varchar('discount_code', { length: 50 }),
  consentMarketing: boolean('consent_marketing').default(false).notNull(),
  consentTimestamp: timestamp('consent_timestamp'),
  ipAddress: varchar('ip_address', { length: 45 }), // Support IPv4 and IPv6
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Notifications table
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'task_created', 'task_assigned', 'task_due', 'status_changed'
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedId: varchar('related_id', { length: 255 }), // todoId for task notifications
  metadata: jsonb('metadata').$type<Record<string, any>>(), // additional data
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Push Subscriptions table
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used').defaultNow().notNull(),
})

// Notification Preferences table
export const notificationPreferences = pgTable('notification_preferences', {
  userId: varchar('user_id', { length: 255 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  emailEnabled: boolean('email_enabled').default(false).notNull(),
  taskCreated: boolean('task_created').default(true).notNull(),
  taskAssigned: boolean('task_assigned').default(true).notNull(),
  taskDue: boolean('task_due').default(true).notNull(),
  statusChanged: boolean('status_changed').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============= RELATIONS DEFINITIONS (must come after all table definitions) =============

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  todos: many(todos),
  notifications: many(notifications),
  pushSubscriptions: many(pushSubscriptions),
  notificationPreferences: one(notificationPreferences),
}))

// Todo relations
export const todosRelations = relations(todos, ({ many, one }) => ({
  subtasks: many(subtasks),
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}))

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  todo: one(todos, {
    fields: [subtasks.todoId],
    references: [todos.id],
  }),
}))

// Collection relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  collection: one(collections, {
    fields: [products.collectionId],
    references: [collections.id],
  }),
  sales: many(sales),
}))

export const saleChannelsRelations = relations(saleChannels, ({ many }) => ({
  sales: many(sales),
}))

// Sales relations
export const salesRelations = relations(sales, ({ one, many }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
  channel: one(saleChannels, {
    fields: [sales.channelId],
    references: [saleChannels.id],
  }),
  subtasks: many(saleSubtasks),
}))

export const saleSubtasksRelations = relations(saleSubtasks, ({ one }) => ({
  sale: one(sales, {
    fields: [saleSubtasks.saleId],
    references: [sales.id],
  }),
}))

// Calendar relations
export const calendarTypesRelations = relations(calendarTypes, ({ many }) => ({
  events: many(calendarEvents),
}))

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  calendarType: one(calendarTypes, {
    fields: [calendarEvents.calendarTypeId],
    references: [calendarTypes.id],
  }),
  reminders: many(eventReminders),
}))

export const eventRemindersRelations = relations(eventReminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventReminders.eventId],
    references: [calendarEvents.id],
  }),
}))

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}))

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}))

// Type exports for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Owner = typeof owners.$inferSelect
export type NewOwner = typeof owners.$inferInsert
export type ExpenseCategory = typeof expenseCategories.$inferSelect
export type NewExpenseCategory = typeof expenseCategories.$inferInsert
export type ExpensePaidBy = typeof expensePaidBy.$inferSelect
export type NewExpensePaidBy = typeof expensePaidBy.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type Subtask = typeof subtasks.$inferSelect
export type NewSubtask = typeof subtasks.$inferInsert
export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type SaleChannel = typeof saleChannels.$inferSelect
export type NewSaleChannel = typeof saleChannels.$inferInsert
export type SaleSubtask = typeof saleSubtasks.$inferSelect
export type NewSaleSubtask = typeof saleSubtasks.$inferInsert
export type CalendarType = typeof calendarTypes.$inferSelect
export type NewCalendarType = typeof calendarTypes.$inferInsert
export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert
export type EventReminder = typeof eventReminders.$inferSelect
export type NewEventReminder = typeof eventReminders.$inferInsert
export type QuickLink = typeof quickLinks.$inferSelect
export type NewQuickLink = typeof quickLinks.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
export type NotificationPreferences = typeof notificationPreferences.$inferSelect
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert
export type EmailSubscriber = typeof emailSubscribers.$inferSelect
export type NewEmailSubscriber = typeof emailSubscribers.$inferInsert

// Email Templates table
export const emailTemplates = pgTable('email_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content'),
  reactComponent: text('react_component'), // Stores the component name/type
  variables: jsonb('variables').$type<Record<string, any>>(), // Variable schema for template
  category: varchar('category', { length: 50 }).default('marketing').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Email Campaigns table
export const emailCampaigns = pgTable('email_campaigns', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  templateId: varchar('template_id', { length: 255 }).references(() => emailTemplates.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, scheduled, sending, sent, failed
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count').default(0).notNull(),
  segmentRules: jsonb('segment_rules').$type<Record<string, any>>(), // Segmentation criteria
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Email Sends table (log of all sent emails)
export const emailSends = pgTable('email_sends', {
  id: varchar('id', { length: 255 }).primaryKey(),
  campaignId: varchar('campaign_id', { length: 255 }).references(() => emailCampaigns.id, { onDelete: 'cascade' }),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  templateId: varchar('template_id', { length: 255 }).references(() => emailTemplates.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull(), // pending, sent, delivered, opened, clicked, bounced, failed
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  resendId: varchar('resend_id', { length: 255 }), // Resend's email ID for tracking
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Additional tracking data
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Email Queue table
export const emailQueue = pgTable('email_queue', {
  id: varchar('id', { length: 255 }).primaryKey(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  templateId: varchar('template_id', { length: 255 }).references(() => emailTemplates.id, { onDelete: 'cascade' }),
  variables: jsonb('variables').$type<Record<string, any>>(), // Template variables
  priority: integer('priority').default(5).notNull(), // 1-10, higher = more priority
  scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
  attempts: integer('attempts').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, processing, sent, failed
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
})

// Type exports for new email tables
export type EmailTemplate = typeof emailTemplates.$inferSelect
export type NewEmailTemplate = typeof emailTemplates.$inferInsert
export type EmailCampaign = typeof emailCampaigns.$inferSelect
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert
export type EmailSend = typeof emailSends.$inferSelect
export type NewEmailSend = typeof emailSends.$inferInsert
export type EmailQueue = typeof emailQueue.$inferSelect
export type NewEmailQueue = typeof emailQueue.$inferInsert
