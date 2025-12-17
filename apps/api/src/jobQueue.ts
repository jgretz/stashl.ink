import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function initializeJobQueue(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, job queue disabled');
    return;
  }

  try {
    boss = new PgBoss(databaseUrl);
    await boss.start();
    await boss.createQueue('import-feed');
    await boss.createQueue('import-emails');
    console.log('✅ Job queue initialized');
  } catch (error) {
    console.error('❌ Failed to initialize job queue:', error);
    boss = null;
  }
}

export function getJobQueue(): PgBoss | null {
  return boss;
}
