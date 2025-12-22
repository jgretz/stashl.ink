import type PgBoss from 'pg-boss';
import {parseFeed} from '../utils/rssParser';
import {importFeedItems, recordFeedImportError, type ImportFeedItemInput} from '../apiClient';

const MAX_ITEM_AGE_DAYS = 30;

interface ImportFeedJob {
  feedId: string;
  feedUrl: string;
}

export async function importFeedHandler(jobs: PgBoss.Job<ImportFeedJob>[]) {
  if (jobs.length === 0) return;

  console.log(`Processing batch of ${jobs.length} feed imports`);

  for (const job of jobs) {
    await processJob(job);
  }
}

async function processJob(job: PgBoss.Job<ImportFeedJob>) {
  const {feedId, feedUrl} = job.data;
  console.log(`Importing feed ${feedId}: ${feedUrl}`);

  try {
    const feed = await parseFeed(feedUrl);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_ITEM_AGE_DAYS);

    const items: ImportFeedItemInput[] = feed.items
      .filter((item) => {
        if (!item.pubDate) return true;
        return new Date(item.pubDate) > cutoffDate;
      })
      .map((item) => ({
        guid: item.guid || item.link || `${item.title}-${item.pubDate}`,
        title: item.title || 'Untitled',
        link: item.link || '',
        summary: item.contentSnippet || item.summary,
        content: item.content,
        imageUrl: extractImageUrl(item),
        pubDate: parsePubDate(item.pubDate).toISOString(),
      }));

    const result = await importFeedItems(feedId, items);
    console.log(`Feed ${feedId}: imported ${result.newItems} new items, skipped ${result.skipped} existing`);
  } catch (error) {
    console.error(`Failed to import feed ${feedId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await recordFeedImportError(feedId, errorMessage);
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
