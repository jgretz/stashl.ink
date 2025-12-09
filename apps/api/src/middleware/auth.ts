import type {Context, Next} from 'hono';
import {AuthService} from '@stashl/domain/src/services/auth.service';

export interface AuthContext {
  userId: string;
  email?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthContext;
  }
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
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