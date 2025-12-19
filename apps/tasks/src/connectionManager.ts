import PgBoss from 'pg-boss';
import {
  ensureDockerPostgres,
  waitForReady,
  getPgBossConnectionString,
  stopDockerPostgres,
} from './dockerPostgres';
import {disconnectFromStashl} from './stashlConnection';

interface ConnectionConfig {
  retryIntervalMs: number;
  maxRetries: number;
}

function getConfig(): ConnectionConfig {
  return {
    retryIntervalMs: parseInt(process.env.RETRY_INTERVAL_MS || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '0', 10), // 0 = infinite
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TaskRunnerContext {
  boss: PgBoss;
  shutdown: () => Promise<void>;
}

export type SetupCallback = (boss: PgBoss) => Promise<void>;

export async function createTaskRunner(
  setupCallback: SetupCallback
): Promise<TaskRunnerContext> {
  const config = getConfig();
  let retryCount = 0;
  let isShuttingDown = false;

  async function attemptConnection(): Promise<PgBoss> {
    console.log('🔄 Starting local pg-boss database...');

    await ensureDockerPostgres();
    await waitForReady();
    console.log('✅ Docker postgres ready');

    const pgBossUrl = getPgBossConnectionString();
    const boss = new PgBoss({
      connectionString: pgBossUrl,
      retryLimit: 3,
      retryDelay: 1000,
      retryBackoff: true,
      archiveCompletedAfterSeconds: 3600,
      supervise: true,
    });

    await boss.start();
    console.log('✅ pg-boss started on local Docker postgres');

    return boss;
  }

  async function runWithRecovery(): Promise<TaskRunnerContext> {
    while (true) {
      try {
        const boss = await attemptConnection();
        await setupCallback(boss);

        retryCount = 0;

        boss.on('error', async (error) => {
          console.error('pg-boss error:', error);

          if (isShuttingDown) return;

          const isConnectionError =
            error.message?.includes('Connection terminated') ||
            error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('connection') ||
            error.message?.includes('ETIMEDOUT');

          if (isConnectionError) {
            console.log('🔄 Connection error detected, initiating recovery...');

            try {
              await boss.stop();
            } catch {
              // Ignore stop errors during recovery
            }

            throw new Error('CONNECTION_LOST');
          }
        });

        const shutdown = async () => {
          isShuttingDown = true;
          try {
            await boss.stop();
          } catch {
            // Ignore
          }
          await disconnectFromStashl();
          // Note: Don't stop Docker postgres on normal shutdown for fast restart
        };

        return {boss, shutdown};
      } catch (error) {
        retryCount++;

        if (config.maxRetries > 0 && retryCount >= config.maxRetries) {
          console.error(`❌ Max retries (${config.maxRetries}) exceeded. Giving up.`);
          throw error;
        }

        const retryMsg = config.maxRetries > 0
          ? `(attempt ${retryCount}/${config.maxRetries})`
          : `(attempt ${retryCount})`;

        console.error(`❌ Connection failed ${retryMsg}:`, error);
        console.log(`⏳ Waiting ${config.retryIntervalMs / 1000}s before retry...`);

        await sleep(config.retryIntervalMs);
      }
    }
  }

  return runWithRecovery();
}

export async function runWithAutoRecovery(
  setupCallback: SetupCallback
): Promise<never> {
  const config = getConfig();

  while (true) {
    try {
      const {boss, shutdown} = await createTaskRunner(setupCallback);

      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');

      const handleShutdown = async (signal: string) => {
        console.log(`Received ${signal}, shutting down...`);
        await shutdown();
        process.exit(0);
      };

      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
      process.on('SIGINT', () => handleShutdown('SIGINT'));

      await new Promise((_, reject) => {
        boss.on('error', (error) => {
          const isConnectionError =
            error.message?.includes('Connection terminated') ||
            error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('connection') ||
            error.message?.includes('ETIMEDOUT');

          if (isConnectionError) {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Task runner crashed:', error);
      console.log(`⏳ Waiting ${config.retryIntervalMs / 1000}s before full restart...`);

      await sleep(config.retryIntervalMs);
    }
  }
}
