import PgBoss from 'pg-boss';
import {initializeServices} from '@stashl/domain/src/services';
import {scheduleFeedsHandler} from './jobs/scheduleFeeds';
import {importFeedHandler} from './jobs/importFeed';
import {cleanupHandler} from './jobs/cleanup';

async function main() {
  console.log('Starting Stashl Task Runner...');

  try {
    initializeServices();
    console.log('✅ Domain services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const boss = new PgBoss(databaseUrl);

  boss.on('error', (error) => {
    console.error('pg-boss error:', error);
  });

  await boss.start();
  console.log('✅ pg-boss started');

  // Create queues (required before scheduling or sending)
  await boss.createQueue('schedule-feed-imports');
  await boss.createQueue('import-feed');
  await boss.createQueue('cleanup-old-items');
  console.log('✅ Queues created');

  // Register scheduled jobs
  await boss.schedule('schedule-feed-imports', '*/30 * * * *');
  console.log('📅 Scheduled: feed imports every 30 minutes');

  await boss.schedule('cleanup-old-items', '0 3 * * *');
  console.log('📅 Scheduled: cleanup daily at 3 AM');

  // Register workers
  await boss.work('schedule-feed-imports', scheduleFeedsHandler(boss));
  console.log('👷 Worker registered: schedule-feed-imports');

  await boss.work('import-feed', importFeedHandler);
  console.log('👷 Worker registered: import-feed');

  await boss.work('cleanup-old-items', cleanupHandler);
  console.log('👷 Worker registered: cleanup-old-items');

  console.log('✅ Task runner started successfully');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    await boss.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    await boss.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
