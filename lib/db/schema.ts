import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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
export const todosRelations = relations(todos, ({ many }) => ({
  subtasks: many(subtasks),
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
  color: varchar('color', { length: 7 }).notNull(), // Hex color
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

// Type exports for TypeScript
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