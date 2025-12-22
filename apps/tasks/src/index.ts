import PgBoss from 'pg-boss';
import {runWithAutoRecovery} from './connectionManager';
import {scheduleFeedsHandler} from './jobs/scheduleFeeds';
import {importFeedHandler} from './jobs/importFeed';
import {cleanupHandler} from './jobs/cleanup';
import {importEmailsHandler} from './jobs/importEmails';
import {startApiConnection} from './apiConnection';

const BATCH_SIZE = 50;

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

  await boss.work('import-feed', {batchSize: BATCH_SIZE}, importFeedHandler);
  console.log(`👷 Worker registered: import-feed (batch size: ${BATCH_SIZE})`);

  await boss.work('cleanup-old-items', cleanupHandler);
  console.log('👷 Worker registered: cleanup-old-items');

  await boss.work('import-emails', importEmailsHandler());
  console.log('👷 Worker registered: import-emails');

  // Start WebSocket connection to API for ad-hoc task messages
  startApiConnection(boss);

  console.log('✅ Task runner started successfully');
}

async function main(): Promise<void> {
  console.log('Starting Stashl Task Runner...');

  // Validate required environment variables for API communication
  if (!process.env.API_URL) {
    console.error('❌ API_URL environment variable is required');
    process.exit(1);
  }
  if (!process.env.TASK_API_KEY) {
    console.error('❌ TASK_API_KEY environment variable is required');
    process.exit(1);
  }

  await runWithAutoRecovery(setupWorkers);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
