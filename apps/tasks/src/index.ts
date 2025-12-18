import PgBoss from 'pg-boss';
import {runWithAutoRecovery} from './connectionManager';
import {scheduleFeedsHandler} from './jobs/scheduleFeeds';
import {importFeedHandler} from './jobs/importFeed';
import {cleanupHandler} from './jobs/cleanup';
import {importEmailsHandler} from './jobs/importEmails';

async function setupWorkers(boss: PgBoss): Promise<void> {
  await boss.createQueue('schedule-feed-imports');
  await boss.createQueue('import-feed');
  await boss.createQueue('cleanup-old-items');
  await boss.createQueue('import-emails');
  console.log('✅ Queues created');

  await boss.schedule('schedule-feed-imports', '*/30 * * * *');
  console.log('📅 Scheduled: feed imports every 30 minutes');

  await boss.schedule('cleanup-old-items', '0 3 * * *');
  console.log('📅 Scheduled: cleanup daily at 3 AM');

  await boss.schedule('import-emails', '0 * * * *');
  console.log('📅 Scheduled: email imports every hour');

  await boss.work('schedule-feed-imports', scheduleFeedsHandler(boss));
  console.log('👷 Worker registered: schedule-feed-imports');

  await boss.work('import-feed', importFeedHandler);
  console.log('👷 Worker registered: import-feed');

  await boss.work('cleanup-old-items', cleanupHandler);
  console.log('👷 Worker registered: cleanup-old-items');

  await boss.work('import-emails', importEmailsHandler());
  console.log('👷 Worker registered: import-emails');

  console.log('✅ Task runner started successfully');
}

async function main(): Promise<void> {
  console.log('Starting Stashl Task Runner...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  await runWithAutoRecovery(databaseUrl, setupWorkers);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
