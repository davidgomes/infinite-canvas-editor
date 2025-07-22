
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, userCursorsTable } from '../db/schema';
import { getCursors } from '../handlers/get_cursors';

describe('getCursors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active cursors for canvas', async () => {
    // Create test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();
    
    const canvasId = canvasResult[0].id;

    // Create recent cursor
    await db.insert(userCursorsTable)
      .values({
        canvas_id: canvasId,
        user_id: 'user1',
        user_name: 'Test User',
        x: '100.50',
        y: '200.75'
      })
      .execute();

    const result = await getCursors(canvasId);

    expect(result).toHaveLength(1);
    expect(result[0].canvas_id).toEqual(canvasId);
    expect(result[0].user_id).toEqual('user1');
    expect(result[0].user_name).toEqual('Test User');
    expect(result[0].x).toEqual(100.50);
    expect(result[0].y).toEqual(200.75);
    expect(typeof result[0].x).toEqual('number');
    expect(typeof result[0].y).toEqual('number');
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter out old cursors', async () => {
    // Create test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();
    
    const canvasId = canvasResult[0].id;

    // Create old cursor (more than 30 seconds ago)
    const oldTimestamp = new Date(Date.now() - 60 * 1000); // 60 seconds ago
    await db.insert(userCursorsTable)
      .values({
        canvas_id: canvasId,
        user_id: 'old_user',
        user_name: 'Old User',
        x: '50.0',
        y: '75.0',
        updated_at: oldTimestamp
      })
      .execute();

    const result = await getCursors(canvasId);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for canvas with no cursors', async () => {
    // Create test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Empty Canvas',
        description: 'A canvas with no cursors'
      })
      .returning()
      .execute();
    
    const canvasId = canvasResult[0].id;

    const result = await getCursors(canvasId);

    expect(result).toHaveLength(0);
  });

  it('should only return cursors for specified canvas', async () => {
    // Create two test canvases
    const canvas1Result = await db.insert(canvasesTable)
      .values({
        name: 'Canvas 1',
        description: 'First canvas'
      })
      .returning()
      .execute();
    
    const canvas2Result = await db.insert(canvasesTable)
      .values({
        name: 'Canvas 2',
        description: 'Second canvas'
      })
      .returning()
      .execute();
    
    const canvas1Id = canvas1Result[0].id;
    const canvas2Id = canvas2Result[0].id;

    // Add cursors to both canvases
    await db.insert(userCursorsTable)
      .values([
        {
          canvas_id: canvas1Id,
          user_id: 'user1',
          user_name: 'User 1',
          x: '100.0',
          y: '200.0'
        },
        {
          canvas_id: canvas2Id,
          user_id: 'user2',
          user_name: 'User 2',
          x: '300.0',
          y: '400.0'
        }
      ])
      .execute();

    const result = await getCursors(canvas1Id);

    expect(result).toHaveLength(1);
    expect(result[0].canvas_id).toEqual(canvas1Id);
    expect(result[0].user_id).toEqual('user1');
  });
});
