
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { shapesTable, canvasesTable } from '../db/schema';
import { type CreateShapeInput } from '../schema';
import { createShape } from '../handlers/create_shape';
import { eq } from 'drizzle-orm';

describe('createShape', () => {
  let testCanvasId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a canvas first for foreign key constraint
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();
    
    testCanvasId = canvasResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateShapeInput = {
    canvas_id: 0, // Will be set to testCanvasId in each test
    type: 'rectangle',
    x: 10.5,
    y: 20.25,
    width: 100.75,
    height: 50.5,
    color: '#ff0000',
    z_index: 1
  };

  it('should create a shape', async () => {
    const input = { ...testInput, canvas_id: testCanvasId };
    const result = await createShape(input);

    // Basic field validation
    expect(result.canvas_id).toEqual(testCanvasId);
    expect(result.type).toEqual('rectangle');
    expect(result.x).toEqual(10.5);
    expect(result.y).toEqual(20.25);
    expect(result.width).toEqual(100.75);
    expect(result.height).toEqual(50.5);
    expect(result.color).toEqual('#ff0000');
    expect(result.z_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
  });

  it('should save shape to database', async () => {
    const input = { ...testInput, canvas_id: testCanvasId };
    const result = await createShape(input);

    // Query using proper drizzle syntax
    const shapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, result.id))
      .execute();

    expect(shapes).toHaveLength(1);
    const shape = shapes[0];
    expect(shape.canvas_id).toEqual(testCanvasId);
    expect(shape.type).toEqual('rectangle');
    expect(parseFloat(shape.x)).toEqual(10.5);
    expect(parseFloat(shape.y)).toEqual(20.25);
    expect(parseFloat(shape.width)).toEqual(100.75);
    expect(parseFloat(shape.height)).toEqual(50.5);
    expect(shape.color).toEqual('#ff0000');
    expect(shape.z_index).toEqual(1);
    expect(shape.created_at).toBeInstanceOf(Date);
    expect(shape.updated_at).toBeInstanceOf(Date);
  });

  it('should use default z_index when not provided', async () => {
    const inputWithoutZIndex = {
      canvas_id: testCanvasId,
      type: 'square' as const,
      x: 5.5,
      y: 10.25,
      width: 25.5,
      height: 25.5,
      color: '#00ff00'
    };
    
    const result = await createShape(inputWithoutZIndex);

    expect(result.z_index).toEqual(0);
  });

  it('should handle different shape types', async () => {
    const triangleInput = {
      ...testInput,
      canvas_id: testCanvasId,
      type: 'triangle' as const,
      color: '#0000ff'
    };
    
    const result = await createShape(triangleInput);

    expect(result.type).toEqual('triangle');
    expect(result.color).toEqual('#0000ff');
  });

  it('should throw error for non-existent canvas', async () => {
    const input = { ...testInput, canvas_id: 99999 };
    
    await expect(createShape(input)).rejects.toThrow(/canvas.*not found/i);
  });

  it('should handle decimal coordinates and dimensions correctly', async () => {
    // Use 2 decimal places to match the database precision (10, 2)
    const decimalInput = {
      canvas_id: testCanvasId,
      type: 'rectangle' as const,
      x: 123.45,
      y: 789.01,
      width: 456.78,
      height: 234.56,
      color: '#ffffff',
      z_index: 5
    };
    
    const result = await createShape(decimalInput);

    expect(result.x).toEqual(123.45);
    expect(result.y).toEqual(789.01);
    expect(result.width).toEqual(456.78);
    expect(result.height).toEqual(234.56);
    
    // Verify precision is maintained in database
    const shapes = await db.select()
      .from(shapesTable)
      .where(eq(shapesTable.id, result.id))
      .execute();

    const shape = shapes[0];
    expect(parseFloat(shape.x)).toEqual(123.45);
    expect(parseFloat(shape.y)).toEqual(789.01);
    expect(parseFloat(shape.width)).toEqual(456.78);
    expect(parseFloat(shape.height)).toEqual(234.56);
  });
});
