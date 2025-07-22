
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCanvasInputSchema, 
  updateCanvasInputSchema,
  createShapeInputSchema,
  updateShapeInputSchema,
  updateCursorInputSchema
} from './schema';

// Import handlers
import { createCanvas } from './handlers/create_canvas';
import { getCanvases } from './handlers/get_canvases';
import { getCanvas } from './handlers/get_canvas';
import { updateCanvas } from './handlers/update_canvas';
import { deleteCanvas } from './handlers/delete_canvas';
import { createShape } from './handlers/create_shape';
import { getShapes } from './handlers/get_shapes';
import { updateShape } from './handlers/update_shape';
import { deleteShape } from './handlers/delete_shape';
import { updateCursor } from './handlers/update_cursor';
import { getCursors } from './handlers/get_cursors';
import { removeCursor } from './handlers/remove_cursor';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Canvas operations
  createCanvas: publicProcedure
    .input(createCanvasInputSchema)
    .mutation(({ input }) => createCanvas(input)),

  getCanvases: publicProcedure
    .query(() => getCanvases()),

  getCanvas: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCanvas(input.id)),

  updateCanvas: publicProcedure
    .input(updateCanvasInputSchema)
    .mutation(({ input }) => updateCanvas(input)),

  deleteCanvas: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCanvas(input.id)),

  // Shape operations
  createShape: publicProcedure
    .input(createShapeInputSchema)
    .mutation(({ input }) => createShape(input)),

  getShapes: publicProcedure
    .input(z.object({ canvasId: z.number() }))
    .query(({ input }) => getShapes(input.canvasId)),

  updateShape: publicProcedure
    .input(updateShapeInputSchema)
    .mutation(({ input }) => updateShape(input)),

  deleteShape: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteShape(input.id)),

  // Real-time collaboration operations
  updateCursor: publicProcedure
    .input(updateCursorInputSchema)
    .mutation(({ input }) => updateCursor(input)),

  getCursors: publicProcedure
    .input(z.object({ canvasId: z.number() }))
    .query(({ input }) => getCursors(input.canvasId)),

  removeCursor: publicProcedure
    .input(z.object({ canvasId: z.number(), userId: z.string() }))
    .mutation(({ input }) => removeCursor(input.canvasId, input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
