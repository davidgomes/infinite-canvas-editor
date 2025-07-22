
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { type CanvasWithShapes } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getCanvas = async (id: number): Promise<CanvasWithShapes | null> => {
  try {
    // First get the canvas
    const canvasResults = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, id))
      .execute();

    if (canvasResults.length === 0) {
      return null;
    }

    const canvas = canvasResults[0];

    // Then get all shapes for this canvas, ordered by z_index
    const shapeResults = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.canvas_id, id))
      .orderBy(asc(shapesTable.z_index))
      .execute();

    // Convert numeric fields back to numbers for shapes
    const shapes = shapeResults.map(shape => ({
      ...shape,
      x: parseFloat(shape.x),
      y: parseFloat(shape.y),
      width: parseFloat(shape.width),
      height: parseFloat(shape.height)
    }));

    // Return the canvas with its shapes
    return {
      ...canvas,
      shapes
    };
  } catch (error) {
    console.error('Canvas retrieval failed:', error);
    throw error;
  }
};
