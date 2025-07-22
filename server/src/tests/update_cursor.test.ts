
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, userCursorsTable } from '../db/schema';
import { type UpdateCursorInput } from '../schema';
import { updateCursor } from '../handlers/update_cursor';
import { eq, and } from 'drizzle-orm';

describe('updateCursor', () => {
  let testCanvasId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test canvas
    const canvas = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing cursors'
      })
      .returning()
      .execute();
    
    testCanvasId = canvas[0].id;
  });

  afterEach(resetDB);

  const testInput: UpdateCursorInput = {
    canvas_id: 0, // Will be set to testCanvasId in tests
    user_id: 'user123',
    user_name: 'Test User',
    x: 150.5,
    y: 200.75
  };

  it('should create a new cursor when none exists', async () => {
    const input = { ...testInput, canvas_id: testCanvasId };
    const result = await updateCursor(input);

    // Basic field validation
    expect(result.canvas_id).toEqual(testCanvasId);
    expect(result.user_id).toEqual('user123');
    expect(result.user_name).toEqual('Test User');
    expect(result.x).toEqual(150.5);
    expect(result.y).toEqual(200.75);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
  });

  it('should save cursor to database when creating new', async () => {
    const input = { ...testInput, canvas_id: testCanvasId };
    const result = await updateCursor(input);

    const cursors = await db.select()
      .from(userCursorsTable)
      .where(eq(userCursorsTable.id, result.id))
      .execute();

    expect(cursors).toHaveLength(1);
    expect(cursors[0].canvas_id).toEqual(testCanvasId);
    expect(cursors[0].user_id).toEqual('user123');
    expect(cursors[0].user_name).toEqual('Test User');
    expect(parseFloat(cursors[0].x)).toEqual(150.5);
    expect(parseFloat(cursors[0].y)).toEqual(200.75);
    expect(cursors[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update existing cursor when one exists', async () => {
    const input = { ...testInput, canvas_id: testCanvasId };
    
    // Create initial cursor
    const first = await updateCursor(input);
    
    // Update the same cursor with new position and name
    const updatedInput = {
      ...input,
      user_name: 'Updated User',
      x: 300.25,
      y: 400.75
    };
    
    const result = await updateCursor(updatedInput);

    // Should have same ID (update, not create)
    expect(result.id).toEqual(first.id);
    expect(result.canvas_id).toEqual(testCanvasId);
    expect(result.user_id).toEqual('user123');
    expect(result.user_name).toEqual('Updated User');
    expect(result.x).toEqual(300.25);
    expect(result.y).toEqual(400.75);
    expect(result.updated_at.getTime()).toBeGreaterThan(first.updated_at.getTime());
  });

  it('should maintain separate cursors for different users on same canvas', async () => {
    const user1Input = { ...testInput, canvas_id: testCanvasId };
    const user2Input = {
      ...testInput,
      canvas_id: testCanvasId,
      user_id: 'user456',
      user_name: 'Second User',
      x: 100,
      y: 200
    };

    // Create cursors for two different users
    const cursor1 = await updateCursor(user1Input);
    const cursor2 = await updateCursor(user2Input);

    // Should have different IDs
    expect(cursor1.id).not.toEqual(cursor2.id);
    expect(cursor1.user_id).toEqual('user123');
    expect(cursor2.user_id).toEqual('user456');

    // Verify both exist in database
    const allCursors = await db.select()
      .from(userCursorsTable)
      .where(eq(userCursorsTable.canvas_id, testCanvasId))
      .execute();

    expect(allCursors).toHaveLength(2);
  });

  it('should maintain separate cursors for same user on different canvases', async () => {
    // Create second canvas
    const canvas2 = await db.insert(canvasesTable)
      .values({
        name: 'Second Canvas',
        description: 'Another canvas'
      })
      .returning()
      .execute();

    const canvas1Input = { ...testInput, canvas_id: testCanvasId };
    const canvas2Input = { ...testInput, canvas_id: canvas2[0].id, x: 500, y: 600 };

    // Create cursors for same user on different canvases
    const cursor1 = await updateCursor(canvas1Input);
    const cursor2 = await updateCursor(canvas2Input);

    // Should have different IDs
    expect(cursor1.id).not.toEqual(cursor2.id);
    expect(cursor1.canvas_id).toEqual(testCanvasId);
    expect(cursor2.canvas_id).toEqual(canvas2[0].id);
    expect(cursor1.user_id).toEqual(cursor2.user_id);
    expect(cursor1.x).toEqual(150.5);
    expect(cursor2.x).toEqual(500);
  });
});
