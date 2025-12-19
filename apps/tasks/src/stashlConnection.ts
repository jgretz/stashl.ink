import {initializeServices} from '@stashl/domain/src/services';
import {closeDatabase} from '@stashl/domain/src/db/connection';
import {startFlyProxy, stopFlyProxy, isFlyProxyEnabled} from './flyProxy';

let connectionCount = 0;
let connectionLock: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStashlDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required for stashl connection');
  }
  return url;
}

async function doConnect(): Promise<void> {
  console.log('📦 Connecting to stashl database...');

  if (isFlyProxyEnabled()) {
    await startFlyProxy();
    await sleep(2000);
  }

  const databaseUrl = getStashlDatabaseUrl();
  initializeServices(databaseUrl);

  console.log('✅ Stashl connected');
}

export async function connectToStashl(): Promise<void> {
  connectionCount++;

  if (connectionCount > 1) {
    // Another connection is active, wait for it to be established
    if (connectionLock) {
      await connectionLock;
    }
    console.log(`📦 Stashl already connected (${connectionCount} users)`);
    return;
  }

  // First connection, actually connect
  connectionLock = doConnect();
  await connectionLock;
  connectionLock = null;
}

export async function disconnectFromStashl(): Promise<void> {
  if (connectionCount <= 0) {
    return;
  }

  connectionCount--;

  if (connectionCount > 0) {
    console.log(`📦 Stashl still in use (${connectionCount} remaining)`);
    return;
  }

  console.log('📦 Disconnecting from stashl database...');

  try {
    await closeDatabase();
  } catch (error) {
    console.error('Error closing database:', error);
  }

  if (isFlyProxyEnabled()) {
    await stopFlyProxy();
  }

  console.log('✅ Stashl disconnected');
}

export function isStashlConnected(): boolean {
  return connectionCount > 0;
}

export async function reconnectToStashl(): Promise<void> {
  console.log('🔄 Reconnecting to stashl database...');

  // Force disconnect state
  try {
    await closeDatabase();
  } catch {
    // Ignore - db may already be closed
  }

  if (isFlyProxyEnabled()) {
    await stopFlyProxy();
  }

  // Wait for port to be fully released
  await sleep(5000);

  // Force fresh connection
  await doConnect();

  console.log('✅ Stashl reconnected');
}

export async function withStashlConnection<T>(
  operation: () => Promise<T>
): Promise<T> {
  await connectToStashl();

  try {
    return await operation();
  } finally {
    await disconnectFromStashl();
  }
}
