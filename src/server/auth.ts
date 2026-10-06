import jwt from 'jsonwebtoken';
import { createMiddleware } from 'hono/factory';
import { repo } from './db.js';

function jwtSecret(): string {
  return Netlify.env.get('ADMIN_JWT_SECRET') || 'digivault_production_secure_secret_key_2026_99482';
}

export interface AdminPayload {
  adminId: string;
  email: string;
  role: string;
}

export type AdminEnv = { Variables: { admin: AdminPayload } };

export function signAdminToken(admin: { id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, jwtSecret()) as AdminPayload;
  } catch (err) {
    return null;
  }
}

export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Admin authentication token required' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAdminToken(token);

  if (!payload) {
    return c.json({ error: 'Unauthorized: Invalid or expired admin token' }, 401);
  }

  const user = await repo.adminUsers.get(payload.adminId);
  if (!user) {
    return c.json({ error: 'Unauthorized: Admin user no longer exists' }, 401);
  }

  c.set('admin', payload);
  await next();
});

// Generates a short-lived download token (signed JWT) for verified customer downloads
export function signDownloadToken(orderId: string, productId: string, email: string): string {
  return jwt.sign(
    {
      orderId,
      productId,
      email,
      type: 'download',
    },
    jwtSecret(),
    { expiresIn: '15m' }
  );
}

export function verifyDownloadToken(token: string): { orderId: string; productId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, jwtSecret()) as any;
    if (decoded && decoded.type === 'download') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
