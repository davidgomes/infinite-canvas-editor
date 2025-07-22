
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { deleteCanvas } from '../handlers/delete_canvas';
import { eq } from 'drizzle-orm';

describe('deleteCanvas', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing canvas', async () => {
    // Create a test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Delete the canvas
    const result = await deleteCanvas(canvasId);

    expect(result).toBe(true);

    // Verify canvas was deleted
    const canvases = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, canvasId))
      .execute();

    expect(canvases).toHaveLength(0);
  });

  it('should return false when deleting non-existent canvas', async () => {
    const result = await deleteCanvas(999);

    expect(result).toBe(false);
  });

  it('should cascade delete associated shapes', async () => {
    // Create a test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create associated shapes
    await db.insert(shapesTable)
      .values([
        {
          canvas_id: canvasId,
          type: 'rectangle',
          x: '10.0',
          y: '20.0',
          width: '100.0',
          height: '50.0',
          color: '#FF0000',
          z_index: 1
        },
        {
          canvas_id: canvasId,
          type: 'square',
          x: '30.0',
          y: '40.0',
          width: '80.0',
          height: '80.0',
          color: '#00FF00',
          z_index: 2
        }
      ])
      .execute();

    // Verify shapes exist before deletion
    const shapesBefore = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.canvas_id, canvasId))
      .execute();

    expect(shapesBefore).toHaveLength(2);

    // Delete the canvas
    const result = await deleteCanvas(canvasId);

    expect(result).toBe(true);

    // Verify shapes were cascade deleted
    const shapesAfter = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.canvas_id, canvasId))
      .execute();

    expect(shapesAfter).toHaveLength(0);
  });

  it('should not affect other canvases when deleting', async () => {
    // Create two test canvases
    const canvasResults = await db.insert(canvasesTable)
      .values([
        {
          name: 'Canvas 1',
          description: 'First canvas'
        },
        {
          name: 'Canvas 2',
          description: 'Second canvas'
        }
      ])
      .returning()
      .execute();

    const canvas1Id = canvasResults[0].id;
    const canvas2Id = canvasResults[1].id;

    // Delete first canvas
    const result = await deleteCanvas(canvas1Id);

    expect(result).toBe(true);

    // Verify first canvas is deleted
    const canvas1 = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, canvas1Id))
      .execute();

    expect(canvas1).toHaveLength(0);

    // Verify second canvas still exists
    const canvas2 = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, canvas2Id))
      .execute();

    expect(canvas2).toHaveLength(1);
    expect(canvas2[0].name).toBe('Canvas 2');
  });
});
