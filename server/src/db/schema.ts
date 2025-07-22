
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Shape type enum
export const shapeTypeEnum = pgEnum('shape_type', ['rectangle', 'square', 'triangle']);

// Canvases table
export const canvasesTable = pgTable('canvases', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Shapes table
export const shapesTable = pgTable('shapes', {
  id: serial('id').primaryKey(),
  canvas_id: integer('canvas_id').notNull().references(() => canvasesTable.id, { onDelete: 'cascade' }),
  type: shapeTypeEnum('type').notNull(),
  x: numeric('x', { precision: 10, scale: 2 }).notNull(),
  y: numeric('y', { precision: 10, scale: 2 }).notNull(),
  width: numeric('width', { precision: 10, scale: 2 }).notNull(),
  height: numeric('height', { precision: 10, scale: 2 }).notNull(),
  color: text('color').notNull(),
  z_index: integer('z_index').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// User cursors table for real-time collaboration
export const userCursorsTable = pgTable('user_cursors', {
  id: serial('id').primaryKey(),
  canvas_id: integer('canvas_id').notNull().references(() => canvasesTable.id, { onDelete: 'cascade' }),
  user_id: text('user_id').notNull(),
  user_name: text('user_name').notNull(),
  x: numeric('x', { precision: 10, scale: 2 }).notNull(),
  y: numeric('y', { precision: 10, scale: 2 }).notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const canvasesRelations = relations(canvasesTable, ({ many }) => ({
  shapes: many(shapesTable),
  cursors: many(userCursorsTable)
}));

export const shapesRelations = relations(shapesTable, ({ one }) => ({
  canvas: one(canvasesTable, {
    fields: [shapesTable.canvas_id],
    references: [canvasesTable.id]
  })
}));

export const userCursorsRelations = relations(userCursorsTable, ({ one }) => ({
  canvas: one(canvasesTable, {
    fields: [userCursorsTable.canvas_id],
    references: [canvasesTable.id]
  })
}));

// TypeScript types for the table schemas
export type Canvas = typeof canvasesTable.$inferSelect;
export type NewCanvas = typeof canvasesTable.$inferInsert;
export type Shape = typeof shapesTable.$inferSelect;
export type NewShape = typeof shapesTable.$inferInsert;
export type UserCursor = typeof userCursorsTable.$inferSelect;
export type NewUserCursor = typeof userCursorsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  canvases: canvasesTable, 
  shapes: shapesTable, 
  userCursors: userCursorsTable 
};
