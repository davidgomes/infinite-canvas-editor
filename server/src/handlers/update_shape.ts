
import { db } from '../db';
import { shapesTable } from '../db/schema';
import { type UpdateShapeInput, type Shape } from '../schema';
import { eq } from 'drizzle-orm';

export const updateShape = async (input: UpdateShapeInput): Promise<Shape | null> => {
  try {
    // Build the update object only with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.x !== undefined) {
      updateData['x'] = input.x.toString();
    }
    if (input.y !== undefined) {
      updateData['y'] = input.y.toString();
    }
    if (input.width !== undefined) {
      updateData['width'] = input.width.toString();
    }
    if (input.height !== undefined) {
      updateData['height'] = input.height.toString();
    }
    if (input.color !== undefined) {
      updateData['color'] = input.color;
    }
    if (input.z_index !== undefined) {
      updateData['z_index'] = input.z_index;
    }

    // Update the shape
    const result = await db.update(shapesTable)
      .set(updateData)
      .where(eq(shapesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const shape = result[0];
    return {
      ...shape,
      x: parseFloat(shape.x),
      y: parseFloat(shape.y),
      width: parseFloat(shape.width),
      height: parseFloat(shape.height)
    };
  } catch (error) {
    console.error('Shape update failed:', error);
    throw error;
  }
};
