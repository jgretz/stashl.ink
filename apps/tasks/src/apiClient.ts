// API client for tasks app to call the main API instead of direct database access

const API_URL = process.env.API_URL;
const TASK_API_KEY = process.env.TASK_API_KEY;

// Types for API responses
export interface RssFeed {
  id: string;
  userId: string;
  feedUrl: string;
  title: string;
  siteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskUser {
  id: string;
  email: string;
  name: string;
  emailIntegrationEnabled: boolean;
  emailFilter: string | null;
  gmailAccessToken: string | null;
  gmailRefreshToken: string | null;
  gmailTokenExpiry: string | null;
}

export interface ImportFeedItemInput {
  guid: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  pubDate?: string; // ISO string
}

export interface ImportEmailItemInput {
  emailMessageId: string;
  emailFrom: string;
  link: string;
  title?: string;
  description?: string;
}

export interface ImportResult {
  newItems: number;
  skipped: number;
}

// Helper for API calls
async function taskApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL || !TASK_API_KEY) {
    throw new Error('API_URL and TASK_API_KEY environment variables are required');
  }

  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Task-Key': TASK_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status} for ${path}: ${text}`);
  }

  return response.json();
}

// RSS Feed operations

export async function getAllFeeds(): Promise<RssFeed[]> {
  const result = await taskApiRequest<{feeds: RssFeed[]}>('/api/rss/feeds/all');
  return result.feeds;
}

export async function importFeedItems(
  feedId: string,
  items: ImportFeedItemInput[],
): Promise<ImportResult> {
  return taskApiRequest<ImportResult>(`/api/rss/feeds/${feedId}/items`, {
    method: 'POST',
    body: JSON.stringify({items}),
  });
}

export async function recordFeedImportError(feedId: string, errorMessage: string): Promise<void> {
  await taskApiRequest(`/api/rss/feeds/${feedId}/error`, {
    method: 'POST',
    body: JSON.stringify({errorMessage}),
  });
}

export async function cleanupFeedItems(feedId: string, daysOld: number): Promise<number> {
  const result = await taskApiRequest<{deleted: number}>(`/api/rss/feeds/${feedId}/cleanup`, {
    method: 'DELETE',
    body: JSON.stringify({daysOld}),
  });
  return result.deleted;
}

// User/Email operations

export async function getUsersWithEmailEnabled(): Promise<TaskUser[]> {
  const result = await taskApiRequest<{users: TaskUser[]}>('/api/email/users/enabled');
  return result.users;
}

export async function getUserById(userId: string): Promise<TaskUser | null> {
  const result = await taskApiRequest<{user: TaskUser | null}>(`/api/email/users/${userId}`);
  return result.user;
}

export async function saveGmailTokens(
  userId: string,
  tokens: {
    gmailAccessToken: string;
    gmailRefreshToken: string;
    gmailTokenExpiry: string; // ISO string
  },
): Promise<void> {
  await taskApiRequest(`/api/email/users/${userId}/gmail-tokens`, {
    method: 'PUT',
    body: JSON.stringify(tokens),
  });
}

export async function importEmailItems(
  userId: string,
  items: ImportEmailItemInput[],
): Promise<ImportResult> {
  return taskApiRequest<ImportResult>(`/api/email/users/${userId}/items`, {
    method: 'POST',
    body: JSON.stringify({items}),
  });
}

export async function cleanupEmailItems(userId: string, daysOld: number): Promise<number> {
  const result = await taskApiRequest<{deleted: number}>(`/api/email/users/${userId}/cleanup`, {
    method: 'DELETE',
    body: JSON.stringify({daysOld}),
  });
  return result.deleted;
}

// Stats reporting

export async function reportTaskRunnerStats(successCount: number, failCount: number): Promise<void> {
  try {
    await taskApiRequest('/api/stats/task-runner', {
      method: 'POST',
      body: JSON.stringify({successCount, failCount}),
    });
    console.log(`📊 Reported task stats: ${successCount} success, ${failCount} fail`);
  } catch (error) {
    console.error('Error reporting task stats:', error);
  }
}

export async function reportEmailProcessorStats(
  usersProcessed: number,
  emailsParsed: number,
  linksFound: number,
): Promise<void> {
  try {
    await taskApiRequest('/api/stats/email-processor', {
      method: 'POST',
      body: JSON.stringify({usersProcessed, emailsParsed, linksFound}),
    });
    console.log(
      `📊 Reported email stats: ${usersProcessed} users, ${emailsParsed} emails, ${linksFound} links`,
    );
  } catch (error) {
    console.error('Error reporting email stats:', error);
  }
}
