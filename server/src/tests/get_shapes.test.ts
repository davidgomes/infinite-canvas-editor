
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable, shapesTable } from '../db/schema';
import { getShapes } from '../handlers/get_shapes';

describe('getShapes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when canvas has no shapes', async () => {
    // Create a canvas first
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Empty Canvas',
        description: 'A canvas with no shapes'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;
    const shapes = await getShapes(canvasId);

    expect(shapes).toEqual([]);
  });

  it('should return all shapes for a canvas', async () => {
    // Create a canvas
    const canvasResult = await db.insert(canvasesTable)
      .values({
        name: 'Test Canvas',
        description: 'A canvas for testing'
      })
      .returning()
      .execute();

    const canvasId = canvasResult[0].id;

    // Create multiple shapes
    await db.insert(shapesTable)
      .values([
        {
          canvas_id: canvasId,
          type: 'rectangle',
          x: '10.5',
          y: '20.5',
          width: '100.0',
          height: '50.0',
          color: '#FF0000',
          z_index: 1
        },
        {
          canvas_id: canvasId,
          type: 'square',
          x: '150.0',
          y: '200.25',
          width: '75.5',
          height: '75.5',
          color: '#00FF00',
          z_index: 2
        }
      ])
      .execute();

    const shapes = await getShapes(canvasId);

    expect(shapes).toHaveLength(2);
    
    // Verify first shape
    expect(shapes[0].canvas_id).toEqual(canvasId);
    expect(shapes[0].type).toEqual('rectangle');
    expect(shapes[0].x).toEqual(10.5);
    expect(shapes[0].y).toEqual(20.5);
    expect(shapes[0].width).toEqual(100.0);
    expect(shapes[0].height).toEqual(50.0);
    expect(shapes[0].color).toEqual('#FF0000');
    expect(shapes[0].z_index).toEqual(1);
    expect(typeof shapes[0].x).toEqual('number');
    expect(typeof shapes[0].y).toEqual('number');
    expect(typeof shapes[0].width).toEqual('number');
    expect(typeof shapes[0].height).toEqual('number');

    // Verify second shape
    expect(shapes[1].canvas_id).toEqual(canvasId);
    expect(shapes[1].type).toEqual('square');
    expect(shapes[1].x).toEqual(150.0);
    expect(shapes[1].y).toEqual(200.25);
    expect(shapes[1].width).toEqual(75.5);
    expect(shapes[1].height).toEqual(75.5);
    expect(shapes[1].color).toEqual('#00FF00');
    expect(shapes[1].z_index).toEqual(2);
  });

  it('should only return shapes for the specified canvas', async () => {
    // Create two canvases
    const canvasResults = await db.insert(canvasesTable)
      .values([
        { name: 'Canvas 1', description: 'First canvas' },
        { name: 'Canvas 2', description: 'Second canvas' }
      ])
      .returning()
      .execute();

    const canvas1Id = canvasResults[0].id;
    const canvas2Id = canvasResults[1].id;

    // Create shapes for both canvases
    await db.insert(shapesTable)
      .values([
        {
          canvas_id: canvas1Id,
          type: 'rectangle',
          x: '10.0',
          y: '20.0',
          width: '100.0',
          height: '50.0',
          color: '#FF0000',
          z_index: 1
        },
        {
          canvas_id: canvas2Id,
          type: 'triangle',
          x: '30.0',
          y: '40.0',
          width: '80.0',
          height: '60.0',
          color: '#0000FF',
          z_index: 1
        }
      ])
      .execute();

    // Get shapes for canvas 1 only
    const canvas1Shapes = await getShapes(canvas1Id);

    expect(canvas1Shapes).toHaveLength(1);
    expect(canvas1Shapes[0].canvas_id).toEqual(canvas1Id);
    expect(canvas1Shapes[0].type).toEqual('rectangle');
    expect(canvas1Shapes[0].color).toEqual('#FF0000');

    // Get shapes for canvas 2 only
    const canvas2Shapes = await getShapes(canvas2Id);

    expect(canvas2Shapes).toHaveLength(1);
    expect(canvas2Shapes[0].canvas_id).toEqual(canvas2Id);
    expect(canvas2Shapes[0].type).toEqual('triangle');
    expect(canvas2Shapes[0].color).toEqual('#0000FF');
  });
});
