import {setDependency} from '@stashl/iocdi';
import {UserService} from './user.service';
import {LinkService} from './link.service';
import {AuthService} from './auth.service';
import {RssFeedService} from './rssFeed.service';
import {initializeRepositories} from '../repositories';

export const SERVICE_SYMBOLS = {
  USER_SERVICE: Symbol('user-service'),
  LINK_SERVICE: Symbol('link-service'),
  AUTH_SERVICE: Symbol('auth-service'),
  RSS_FEED_SERVICE: Symbol('rss-feed-service'),
} as const;

export function initializeServices(databaseUrl?: string): void {
  initializeRepositories(databaseUrl);

  const userService = new UserService();
  const linkService = new LinkService();
  const authService = new AuthService();
  const rssFeedService = new RssFeedService();

  setDependency(SERVICE_SYMBOLS.USER_SERVICE, userService);
  setDependency(SERVICE_SYMBOLS.LINK_SERVICE, linkService);
  setDependency(SERVICE_SYMBOLS.AUTH_SERVICE, authService);
  setDependency(SERVICE_SYMBOLS.RSS_FEED_SERVICE, rssFeedService);
}

export {UserService} from './user.service';
export {LinkService} from './link.service';
export {AuthService} from './auth.service';
export {RssFeedService} from './rssFeed.service';