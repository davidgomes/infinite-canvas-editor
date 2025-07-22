
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, userCursorsTable } from '../db/schema';
import { removeCursor } from '../handlers/remove_cursor';
import { eq, and } from 'drizzle-orm';

describe('removeCursor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove existing cursor and return true', async () => {
    // Create a canvas first
    const canvas = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'Canvas for cursor tests'
      })
      .returning()
      .execute();

    const canvasId = canvas[0].id;

    // Create a cursor for the canvas
    await db.insert(userCursorsTable)
      .values({
        canvas_id: canvasId,
        user_id: 'user123',
        user_name: 'Test User',
        x: '10.5',
        y: '20.75'
      })
      .execute();

    // Remove the cursor
    const result = await removeCursor(canvasId, 'user123');

    expect(result).toBe(true);

    // Verify cursor was removed from database
    const cursors = await db.select()
      .from(userCursorsTable)
      .where(
        and(
          eq(userCursorsTable.canvas_id, canvasId),
          eq(userCursorsTable.user_id, 'user123')
        )
      )
      .execute();

    expect(cursors).toHaveLength(0);
  });

  it('should return false when cursor does not exist', async () => {
    // Create a canvas first
    const canvas = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'Canvas for cursor tests'
      })
      .returning()
      .execute();

    const canvasId = canvas[0].id;

    // Try to remove non-existent cursor
    const result = await removeCursor(canvasId, 'nonexistent_user');

    expect(result).toBe(false);
  });

  it('should only remove cursor for specific user and canvas', async () => {
    // Create two canvases
    const canvas1 = await db.insert(canvasesTable)
      .values({
        name: 'Canvas 1',
        description: 'First canvas'
      })
      .returning()
      .execute();

    const canvas2 = await db.insert(canvasesTable)
      .values({
        name: 'Canvas 2',
        description: 'Second canvas'
      })
      .returning()
      .execute();

    const canvasId1 = canvas1[0].id;
    const canvasId2 = canvas2[0].id;

    // Create cursors for same user on different canvases
    await db.insert(userCursorsTable)
      .values([
        {
          canvas_id: canvasId1,
          user_id: 'user123',
          user_name: 'Test User',
          x: '10.0',
          y: '20.0'
        },
        {
          canvas_id: canvasId2,
          user_id: 'user123',
          user_name: 'Test User',
          x: '30.0',
          y: '40.0'
        },
        {
          canvas_id: canvasId1,
          user_id: 'user456',
          user_name: 'Other User',
          x: '50.0',
          y: '60.0'
        }
      ])
      .execute();

    // Remove cursor for user123 on canvas1 only
    const result = await removeCursor(canvasId1, 'user123');

    expect(result).toBe(true);

    // Verify only the specific cursor was removed
    const remainingCursors = await db.select()
      .from(userCursorsTable)
      .execute();

    expect(remainingCursors).toHaveLength(2);

    // Verify user123's cursor on canvas2 still exists
    const user123Canvas2 = remainingCursors.find(
      c => c.canvas_id === canvasId2 && c.user_id === 'user123'
    );
    expect(user123Canvas2).toBeDefined();

    // Verify user456's cursor on canvas1 still exists
    const user456Canvas1 = remainingCursors.find(
      c => c.canvas_id === canvasId1 && c.user_id === 'user456'
    );
    expect(user456Canvas1).toBeDefined();
  });

  it('should return false for non-existent canvas', async () => {
    const result = await removeCursor(99999, 'user123');
    expect(result).toBe(false);
  });
});
