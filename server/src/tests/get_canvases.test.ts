
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { getCanvases } from '../handlers/get_canvases';

describe('getCanvases', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no canvases exist', async () => {
    const result = await getCanvases();
    expect(result).toEqual([]);
  });

  it('should return all canvases', async () => {
    // Create test canvases
    await db.insert(canvasesTable).values([
      {
        name: 'Canvas 1',
        description: 'First test canvas'
      },
      {
        name: 'Canvas 2',
        description: null
      },
      {
        name: 'Canvas 3',
        description: 'Third test canvas'
      }
    ]).execute();

    const result = await getCanvases();

    expect(result).toHaveLength(3);
    
    // Verify canvas structure
    result.forEach(canvas => {
      expect(canvas.id).toBeDefined();
      expect(typeof canvas.name).toBe('string');
      expect(canvas.created_at).toBeInstanceOf(Date);
      expect(canvas.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific canvas data
    const canvasNames = result.map(c => c.name).sort();
    expect(canvasNames).toEqual(['Canvas 1', 'Canvas 2', 'Canvas 3']);
    
    const canvas1 = result.find(c => c.name === 'Canvas 1');
    expect(canvas1?.description).toEqual('First test canvas');
    
    const canvas2 = result.find(c => c.name === 'Canvas 2');
    expect(canvas2?.description).toBeNull();
  });

  it('should return canvases in creation order', async () => {
    // Create canvases with slight delay to ensure different timestamps
    await db.insert(canvasesTable).values({
      name: 'First Canvas',
      description: 'Created first'
    }).execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(canvasesTable).values({
      name: 'Second Canvas',
      description: 'Created second'
    }).execute();

    const result = await getCanvases();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Canvas');
    expect(result[1].name).toEqual('Second Canvas');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
