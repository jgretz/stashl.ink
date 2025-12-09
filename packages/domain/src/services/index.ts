import {setDependency} from '@stashl/iocdi';
import {UserService} from './user.service';
import {LinkService} from './link.service';
import {AuthService} from './auth.service';
import {initializeRepositories} from '../repositories';

export const SERVICE_SYMBOLS = {
  USER_SERVICE: Symbol('user-service'),
  LINK_SERVICE: Symbol('link-service'),
  AUTH_SERVICE: Symbol('auth-service'),
} as const;

export function initializeServices(databaseUrl?: string): void {
  // Initialize repositories first
  initializeRepositories(databaseUrl);
  
  // Create service instances
  const userService = new UserService();
  const linkService = new LinkService();
  const authService = new AuthService();
  
  // Register services with dependency injection
  setDependency(SERVICE_SYMBOLS.USER_SERVICE, userService);
  setDependency(SERVICE_SYMBOLS.LINK_SERVICE, linkService);
  setDependency(SERVICE_SYMBOLS.AUTH_SERVICE, authService);
}

export {UserService} from './user.service';
export {LinkService} from './link.service';
export {AuthService} from './auth.service';