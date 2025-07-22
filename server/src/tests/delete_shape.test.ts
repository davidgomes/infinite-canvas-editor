
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { type CreateCanvasInput, type CreateShapeInput } from '../schema';
import { deleteShape } from '../handlers/delete_shape';
import { eq } from 'drizzle-orm';

describe('deleteShape', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing shape', async () => {
    // Create a canvas first
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create a shape
    const shapeResult = await db.insert(shapesTable)
      .values({
        canvas_id: canvasId,
        type: 'rectangle',
        x: '10.5',
        y: '20.5',
        width: '100.0',
        height: '50.0',
        color: '#FF0000',
        z_index: 1
      })
      .returning()
      .execute();

    const shapeId = shapeResult[0].id;

    // Delete the shape
    const result = await deleteShape(shapeId);

    expect(result).toBe(true);

    // Verify the shape was deleted from the database
    const shapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, shapeId))
      .execute();

    expect(shapes).toHaveLength(0);
  });

  it('should return false when deleting non-existent shape', async () => {
    const nonExistentId = 999;

    const result = await deleteShape(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other shapes when deleting one shape', async () => {
    // Create a canvas first
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create two shapes
    const shape1Result = await db.insert(shapesTable)
      .values({
        canvas_id: canvasId,
        type: 'rectangle',
        x: '10.0',
        y: '20.0',
        width: '100.0',
        height: '50.0',
        color: '#FF0000',
        z_index: 1
      })
      .returning()
      .execute();

    const shape2Result = await db.insert(shapesTable)
      .values({
        canvas_id: canvasId,
        type: 'square',
        x: '30.0',
        y: '40.0',
        width: '75.0',
        height: '75.0',
        color: '#00FF00',
        z_index: 2
      })
      .returning()
      .execute();

    const shape1Id = shape1Result[0].id;
    const shape2Id = shape2Result[0].id;

    // Delete first shape
    const result = await deleteShape(shape1Id);

    expect(result).toBe(true);

    // Verify first shape is deleted
    const deletedShapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, shape1Id))
      .execute();

    expect(deletedShapes).toHaveLength(0);

    // Verify second shape still exists
    const remainingShapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, shape2Id))
      .execute();

    expect(remainingShapes).toHaveLength(1);
    expect(remainingShapes[0].type).toBe('square');
    expect(remainingShapes[0].color).toBe('#00FF00');
  });
});
