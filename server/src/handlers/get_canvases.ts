
import { db } from '../db';
import { canvasesTable } from '../db/schema';
import { type Canvas } from '../schema';

export const getCanvases = async (): Promise<Canvas[]> => {
  try {
    const results = await db.select()
      .from(canvasesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch canvases:', error);
    throw error;
  }
};
