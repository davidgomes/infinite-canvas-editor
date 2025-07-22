
import { db } from '../db';
import { userCursorsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const removeCursor = async (canvasId: number, userId: string): Promise<boolean> => {
  try {
    // Delete the cursor record for the specific user on the specific canvas
    const result = await db.delete(userCursorsTable)
      .where(
        and(
          eq(userCursorsTable.canvas_id, canvasId),
          eq(userCursorsTable.user_id, userId)
        )
      )
      .execute();

    // Return true if a record was deleted, false if no record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Cursor removal failed:', error);
    throw error;
  }
};
