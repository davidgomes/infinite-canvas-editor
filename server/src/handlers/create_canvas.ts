
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { type CreateCanvasInput, type Canvas } from '../schema';

export const createCanvas = async (input: CreateCanvasInput): Promise<Canvas> => {
  try {
    // Insert canvas record
    const result = await db.insert(canvasesTable)
      .values({
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    const canvas = result[0];
    return {
      id: canvas.id,
      name: canvas.name,
      description: canvas.description,
      created_at: canvas.created_at,
      updated_at: canvas.updated_at
    };
  } catch (error) {
    console.error('Canvas creation failed:', error);
    throw error;
  }
};
