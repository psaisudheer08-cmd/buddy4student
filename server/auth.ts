import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { User } from '../src/types';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      authToken?: string;
    }
  }
}

// In-memory active session tokens map: token -> userId
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function createSession(userId: string): string {
  const payload = {
    userId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    salt: crypto.randomBytes(8).toString('hex'),
  };
  const token = 'sess_' + Buffer.from(JSON.stringify(payload)).toString('base64url');
  sessions.set(token, payload);
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']).trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session token is required.',
    });
  }

  // Handle Supabase JWT tokens
  if (token.startsWith('eyJ')) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.sub && (!payload.exp || payload.exp * 1000 > Date.now())) {
          let user = db.findUserById(payload.sub);
          const userEmail = payload.email || `student_${String(payload.sub).slice(0, 6)}@supabase.user`;
          const isVerified = Boolean(payload.email_confirmed_at);
          const createdAt = new Date().toISOString();

          if (!user) {
            const newUser = {
              id: payload.sub,
              email: userEmail,
              passwordHash: 'supabase_managed_auth',
              isVerified,
              createdAt,
            };
            (db as any).state.users.push(newUser);
            user = newUser;
          }

          req.user = {
            id: payload.sub,
            email: user?.email || userEmail,
            isVerified: isVerified || Boolean(user?.isVerified),
            createdAt: user?.createdAt || createdAt,
          };
          req.authToken = token;
          return next();
        }
      }
    } catch (e) {
      console.warn('[Auth] Error decoding Supabase JWT:', e);
    }
  }

  let session = sessions.get(token);
  if (!session && token.startsWith('sess_')) {
    try {
      const rawPayload = Buffer.from(token.slice(5), 'base64url').toString('utf-8');
      const parsed = JSON.parse(rawPayload);
      if (parsed.userId && parsed.expiresAt > Date.now()) {
        session = parsed;
        sessions.set(token, parsed);
      }
    } catch {
      // ignore
    }
  }

  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return res.status(401).json({
      error: 'SessionExpired',
      message: 'Your session has expired. Please log in again.',
    });
  }

  const user = db.findUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      error: 'UserNotFound',
      message: 'Authenticated student record not found.',
    });
  }

  req.user = {
    id: user.id,
    email: user.email,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
  req.authToken = token;

  next();
}
