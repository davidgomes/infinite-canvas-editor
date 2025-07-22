
import { db } from '../db';
import { userCursorsTable } from '../db/schema';
import { type UserCursor } from '../schema';
import { eq, gte } from 'drizzle-orm';

export const getCursors = async (canvasId: number): Promise<UserCursor[]> => {
  try {
    // Get cursors updated within last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    
    const results = await db.select()
      .from(userCursorsTable)
      .where(
        eq(userCursorsTable.canvas_id, canvasId)
      )
      .execute();

    // Filter by recent updates and convert numeric fields
    return results
      .filter(cursor => cursor.updated_at >= thirtySecondsAgo)
      .map(cursor => ({
        ...cursor,
        x: parseFloat(cursor.x),
        y: parseFloat(cursor.y)
      }));
  } catch (error) {
    console.error('Failed to get cursors:', error);
    throw error;
  }
};
