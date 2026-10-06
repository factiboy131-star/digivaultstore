import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'digivault_production_secure_secret_key_2026_99482';

export interface AdminPayload {
  adminId: string;
  email: string;
  role: string;
}

export function signAdminToken(admin: { id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch (err) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminPayload;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAdminToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }

  const admins = db.get('admin_users');
  const user = admins.find((a) => a.id === payload.adminId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Admin user no longer exists' });
  }

  req.admin = payload;
  next();
}

// Generates a short-lived download token (signed JWT) for verified customer downloads
export function signDownloadToken(orderId: string, productId: string, email: string): string {
  return jwt.sign(
    {
      orderId,
      productId,
      email,
      type: 'download',
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function verifyDownloadToken(token: string): { orderId: string; productId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.type === 'download') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}
