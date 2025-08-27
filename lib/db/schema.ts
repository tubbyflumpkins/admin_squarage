import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
}))

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

// Collections table
export const collections = pgTable('collections', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Default hex color
  availableColors: jsonb('available_colors').$type<string[]>().default([]).notNull(), // Available colors for this collection
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

// Sales table
export const sales = pgTable('sales', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(), // Customer/order name (renamed from 'order')
  productId: varchar('product_id', { length: 255 }).references(() => products.id, { onDelete: 'set null' }),
  revenue: integer('revenue'), // Custom revenue for this sale (in cents, can override product default)
  selectedColor: varchar('selected_color', { length: 7 }), // Selected color from collection's available colors
  placementDate: timestamp('placement_date').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 20 }).notNull(), // 'shipping' or 'local'
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

// Define collections relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(products),
}))

// Define products relations
export const productsRelations = relations(products, ({ one, many }) => ({
  collection: one(collections, {
    fields: [products.collectionId],
    references: [collections.id],
  }),
  sales: many(sales),
}))

// Define sales relations
export const salesRelations = relations(sales, ({ one, many }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
  subtasks: many(saleSubtasks),
}))

export const saleSubtasksRelations = relations(saleSubtasks, ({ one }) => ({
  sale: one(sales, {
    fields: [saleSubtasks.saleId],
    references: [sales.id],
  }),
}))

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

// Define calendar relations
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

// Type exports for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Owner = typeof owners.$inferSelect
export type NewOwner = typeof owners.$inferInsert
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
export type SaleSubtask = typeof saleSubtasks.$inferSelect
export type NewSaleSubtask = typeof saleSubtasks.$inferInsert
export type CalendarType = typeof calendarTypes.$inferSelect
export type NewCalendarType = typeof calendarTypes.$inferInsert
export type CalendarEvent = typeof calendarEvents.$inferSelect
export type NewCalendarEvent = typeof calendarEvents.$inferInsert
export type EventReminder = typeof eventReminders.$inferSelect
export type NewEventReminder = typeof eventReminders.$inferInsert