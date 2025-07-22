
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { getCanvas } from '../handlers/get_canvas';

describe('getCanvas', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return canvas with shapes ordered by z_index', async () => {
    // Create test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A test canvas'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create test shapes with different z_index values
    await db.insert(shapesTable)
      .values([
        {
          canvas_id: canvasId,
          type: 'rectangle',
          x: '10.50',
          y: '20.75',
          width: '100.25',
          height: '50.00',
          color: '#FF0000',
          z_index: 2
        },
        {
          canvas_id: canvasId,
          type: 'square',
          x: '30.00',
          y: '40.25',
          width: '75.50',
          height: '75.50',
          color: '#00FF00',
          z_index: 1
        },
        {
          canvas_id: canvasId,
          type: 'triangle',
          x: '50.75',
          y: '60.00',
          width: '80.00',
          height: '90.25',
          color: '#0000FF',
          z_index: 3
        }
      ])
      .execute();

    const result = await getCanvas(canvasId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(canvasId);
    expect(result!.name).toBe('Test Canvas');
    expect(result!.description).toBe('A test canvas');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify shapes are included and ordered by z_index
    expect(result!.shapes).toHaveLength(3);
    
    // Check z_index ordering (should be 1, 2, 3)
    expect(result!.shapes[0].z_index).toBe(1);
    expect(result!.shapes[1].z_index).toBe(2);
    expect(result!.shapes[2].z_index).toBe(3);

    // Verify first shape (z_index: 1)
    const firstShape = result!.shapes[0];
    expect(firstShape.type).toBe('square');
    expect(firstShape.x).toBe(30.00);
    expect(firstShape.y).toBe(40.25);
    expect(firstShape.width).toBe(75.50);
    expect(firstShape.height).toBe(75.50);
    expect(firstShape.color).toBe('#00FF00');
    expect(firstShape.created_at).toBeInstanceOf(Date);
    expect(firstShape.updated_at).toBeInstanceOf(Date);

    // Verify numeric type conversions
    expect(typeof firstShape.x).toBe('number');
    expect(typeof firstShape.y).toBe('number');
    expect(typeof firstShape.width).toBe('number');
    expect(typeof firstShape.height).toBe('number');
  });

  it('should return canvas with empty shapes array when no shapes exist', async () => {
    // Create test canvas without shapes
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Empty Canvas',
        description: null
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    const result = await getCanvas(canvasId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(canvasId);
    expect(result!.name).toBe('Empty Canvas');
    expect(result!.description).toBeNull();
    expect(result!.shapes).toHaveLength(0);
    expect(result!.shapes).toEqual([]);
  });

  it('should return null when canvas does not exist', async () => {
    const result = await getCanvas(999);
    expect(result).toBeNull();
  });

  it('should handle canvas with single shape correctly', async () => {
    // Create test canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Single Shape Canvas',
        description: 'Canvas with one shape'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create single shape
    await db.insert(shapesTable)
      .values({
        canvas_id: canvasId,
        type: 'triangle',
        x: '15.25',
        y: '25.75',
        width: '120.00',
        height: '80.50',
        color: '#FFFF00',
        z_index: 0
      })
      .execute();

    const result = await getCanvas(canvasId);

    expect(result).not.toBeNull();
    expect(result!.shapes).toHaveLength(1);
    
    const shape = result!.shapes[0];
    expect(shape.type).toBe('triangle');
    expect(shape.x).toBe(15.25);
    expect(shape.y).toBe(25.75);
    expect(shape.width).toBe(120.00);
    expect(shape.height).toBe(80.50);
    expect(shape.color).toBe('#FFFF00');
    expect(shape.z_index).toBe(0);
  });
});
