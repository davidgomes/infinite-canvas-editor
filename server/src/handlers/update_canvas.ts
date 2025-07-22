
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { type UpdateCanvasInput, type Canvas } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCanvas = async (input: UpdateCanvasInput): Promise<Canvas | null> => {
  try {
    // Check if canvas exists
    const existingCanvas = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, input.id))
      .execute();

    if (existingCanvas.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof canvasesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Update canvas record
    const result = await db.update(canvasesTable)
      .set(updateData)
      .where(eq(canvasesTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Canvas update failed:', error);
    throw error;
  }
};
