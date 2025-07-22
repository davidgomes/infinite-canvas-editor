
import { db } from '../db';
import { userCursorsTable } from '../db/schema';
import { type UpdateCursorInput, type UserCursor } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCursor = async (input: UpdateCursorInput): Promise<UserCursor> => {
  try {
    // Check if cursor exists for this user on this canvas
    const existing = await db.select()
      .from(userCursorsTable)
      .where(
        and(
          eq(userCursorsTable.canvas_id, input.canvas_id),
          eq(userCursorsTable.user_id, input.user_id)
        )
      )
      .execute();

    let result;

    if (existing.length > 0) {
      // Update existing cursor
      const updateResult = await db.update(userCursorsTable)
        .set({
          user_name: input.user_name,
          x: input.x.toString(),
          y: input.y.toString(),
          updated_at: new Date()
        })
        .where(
          and(
            eq(userCursorsTable.canvas_id, input.canvas_id),
            eq(userCursorsTable.user_id, input.user_id)
          )
        )
        .returning()
        .execute();

      result = updateResult[0];
    } else {
      // Create new cursor
      const insertResult = await db.insert(userCursorsTable)
        .values({
          canvas_id: input.canvas_id,
          user_id: input.user_id,
          user_name: input.user_name,
          x: input.x.toString(),
          y: input.y.toString()
        })
        .returning()
        .execute();

      result = insertResult[0];
    }

    // Convert numeric fields back to numbers
    return {
      ...result,
      x: parseFloat(result.x),
      y: parseFloat(result.y)
    };
  } catch (error) {
    console.error('Cursor update failed:', error);
    throw error;
  }
};
