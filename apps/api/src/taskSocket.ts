import type {TaskMessage} from '@stashl/domain/src/taskMessages';

// WebSocket type from Bun runtime
type BunWebSocket = {
  send(data: string | BufferSource): void;
  close(): void;
};

const TASK_API_KEY = process.env.TASK_API_KEY;

let activeConnection: BunWebSocket | null = null;

export function handleTaskWebSocket(ws: BunWebSocket): void {
  console.log('🔌 Tasks app connected via WebSocket');
  activeConnection = ws;
}

export function handleTaskWebSocketClose(): void {
  console.log('🔌 Tasks app disconnected');
  activeConnection = null;
}

export function handleTaskWebSocketMessage(message: string | Buffer): void {
  // Handle pong/heartbeat messages from client
  const text = typeof message === 'string' ? message : message.toString();
  if (text === 'pong') {
    return;
  }
  console.log('📨 Received from tasks:', text);
}

export function sendTaskMessage(message: TaskMessage): boolean {
  if (!activeConnection) {
    console.warn('⚠️ No tasks app connection, cannot send message');
    return false;
  }

  try {
    activeConnection.send(JSON.stringify(message));
    console.log(`📤 Sent task message: ${message.type}`);
    return true;
  } catch (error) {
    console.error('Failed to send task message:', error);
    return false;
  }
}

export function isTaskServiceConnected(): boolean {
  return activeConnection !== null;
}

export function validateTaskApiKey(key: string | null): boolean {
  if (!TASK_API_KEY) {
    console.warn('TASK_API_KEY not configured');
    return false;
  }
  return key === TASK_API_KEY;
}
