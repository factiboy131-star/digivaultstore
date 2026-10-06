import type { Config } from '@netlify/functions';
import { Hono } from 'hono';
import { ensureSeeded } from '../../src/server/db.js';
import { adminRouter } from '../../src/server/routes/admin.js';
import { publicRouter } from '../../src/server/routes/public.js';

const app = new Hono().basePath('/api');

app.use('*', async (_c, next) => {
  await ensureSeeded();
  await next();
});

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

app.route('/admin', adminRouter);
app.route('/', publicRouter);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('[DigiVault API Error]:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default (req: Request) => app.fetch(req);

export const config: Config = {
  path: '/api/*',
};
