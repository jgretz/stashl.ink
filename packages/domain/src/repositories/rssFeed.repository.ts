import {eq, and, desc} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {rssFeeds, type RssFeed, type NewRssFeed} from '../db/schema';
import type {RssFeedRepository, CreateRssFeedInput, UpdateRssFeedInput} from '../types';

export class DrizzleRssFeedRepository implements RssFeedRepository {
  async create(input: CreateRssFeedInput, userId: string): Promise<RssFeed> {
    const db = getDb();

    const newFeed: NewRssFeed = {
      title: input.title,
      feedUrl: input.feedUrl,
      siteUrl: input.siteUrl,
      userId,
    };

    const [feed] = await db.insert(rssFeeds).values(newFeed).returning();
    return feed;
  }

  async findById(id: string): Promise<RssFeed | null> {
    const db = getDb();
    const [feed] = await db.select().from(rssFeeds).where(eq(rssFeeds.id, id)).limit(1);
    return feed || null;
  }

  async findAllByUser(userId: string): Promise<RssFeed[]> {
    const db = getDb();
    return await db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.userId, userId))
      .orderBy(desc(rssFeeds.createdAt));
  }

  async findByFeedUrl(feedUrl: string, userId: string): Promise<RssFeed | null> {
    const db = getDb();
    const [feed] = await db
      .select()
      .from(rssFeeds)
      .where(and(eq(rssFeeds.feedUrl, feedUrl), eq(rssFeeds.userId, userId)))
      .limit(1);
    return feed || null;
  }

  async findAll(): Promise<RssFeed[]> {
    const db = getDb();
    return await db.select().from(rssFeeds);
  }

  async update(id: string, input: UpdateRssFeedInput): Promise<RssFeed | null> {
    const db = getDb();
    const [feed] = await db
      .update(rssFeeds)
      .set({...input, updatedAt: new Date()})
      .where(eq(rssFeeds.id, id))
      .returning();
    return feed || null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(rssFeeds).where(eq(rssFeeds.id, id)).returning();
    return result.length > 0;
  }
}
