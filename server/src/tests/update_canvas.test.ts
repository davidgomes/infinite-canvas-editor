
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { type UpdateCanvasInput, type CreateCanvasInput } from '../schema';
import { updateCanvas } from '../handlers/update_canvas';
import { eq } from 'drizzle-orm';

// Create a test canvas first
const createTestCanvas = async (): Promise<number> => {
  const testCanvasInput: CreateCanvasInput = {
    name: 'Original Canvas',
    description: 'Original description'
  };

  const result = await db.insert(canvasesTable)
    .values({
      name: testCanvasInput.name,
      description: testCanvasInput.description
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateCanvas', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update canvas name', async () => {
    const canvasId = await createTestCanvas();

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      name: 'Updated Canvas Name'
    };

    const result = await updateCanvas(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(canvasId);
    expect(result!.name).toEqual('Updated Canvas Name');
    expect(result!.description).toEqual('Original description');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update canvas description', async () => {
    const canvasId = await createTestCanvas();

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      description: 'Updated description'
    };

    const result = await updateCanvas(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(canvasId);
    expect(result!.name).toEqual('Original Canvas');
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    const canvasId = await createTestCanvas();

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      name: 'New Canvas Name',
      description: 'New description'
    };

    const result = await updateCanvas(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(canvasId);
    expect(result!.name).toEqual('New Canvas Name');
    expect(result!.description).toEqual('New description');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const canvasId = await createTestCanvas();

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      description: null
    };

    const result = await updateCanvas(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(canvasId);
    expect(result!.name).toEqual('Original Canvas');
    expect(result!.description).toBeNull();
  });

  it('should save changes to database', async () => {
    const canvasId = await createTestCanvas();

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      name: 'Database Updated Name'
    };

    await updateCanvas(updateInput);

    // Verify changes persisted in database
    const canvases = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, canvasId))
      .execute();

    expect(canvases).toHaveLength(1);
    expect(canvases[0].name).toEqual('Database Updated Name');
    expect(canvases[0].description).toEqual('Original description');
  });

  it('should return null for non-existent canvas', async () => {
    const updateInput: UpdateCanvasInput = {
      id: 99999,
      name: 'Non-existent Canvas'
    };

    const result = await updateCanvas(updateInput);

    expect(result).toBeNull();
  });

  it('should update updated_at timestamp', async () => {
    const canvasId = await createTestCanvas();

    // Get original timestamp
    const originalCanvas = await db.select()
      .from(canvasesTable)
      .where(eq(canvasesTable.id, canvasId))
      .execute();

    const originalUpdatedAt = originalCanvas[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCanvasInput = {
      id: canvasId,
      name: 'Timestamp Test'
    };

    const result = await updateCanvas(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
