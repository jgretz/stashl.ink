import {eq, and, desc, inArray, lt} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {emailItems, type EmailItem, type NewEmailItem} from '../db/schema';
import type {EmailItemRepository, CreateEmailItemInput, UpdateEmailItemInput} from '../types';

export class DrizzleEmailItemRepository implements EmailItemRepository {
  async create(input: CreateEmailItemInput): Promise<EmailItem> {
    const db = getDb();
    const [item] = await db.insert(emailItems).values(input as NewEmailItem).returning();
    return item;
  }

  async createMany(inputs: CreateEmailItemInput[]): Promise<EmailItem[]> {
    const db = getDb();
    if (inputs.length === 0) return [];
    return await db.insert(emailItems).values(inputs as NewEmailItem[]).returning();
  }

  async findById(id: string): Promise<EmailItem | null> {
    const db = getDb();
    const [item] = await db.select().from(emailItems).where(eq(emailItems.id, id)).limit(1);
    return item || null;
  }

  async findByUserId(userId: string, limit = 100, offset = 0): Promise<EmailItem[]> {
    const db = getDb();
    return await db
      .select()
      .from(emailItems)
      .where(eq(emailItems.userId, userId))
      .orderBy(desc(emailItems.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findUnreadByUserId(userId: string, limit = 100, offset = 0): Promise<EmailItem[]> {
    const db = getDb();
    return await db
      .select()
      .from(emailItems)
      .where(and(eq(emailItems.userId, userId), eq(emailItems.read, false)))
      .orderBy(desc(emailItems.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async existsByUserMessageLink(userId: string, emailMessageId: string, link: string): Promise<boolean> {
    const db = getDb();
    const [item] = await db
      .select({id: emailItems.id})
      .from(emailItems)
      .where(
        and(eq(emailItems.userId, userId), eq(emailItems.emailMessageId, emailMessageId), eq(emailItems.link, link)),
      )
      .limit(1);
    return !!item;
  }

  async findExistingLinks(userId: string, emailMessageId: string, links: string[]): Promise<string[]> {
    const db = getDb();
    if (links.length === 0) return [];
    const items = await db
      .select({link: emailItems.link})
      .from(emailItems)
      .where(
        and(eq(emailItems.userId, userId), eq(emailItems.emailMessageId, emailMessageId), inArray(emailItems.link, links)),
      );
    return items.map((i) => i.link);
  }

  async update(id: string, input: UpdateEmailItemInput): Promise<EmailItem | null> {
    const db = getDb();
    const [item] = await db.update(emailItems).set(input).where(eq(emailItems.id, id)).returning();
    return item || null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(emailItems).where(eq(emailItems.id, id)).returning();
    return result.length > 0;
  }

  async deleteOlderThan(userId: string, date: Date): Promise<number> {
    const db = getDb();
    const result = await db
      .delete(emailItems)
      .where(and(eq(emailItems.userId, userId), lt(emailItems.createdAt, date)))
      .returning();
    return result.length;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const db = getDb();
    const result = await db
      .update(emailItems)
      .set({read: true})
      .where(and(eq(emailItems.userId, userId), eq(emailItems.read, false)))
      .returning();
    return result.length;
  }
}
