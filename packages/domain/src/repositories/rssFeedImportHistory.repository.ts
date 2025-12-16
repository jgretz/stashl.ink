import {eq, desc, and} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {rssFeedImportHistory, type RssFeedImportHistory, type NewRssFeedImportHistory} from '../db/schema';
import type {RssFeedImportHistoryRepository, CreateImportHistoryInput} from '../types';

export class DrizzleRssFeedImportHistoryRepository implements RssFeedImportHistoryRepository {
  async create(input: CreateImportHistoryInput): Promise<RssFeedImportHistory> {
    const db = getDb();
    const [history] = await db
      .insert(rssFeedImportHistory)
      .values(input as NewRssFeedImportHistory)
      .returning();
    return history;
  }

  async findByFeedId(feedId: string, limit = 10): Promise<RssFeedImportHistory[]> {
    const db = getDb();
    return await db
      .select()
      .from(rssFeedImportHistory)
      .where(eq(rssFeedImportHistory.feedId, feedId))
      .orderBy(desc(rssFeedImportHistory.importDate))
      .limit(limit);
  }

  async getLatestForFeed(feedId: string): Promise<RssFeedImportHistory | null> {
    const db = getDb();
    const [history] = await db
      .select()
      .from(rssFeedImportHistory)
      .where(eq(rssFeedImportHistory.feedId, feedId))
      .orderBy(desc(rssFeedImportHistory.importDate))
      .limit(1);
    return history || null;
  }

  async getLatestSuccessfulForFeed(feedId: string): Promise<RssFeedImportHistory | null> {
    const db = getDb();
    const [history] = await db
      .select()
      .from(rssFeedImportHistory)
      .where(and(eq(rssFeedImportHistory.feedId, feedId), eq(rssFeedImportHistory.status, 'success')))
      .orderBy(desc(rssFeedImportHistory.importDate))
      .limit(1);
    return history || null;
  }
}
