import type PgBoss from 'pg-boss';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';
import {EmailService} from '@stashl/domain/src/services/email.service';
import {withStashlConnection} from '../stashlConnection';

const DAYS_OLD = 30;

export async function cleanupHandler(_jobs: PgBoss.Job[]) {
  console.log('Running daily cleanup...');

  await withStashlConnection(async () => {
    // Cleanup RSS feed items
    const rssFeedService = new RssFeedService();
    const feeds = await rssFeedService.getAllFeeds();
    let totalFeedItemsDeleted = 0;

    for (const feed of feeds) {
      const deleted = await rssFeedService.cleanupOldItems(feed.id, DAYS_OLD);
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old items from feed ${feed.id}`);
        totalFeedItemsDeleted += deleted;
      }
    }

    // Cleanup email items
    const emailService = new EmailService();
    const users = await emailService.getUsersWithEmailEnabled();
    let totalEmailItemsDeleted = 0;

    for (const user of users) {
      const deleted = await emailService.cleanupOldItems(user.id, DAYS_OLD);
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old email items for user ${user.id}`);
        totalEmailItemsDeleted += deleted;
      }
    }

    console.log(
      `Cleanup complete: removed ${totalFeedItemsDeleted} feed items from ${feeds.length} feeds, ${totalEmailItemsDeleted} email items from ${users.length} users`,
    );
  });
}
