
import { db } from '../db';
import { shapesTable, canvasesTable } from '../db/schema';
import { type CreateShapeInput, type Shape } from '../schema';
import { eq } from 'drizzle-orm';

export const createShape = async (input: CreateShapeInput): Promise<Shape> => {
  try {
    // Verify canvas exists first to prevent foreign key constraint violations
    const canvas = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, input.canvas_id))
      .execute();

    if (canvas.length === 0) {
      throw new Error(`Canvas with id ${input.canvas_id} not found`);
    }

    // Insert shape record
    const result = await db.insert(shapesTable)
      .values({
        canvas_id: input.canvas_id,
        type: input.type,
        x: input.x.toString(), // Convert number to string for numeric column
        y: input.y.toString(), // Convert number to string for numeric column
        width: input.width.toString(), // Convert number to string for numeric column
        height: input.height.toString(), // Convert number to string for numeric column
        color: input.color,
        z_index: input.z_index || 0 // Use default if not provided
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const shape = result[0];
    return {
      ...shape,
      x: parseFloat(shape.x), // Convert string back to number
      y: parseFloat(shape.y), // Convert string back to number
      width: parseFloat(shape.width), // Convert string back to number
      height: parseFloat(shape.height) // Convert string back to number
    };
  } catch (error) {
    // Only log if it's not an expected validation error
    if (!(error instanceof Error && error.message.includes('not found'))) {
      console.error('Shape creation failed:', error);
    }
    throw error;
  }
};
