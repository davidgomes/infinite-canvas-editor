
import { db } from '../db';
import { shapesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteShape = async (id: number): Promise<boolean> => {
  try {
    // Delete the shape by id
    const result = await db.delete(shapesTable)
      .where(eq(shapesTable.id, id))
      .execute();

    // Check if any rows were affected (shape existed and was deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Shape deletion failed:', error);
    throw error;
  }
};
