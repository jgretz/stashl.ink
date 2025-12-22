import type PgBoss from 'pg-boss';
import {
  getAllFeeds,
  cleanupFeedItems,
  getUsersWithEmailEnabled,
  cleanupEmailItems,
} from '../apiClient';

const DAYS_OLD = 30;

export async function cleanupHandler(_jobs: PgBoss.Job[]) {
  console.log('Running daily cleanup...');

  // Cleanup RSS feed items
  const feeds = await getAllFeeds();
  let totalFeedItemsDeleted = 0;

  for (const feed of feeds) {
    const deleted = await cleanupFeedItems(feed.id, DAYS_OLD);
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old items from feed ${feed.id}`);
      totalFeedItemsDeleted += deleted;
    }
  }

  // Cleanup email items
  const users = await getUsersWithEmailEnabled();
  let totalEmailItemsDeleted = 0;

  for (const user of users) {
    const deleted = await cleanupEmailItems(user.id, DAYS_OLD);
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} old email items for user ${user.id}`);
      totalEmailItemsDeleted += deleted;
    }
  }

  console.log(
    `Cleanup complete: removed ${totalFeedItemsDeleted} feed items from ${feeds.length} feeds, ${totalEmailItemsDeleted} email items from ${users.length} users`,
  );
}
