import type {Context, Next} from 'hono';
import {AuthService} from '@stashl/domain/src/services/auth.service';

export interface AuthContext {
  userId: string;
  email?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthContext;
    isTaskAuth: boolean;
  }
}

const TASK_API_KEY = process.env.TASK_API_KEY;

// Validate X-Task-Key header for internal task runner requests
export function isValidTaskKey(c: Context): boolean {
  const apiKey = c.req.header('X-Task-Key');
  return !!(TASK_API_KEY && apiKey === TASK_API_KEY);
}

// Middleware that requires X-Task-Key authentication
export function taskAuthMiddleware() {
  return async (c: Context, next: Next) => {
    if (!isValidTaskKey(c)) {
      return c.json({error: 'Unauthorized'}, 401);
    }
    c.set('isTaskAuth', true);
    await next();
  };
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    // Skip if already authenticated via task key
    if (c.get('isTaskAuth')) {
      await next();
      return;
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({error: 'Authentication required'}, 401);
    }

    const token = authHeader.slice(7);

    try {
      const authService = new AuthService();
      const user = await authService.validateToken(token);

      if (!user) {
        return c.json({error: 'Invalid token'}, 401);
      }

      c.set('user', {
        userId: user.id,
        email: user.email,
      });

      await next();
    } catch (error) {
      return c.json({error: 'Authentication failed'}, 401);
    }
  };
}