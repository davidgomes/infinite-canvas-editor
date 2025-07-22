
import { db } from '../db';
import { shapesTable } from '../db/schema';
import { type Shape } from '../schema';
import { eq } from 'drizzle-orm';

export const getShapes = async (canvasId: number): Promise<Shape[]> => {
  try {
    // Query shapes for the specified canvas
    const results = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.canvas_id, canvasId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(shape => ({
      ...shape,
      x: parseFloat(shape.x),
      y: parseFloat(shape.y),
      width: parseFloat(shape.width),
      height: parseFloat(shape.height)
    }));
  } catch (error) {
    console.error('Get shapes failed:', error);
    throw error;
  }
};
