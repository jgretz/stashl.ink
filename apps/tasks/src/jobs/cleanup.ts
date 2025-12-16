import type PgBoss from 'pg-boss';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';

export async function cleanupHandler(_jobs: PgBoss.Job[]) {
  console.log('Running daily cleanup...');

  try {
    const service = new RssFeedService();
    const feeds = await service.getAllFeeds();
    let totalDeleted = 0;

    for (const feed of feeds) {
      const deleted = await service.cleanupOldItems(feed.id, 30);
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old items from feed ${feed.id}`);
        totalDeleted += deleted;
      }
    }

    console.log(`Cleanup complete: removed ${totalDeleted} old items from ${feeds.length} feeds`);
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}
