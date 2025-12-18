import {setDependency} from '@stashl/iocdi';
import {UserService} from './user.service';
import {LinkService} from './link.service';
import {AuthService} from './auth.service';
import {RssFeedService} from './rssFeed.service';
import {StatsService} from './stats.service';
import {EmailService} from './email.service';
import {initializeRepositories} from '../repositories';

export const SERVICE_SYMBOLS = {
  USER_SERVICE: Symbol('user-service'),
  LINK_SERVICE: Symbol('link-service'),
  AUTH_SERVICE: Symbol('auth-service'),
  RSS_FEED_SERVICE: Symbol('rss-feed-service'),
  STATS_SERVICE: Symbol('stats-service'),
  EMAIL_SERVICE: Symbol('email-service'),
} as const;

export function initializeServices(databaseUrl?: string): void {
  initializeRepositories(databaseUrl);

  const userService = new UserService();
  const linkService = new LinkService();
  const authService = new AuthService();
  const rssFeedService = new RssFeedService();
  const statsService = new StatsService();
  const emailService = new EmailService();

  setDependency(SERVICE_SYMBOLS.USER_SERVICE, userService);
  setDependency(SERVICE_SYMBOLS.LINK_SERVICE, linkService);
  setDependency(SERVICE_SYMBOLS.AUTH_SERVICE, authService);
  setDependency(SERVICE_SYMBOLS.RSS_FEED_SERVICE, rssFeedService);
  setDependency(SERVICE_SYMBOLS.STATS_SERVICE, statsService);
  setDependency(SERVICE_SYMBOLS.EMAIL_SERVICE, emailService);
}

export {UserService} from './user.service';
export {LinkService} from './link.service';
export {AuthService} from './auth.service';
export {RssFeedService} from './rssFeed.service';
export {StatsService} from './stats.service';
export {EmailService} from './email.service';