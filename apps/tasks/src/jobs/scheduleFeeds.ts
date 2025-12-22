import type PgBoss from 'pg-boss';
import {getAllFeeds, reportTaskRunnerStats} from '../apiClient';

export function scheduleFeedsHandler(boss: PgBoss) {
  return async function () {
    console.log('Running scheduled feed import...');

    let successCount = 0;
    let failCount = 0;

    try {
      const feeds = await getAllFeeds();

      for (const feed of feeds) {
        try {
          await boss.send('import-feed', {feedId: feed.id, feedUrl: feed.feedUrl});
          successCount++;
        } catch {
          failCount++;
        }
      }

      console.log(`Queued ${feeds.length} feeds for import`);
    } catch (error) {
      console.error('Failed to queue feed imports:', error);
      failCount++;
      throw error;
    } finally {
      await reportTaskRunnerStats(successCount, failCount);
    }
  };
}
