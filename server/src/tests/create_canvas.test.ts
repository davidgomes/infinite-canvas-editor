
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { type CreateCanvasInput } from '../schema';
import { createCanvas } from '../handlers/create_canvas';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateCanvasInput = {
  name: 'Test Canvas',
  description: 'A canvas for testing'
};

const testInputWithoutDescription: CreateCanvasInput = {
  name: 'Canvas Without Description'
};

const testInputWithNullDescription: CreateCanvasInput = {
  name: 'Canvas With Null Description',
  description: null
};

describe('createCanvas', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a canvas with description', async () => {
    const result = await createCanvas(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Canvas');
    expect(result.description).toEqual('A canvas for testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a canvas without description', async () => {
    const result = await createCanvas(testInputWithoutDescription);

    expect(result.name).toEqual('Canvas Without Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a canvas with explicit null description', async () => {
    const result = await createCanvas(testInputWithNullDescription);

    expect(result.name).toEqual('Canvas With Null Description');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save canvas to database', async () => {
    const result = await createCanvas(testInputWithDescription);

    // Query using proper drizzle syntax
    const canvases = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, result.id))
      .execute();

    expect(canvases).toHaveLength(1);
    expect(canvases[0].name).toEqual('Test Canvas');
    expect(canvases[0].description).toEqual('A canvas for testing');
    expect(canvases[0].created_at).toBeInstanceOf(Date);
    expect(canvases[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple canvases', async () => {
    const canvas1 = await createCanvas({ name: 'Canvas 1' });
    const canvas2 = await createCanvas({ name: 'Canvas 2' });

    expect(canvas1.id).not.toEqual(canvas2.id);
    expect(canvas1.id).toBeGreaterThan(0);
    expect(canvas2.id).toBeGreaterThan(0);
  });

  it('should set timestamps correctly', async () => {
    const before = new Date();
    const result = await createCanvas(testInputWithDescription);
    const after = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
