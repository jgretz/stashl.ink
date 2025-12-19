import type PgBoss from 'pg-boss';
import type {
  TaskMessage,
  ImportFeedPayload,
  ImportAllFeedsPayload,
  ImportEmailsPayload,
} from '@stashl/domain/src/taskMessages';

const API_URL = process.env.API_URL;
const TASK_API_KEY = process.env.TASK_API_KEY;

let ws: WebSocket | null = null;
let boss: PgBoss | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isShuttingDown = false;
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastMessageTime = Date.now();

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;
const HEALTH_CHECK_INTERVAL = 30000;
const HEALTH_CHECK_TIMEOUT = 60000;

function getReconnectDelay(): number {
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  return delay + Math.random() * 1000; // Add jitter
}

function stopHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

function startHealthCheck(): void {
  stopHealthCheck();

  healthCheckInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // If no message received in timeout period, consider connection dead
    if (Date.now() - lastMessageTime > HEALTH_CHECK_TIMEOUT) {
      console.log('⚠️ WebSocket health check failed, reconnecting...');
      ws.close();
    }
  }, HEALTH_CHECK_INTERVAL);
}

function getWebSocketUrl(): string {
  if (!API_URL || !TASK_API_KEY) {
    throw new Error('API_URL and TASK_API_KEY are required for API connection');
  }

  const url = new URL(API_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/api/tasks/ws';
  url.searchParams.set('key', TASK_API_KEY);

  return url.toString();
}

async function handleMessage(data: string): Promise<void> {
  if (!boss) {
    console.error('pg-boss not initialized, cannot process message');
    return;
  }

  try {
    const message = JSON.parse(data) as TaskMessage;
    console.log(`📨 Received task message: ${message.type}`);

    switch (message.type) {
      case 'import-feed': {
        const payload = message.payload as ImportFeedPayload;
        await boss.send('import-feed', {feedId: payload.feedId, feedUrl: payload.feedUrl});
        console.log(`✅ Queued import-feed for ${payload.feedId}`);
        break;
      }
      case 'import-all-feeds': {
        const payload = message.payload as ImportAllFeedsPayload;
        for (const feed of payload.feeds) {
          await boss.send('import-feed', {feedId: feed.feedId, feedUrl: feed.feedUrl});
        }
        console.log(`✅ Queued ${payload.feeds.length} feed imports`);
        break;
      }
      case 'import-emails': {
        const payload = message.payload as ImportEmailsPayload;
        await boss.send('import-emails', {userId: payload.userId});
        console.log(`✅ Queued import-emails for user ${payload.userId}`);
        break;
      }
      default:
        console.warn(`Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    console.error('Failed to process message:', error);
  }
}

function connect(): void {
  if (isShuttingDown) return;

  try {
    const url = getWebSocketUrl();
    console.log('🔌 Connecting to API WebSocket...');

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✅ Connected to API WebSocket');
      reconnectAttempts = 0;
      lastMessageTime = Date.now();
      startHealthCheck();
    };

    ws.onmessage = (event) => {
      lastMessageTime = Date.now();
      const data = typeof event.data === 'string' ? event.data : event.data.toString();

      // Handle ping from server
      if (data === 'ping') {
        ws?.send('pong');
        return;
      }

      handleMessage(data);
    };

    ws.onclose = () => {
      stopHealthCheck();
      ws = null;

      if (isShuttingDown) return;

      console.log('🔌 Disconnected from API WebSocket');
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Failed to connect:', error);
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (isShuttingDown || reconnectTimeout) return;

  reconnectAttempts++;
  const delay = getReconnectDelay();
  console.log(`⏳ Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})`);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connect();
  }, delay);
}

export function startApiConnection(pgBoss: PgBoss): void {
  if (!API_URL || !TASK_API_KEY) {
    console.warn('⚠️ API_URL or TASK_API_KEY not set, API connection disabled');
    return;
  }

  // Reset state for fresh start
  isShuttingDown = false;
  reconnectAttempts = 0;
  lastMessageTime = Date.now();

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  stopHealthCheck();

  // Close any existing connection
  if (ws) {
    try {
      ws.close();
    } catch {
      // Ignore
    }
    ws = null;
  }

  boss = pgBoss;
  connect();
}

export function stopApiConnection(): void {
  isShuttingDown = true;

  stopHealthCheck();

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  console.log('🔌 API connection stopped');
}

export function isApiConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}
