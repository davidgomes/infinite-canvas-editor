
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCanvas = async (id: number): Promise<boolean> => {
  try {
    // Delete canvas by ID - shapes will be cascade deleted due to foreign key constraint
    const result = await db.delete(canvasesTable)
      .where(eq(canvasesTable.id, id))
      .execute();

    // Return true if a row was deleted, false if canvas didn't exist
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Canvas deletion failed:', error);
    throw error;
  }
};
