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

// Type exports for TypeScript
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Owner = typeof owners.$inferSelect
export type NewOwner = typeof owners.$inferInsert
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type Subtask = typeof subtasks.$inferSelect
export type NewSubtask = typeof subtasks.$inferInsert