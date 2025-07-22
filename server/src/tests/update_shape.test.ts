
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { type UpdateShapeInput } from '../schema';
import { updateShape } from '../handlers/update_shape';
import { eq } from 'drizzle-orm';

describe('updateShape', () => {
  let canvasId: number;
  let shapeId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();
    
    canvasId = canvasResult[0].id;

    // Create a test shape
    const shapeResult = await db.insert(shapesTable)
      .values({
        canvas_id: canvasId,
        type: 'rectangle',
        x: '10.50',
        y: '20.75',
        width: '100.00',
        height: '50.00',
        color: '#ff0000',
        z_index: 1
      })
      .returning()
      .execute();

    shapeId = shapeResult[0].id;
  });

  afterEach(resetDB);

  it('should update shape position', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      x: 25.25,
      y: 35.75
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(shapeId);
    expect(result!.x).toBe(25.25);
    expect(result!.y).toBe(35.75);
    expect(result!.width).toBe(100); // Should remain unchanged
    expect(result!.height).toBe(50); // Should remain unchanged
    expect(result!.color).toBe('#ff0000'); // Should remain unchanged
    expect(result!.z_index).toBe(1); // Should remain unchanged
  });

  it('should update shape dimensions', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      width: 200.50,
      height: 150.25
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(result!.width).toBe(200.50);
    expect(result!.height).toBe(150.25);
    expect(result!.x).toBe(10.5); // Should remain unchanged
    expect(result!.y).toBe(20.75); // Should remain unchanged
  });

  it('should update shape color and z-index', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      color: '#00ff00',
      z_index: 5
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(result!.color).toBe('#00ff00');
    expect(result!.z_index).toBe(5);
    expect(result!.x).toBe(10.5); // Should remain unchanged
    expect(result!.y).toBe(20.75); // Should remain unchanged
  });

  it('should update multiple properties at once', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      x: 30.0,
      y: 40.0,
      width: 120.0,
      height: 80.0,
      color: '#0000ff',
      z_index: 10
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(result!.x).toBe(30.0);
    expect(result!.y).toBe(40.0);
    expect(result!.width).toBe(120.0);
    expect(result!.height).toBe(80.0);
    expect(result!.color).toBe('#0000ff');
    expect(result!.z_index).toBe(10);
  });

  it('should update the updated_at timestamp', async () => {
    const originalShape = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, shapeId))
      .execute();

    const originalUpdatedAt = originalShape[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateShapeInput = {
      id: shapeId,
      color: '#00ff00'
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes in the database', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      x: 50.25,
      color: '#ffff00'
    };

    await updateShape(input);

    const shapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, shapeId))
      .execute();

    expect(shapes).toHaveLength(1);
    expect(parseFloat(shapes[0].x)).toBe(50.25);
    expect(shapes[0].color).toBe('#ffff00');
    expect(parseFloat(shapes[0].y)).toBe(20.75); // Should remain unchanged
  });

  it('should return null for non-existent shape', async () => {
    const input: UpdateShapeInput = {
      id: 99999,
      x: 10.0
    };

    const result = await updateShape(input);

    expect(result).toBeNull();
  });

  it('should handle numeric type conversions correctly', async () => {
    const input: UpdateShapeInput = {
      id: shapeId,
      x: 15.12,  // Use 2 decimal places to match numeric(10,2) precision
      y: 25.45,  // Use 2 decimal places to match numeric(10,2) precision
      width: 110.78,  // Use 2 decimal places to match numeric(10,2) precision
      height: 60.32   // Use 2 decimal places to match numeric(10,2) precision
    };

    const result = await updateShape(input);

    expect(result).not.toBeNull();
    expect(typeof result!.x).toBe('number');
    expect(typeof result!.y).toBe('number');
    expect(typeof result!.width).toBe('number');
    expect(typeof result!.height).toBe('number');
    expect(result!.x).toBe(15.12);
    expect(result!.y).toBe(25.45);
    expect(result!.width).toBe(110.78);
    expect(result!.height).toBe(60.32);
  });
});
