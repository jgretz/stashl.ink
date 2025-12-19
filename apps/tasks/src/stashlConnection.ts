import {initializeServices} from '@stashl/domain/src/services';
import {closeDatabase} from '@stashl/domain/src/db/connection';
import {startFlyProxy, stopFlyProxy, isFlyProxyEnabled} from './flyProxy';

let isConnected = false;

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

export async function connectToStashl(): Promise<void> {
  if (isConnected) {
    console.log('📦 Stashl already connected');
    return;
  }

  console.log('📦 Connecting to stashl database...');

  if (isFlyProxyEnabled()) {
    await startFlyProxy();
    await sleep(2000);
  }

  const databaseUrl = getStashlDatabaseUrl();
  initializeServices(databaseUrl);
  isConnected = true;

  console.log('✅ Stashl connected');
}

export async function disconnectFromStashl(): Promise<void> {
  if (!isConnected) {
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

  isConnected = false;
  console.log('✅ Stashl disconnected');
}

export function isStashlConnected(): boolean {
  return isConnected;
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

  isConnected = false;

  // Wait for port to be fully released
  await new Promise((r) => setTimeout(r, 5000));

  // Force fresh connection
  if (isFlyProxyEnabled()) {
    await startFlyProxy();
    await new Promise((r) => setTimeout(r, 2000));
  }

  const databaseUrl = getStashlDatabaseUrl();
  initializeServices(databaseUrl);
  isConnected = true;

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
