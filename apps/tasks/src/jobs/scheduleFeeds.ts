import type PgBoss from 'pg-boss';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';

export function scheduleFeedsHandler(boss: PgBoss) {
  return async function () {
    console.log('Running scheduled feed import...');

    try {
      const service = new RssFeedService();
      const feeds = await service.getAllFeeds();

      for (const feed of feeds) {
        await boss.send('import-feed', {feedId: feed.id, feedUrl: feed.feedUrl});
      }

      console.log(`Queued ${feeds.length} feeds for import`);
    } catch (error) {
      console.error('Failed to queue feed imports:', error);
      throw error;
    }
  };
}
