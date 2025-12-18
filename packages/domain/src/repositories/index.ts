import {setDependency} from '@stashl/iocdi';
import {DrizzleUserRepository} from './user.repository';
import {DrizzleLinkRepository} from './link.repository';
import {DrizzleRssFeedRepository} from './rssFeed.repository';
import {DrizzleRssFeedItemRepository} from './rssFeedItem.repository';
import {DrizzleRssFeedImportHistoryRepository} from './rssFeedImportHistory.repository';
import {DrizzleStatsRepository} from './stats.repository';
import {DrizzleEmailItemRepository} from './emailItem.repository';
import {initializeDatabase} from '../db/connection';

export const REPOSITORY_SYMBOLS = {
  USER_REPOSITORY: Symbol('user-repository'),
  LINK_REPOSITORY: Symbol('link-repository'),
  RSS_FEED_REPOSITORY: Symbol('rss-feed-repository'),
  RSS_FEED_ITEM_REPOSITORY: Symbol('rss-feed-item-repository'),
  RSS_FEED_IMPORT_HISTORY_REPOSITORY: Symbol('rss-feed-import-history-repository'),
  STATS_REPOSITORY: Symbol('stats-repository'),
  EMAIL_ITEM_REPOSITORY: Symbol('email-item-repository'),
} as const;

export function initializeRepositories(databaseUrl?: string): void {
  initializeDatabase(databaseUrl);

  const userRepository = new DrizzleUserRepository();
  const linkRepository = new DrizzleLinkRepository();
  const rssFeedRepository = new DrizzleRssFeedRepository();
  const rssFeedItemRepository = new DrizzleRssFeedItemRepository();
  const rssFeedImportHistoryRepository = new DrizzleRssFeedImportHistoryRepository();
  const statsRepository = new DrizzleStatsRepository();
  const emailItemRepository = new DrizzleEmailItemRepository();

  setDependency(REPOSITORY_SYMBOLS.USER_REPOSITORY, userRepository);
  setDependency(REPOSITORY_SYMBOLS.LINK_REPOSITORY, linkRepository);
  setDependency(REPOSITORY_SYMBOLS.RSS_FEED_REPOSITORY, rssFeedRepository);
  setDependency(REPOSITORY_SYMBOLS.RSS_FEED_ITEM_REPOSITORY, rssFeedItemRepository);
  setDependency(REPOSITORY_SYMBOLS.RSS_FEED_IMPORT_HISTORY_REPOSITORY, rssFeedImportHistoryRepository);
  setDependency(REPOSITORY_SYMBOLS.STATS_REPOSITORY, statsRepository);
  setDependency(REPOSITORY_SYMBOLS.EMAIL_ITEM_REPOSITORY, emailItemRepository);
}

export {DrizzleUserRepository} from './user.repository';
export {DrizzleLinkRepository} from './link.repository';
export {DrizzleRssFeedRepository} from './rssFeed.repository';
export {DrizzleRssFeedItemRepository} from './rssFeedItem.repository';
export {DrizzleRssFeedImportHistoryRepository} from './rssFeedImportHistory.repository';
export {DrizzleStatsRepository} from './stats.repository';
export {DrizzleEmailItemRepository} from './emailItem.repository';