
import { z } from 'zod';

// Shape type enum
export const shapeTypeSchema = z.enum(['rectangle', 'square', 'triangle']);
export type ShapeType = z.infer<typeof shapeTypeSchema>;

// Canvas schema
export const canvasSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Canvas = z.infer<typeof canvasSchema>;

// Shape schema
export const shapeSchema = z.object({
  id: z.number(),
  canvas_id: z.number(),
  type: shapeTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
  z_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Shape = z.infer<typeof shapeSchema>;

// User cursor schema for real-time collaboration
export const userCursorSchema = z.object({
  id: z.number(),
  canvas_id: z.number(),
  user_id: z.string(),
  user_name: z.string(),
  x: z.number(),
  y: z.number(),
  updated_at: z.coerce.date()
});
export type UserCursor = z.infer<typeof userCursorSchema>;

// Input schemas for creating canvases
export const createCanvasInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});
export type CreateCanvasInput = z.infer<typeof createCanvasInputSchema>;

// Input schemas for updating canvases
export const updateCanvasInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});
export type UpdateCanvasInput = z.infer<typeof updateCanvasInputSchema>;

// Input schemas for creating shapes
export const createShapeInputSchema = z.object({
  canvas_id: z.number(),
  type: shapeTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  z_index: z.number().int().optional()
});
export type CreateShapeInput = z.infer<typeof createShapeInputSchema>;

// Input schemas for updating shapes
export const updateShapeInputSchema = z.object({
  id: z.number(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  z_index: z.number().int().optional()
});
export type UpdateShapeInput = z.infer<typeof updateShapeInputSchema>;

// Input schemas for user cursor updates
export const updateCursorInputSchema = z.object({
  canvas_id: z.number(),
  user_id: z.string(),
  user_name: z.string(),
  x: z.number(),
  y: z.number()
});
export type UpdateCursorInput = z.infer<typeof updateCursorInputSchema>;

// Canvas with shapes schema for full canvas data
export const canvasWithShapesSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  shapes: z.array(shapeSchema)
});
export type CanvasWithShapes = z.infer<typeof canvasWithShapesSchema>;
