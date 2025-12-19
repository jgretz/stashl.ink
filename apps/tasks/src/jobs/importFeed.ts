import type PgBoss from 'pg-boss';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';
import {parseFeed} from '../utils/rssParser';
import type {CreateRssFeedItemInput} from '@stashl/domain/src/types';
import {connectToStashl, disconnectFromStashl, reconnectToStashl} from '../stashlConnection';

const MAX_ITEM_AGE_DAYS = 30;
const MAX_RETRIES = 2;

interface ImportFeedJob {
  feedId: string;
  feedUrl: string;
}

function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('connection_closed') || msg.includes('connection closed');
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as {code: string}).code === 'CONNECTION_CLOSED';
  }
  return false;
}

export async function importFeedHandler(jobs: PgBoss.Job<ImportFeedJob>[]) {
  if (jobs.length === 0) return;

  console.log(`Processing batch of ${jobs.length} feed imports`);

  await connectToStashl();

  try {
    for (const job of jobs) {
      await processJobWithRetry(job);
    }
  } finally {
    await disconnectFromStashl();
  }
}

async function processJobWithRetry(job: PgBoss.Job<ImportFeedJob>, attempt = 1): Promise<void> {
  try {
    await processJob(job);
  } catch (error) {
    if (isConnectionError(error) && attempt <= MAX_RETRIES) {
      console.log(`🔄 Connection error, reconnecting (attempt ${attempt + 1})...`);
      await reconnectToStashl();
      return processJobWithRetry(job, attempt + 1);
    }
    throw error;
  }
}

async function processJob(job: PgBoss.Job<ImportFeedJob>) {
  const {feedId, feedUrl} = job.data;
  console.log(`Importing feed ${feedId}: ${feedUrl}`);

  const service = new RssFeedService();

  try {
    const feed = await parseFeed(feedUrl);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_ITEM_AGE_DAYS);

    const items: CreateRssFeedItemInput[] = feed.items
      .filter((item) => {
        if (!item.pubDate) return true;
        return new Date(item.pubDate) > cutoffDate;
      })
      .map((item) => ({
        feedId,
        guid: item.guid || item.link || `${item.title}-${item.pubDate}`,
        title: item.title || 'Untitled',
        link: item.link || '',
        summary: item.contentSnippet || item.summary,
        content: item.content,
        imageUrl: extractImageUrl(item),
        pubDate: parsePubDate(item.pubDate),
      }));

    const result = await service.importFeedItems(feedId, items);
    console.log(`Feed ${feedId}: imported ${result.newItems.length} new items, skipped ${result.skipped} existing`);
  } catch (error) {
    console.error(`Failed to import feed ${feedId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await service.recordImportError(feedId, errorMessage);
    throw error;
  }
}

function parsePubDate(pubDate: string | undefined): Date {
  if (!pubDate) return new Date();

  const parsed = new Date(pubDate);
  if (isNaN(parsed.getTime())) return new Date();

  return parsed;
}

function extractImageUrl(item: any): string | undefined {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.['$']?.url) return item['media:content']['$'].url;
  if (item['media:thumbnail']?.['$']?.url) return item['media:thumbnail']['$'].url;

  // Try to extract from content
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  return imgMatch?.[1];
}
