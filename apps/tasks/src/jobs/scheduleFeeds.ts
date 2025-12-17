import type PgBoss from 'pg-boss';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TASK_API_KEY = process.env.TASK_API_KEY;

console.log('API_URL:', API_URL);
console.log('TASK_API_KEY set:', !!TASK_API_KEY);

async function reportTaskStats(successCount: number, failCount: number): Promise<void> {
  if (!TASK_API_KEY) {
    console.warn('TASK_API_KEY not set, skipping stats reporting');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/stats/task-runner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Task-Key': TASK_API_KEY,
      },
      body: JSON.stringify({successCount, failCount}),
    });

    if (!response.ok) {
      console.error('Failed to report task stats:', await response.text());
    } else {
      console.log(`📊 Reported task stats: ${successCount} success, ${failCount} fail`);
    }
  } catch (error) {
    console.error('Error reporting task stats:', error);
  }
}

export function scheduleFeedsHandler(boss: PgBoss) {
  return async function () {
    console.log('Running scheduled feed import...');

    let successCount = 0;
    let failCount = 0;

    try {
      const service = new RssFeedService();
      const feeds = await service.getAllFeeds();

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
      await reportTaskStats(successCount, failCount);
    }
  };
}
