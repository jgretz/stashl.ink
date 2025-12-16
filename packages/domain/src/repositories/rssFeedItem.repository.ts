import {eq, and, desc, inArray, lt} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {rssFeedItems, type RssFeedItem, type NewRssFeedItem} from '../db/schema';
import type {RssFeedItemRepository, CreateRssFeedItemInput, UpdateRssFeedItemInput} from '../types';

export class DrizzleRssFeedItemRepository implements RssFeedItemRepository {
  async create(input: CreateRssFeedItemInput): Promise<RssFeedItem> {
    const db = getDb();
    const [item] = await db.insert(rssFeedItems).values(input as NewRssFeedItem).returning();
    return item;
  }

  async createMany(inputs: CreateRssFeedItemInput[]): Promise<RssFeedItem[]> {
    const db = getDb();
    if (inputs.length === 0) return [];
    return await db.insert(rssFeedItems).values(inputs as NewRssFeedItem[]).returning();
  }

  async findById(id: string): Promise<RssFeedItem | null> {
    const db = getDb();
    const [item] = await db.select().from(rssFeedItems).where(eq(rssFeedItems.id, id)).limit(1);
    return item || null;
  }

  async findByFeedId(feedId: string, limit = 50): Promise<RssFeedItem[]> {
    const db = getDb();
    return await db
      .select()
      .from(rssFeedItems)
      .where(eq(rssFeedItems.feedId, feedId))
      .orderBy(desc(rssFeedItems.pubDate))
      .limit(limit);
  }

  async findByGuid(feedId: string, guid: string): Promise<RssFeedItem | null> {
    const db = getDb();
    const [item] = await db
      .select()
      .from(rssFeedItems)
      .where(and(eq(rssFeedItems.feedId, feedId), eq(rssFeedItems.guid, guid)))
      .limit(1);
    return item || null;
  }

  async findExistingGuids(feedId: string, guids: string[]): Promise<string[]> {
    const db = getDb();
    if (guids.length === 0) return [];
    const items = await db
      .select({guid: rssFeedItems.guid})
      .from(rssFeedItems)
      .where(and(eq(rssFeedItems.feedId, feedId), inArray(rssFeedItems.guid, guids)));
    return items.map((i) => i.guid);
  }

  async findUnreadByFeedIds(feedIds: string[], limit = 100, offset = 0): Promise<RssFeedItem[]> {
    const db = getDb();
    if (feedIds.length === 0) return [];
    return await db
      .select()
      .from(rssFeedItems)
      .where(and(inArray(rssFeedItems.feedId, feedIds), eq(rssFeedItems.read, false)))
      .orderBy(desc(rssFeedItems.pubDate))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, input: UpdateRssFeedItemInput): Promise<RssFeedItem | null> {
    const db = getDb();
    const [item] = await db
      .update(rssFeedItems)
      .set(input)
      .where(eq(rssFeedItems.id, id))
      .returning();
    return item || null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(rssFeedItems).where(eq(rssFeedItems.id, id)).returning();
    return result.length > 0;
  }

  async deleteOlderThan(feedId: string, date: Date): Promise<number> {
    const db = getDb();
    const result = await db
      .delete(rssFeedItems)
      .where(and(eq(rssFeedItems.feedId, feedId), lt(rssFeedItems.createdAt, date)))
      .returning();
    return result.length;
  }

  async markAllAsRead(feedId: string): Promise<number> {
    const db = getDb();
    const result = await db
      .update(rssFeedItems)
      .set({read: true})
      .where(and(eq(rssFeedItems.feedId, feedId), eq(rssFeedItems.read, false)))
      .returning();
    return result.length;
  }

  async markAllAsReadByFeedIds(feedIds: string[]): Promise<number> {
    const db = getDb();
    if (feedIds.length === 0) return 0;
    const result = await db
      .update(rssFeedItems)
      .set({read: true})
      .where(and(inArray(rssFeedItems.feedId, feedIds), eq(rssFeedItems.read, false)))
      .returning();
    return result.length;
  }
}
