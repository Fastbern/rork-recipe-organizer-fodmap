import { Hono, Context } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { cors } from 'hono/cors';
import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';

const app = new Hono();

app.use('*', cors());

// Mount tRPC under /api/* so /api/trpc works
app.use(
  '/api/*',
  trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    createContext,
  })
);

// Simple health
app.get('/', (c: Context) => {
  return c.json({ status: 'ok', message: 'API is running' });
});

// AI image generation proxy with timeout and helpful errors
app.post('/api/ai/images/generate', async (c) => {
  try {
    const body = await c.req.json<{ prompt: string; size?: string }>();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: body.prompt, size: body.size }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return c.json(
        { error: 'Image generation failed', details: text || res.statusText },
        { status: res.status as 400 | 401 | 403 | 404 | 408 | 429 | 500 | 502 | 503 | 504 }
      );
    }

    const data = await res.json();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isAbort = message.toLowerCase().includes('aborted');
    return c.json(
      {
        error: isAbort ? 'Request timed out' : 'Network error',
        details: message,
      },
      { status: 504 }
    );
  }
});

export default app;
