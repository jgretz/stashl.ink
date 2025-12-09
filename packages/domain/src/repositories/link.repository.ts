import {eq, and, desc} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {links, type Link, type NewLink} from '../db/schema';
import type {LinkRepository, CreateLinkInput, UpdateLinkInput} from '../types';

export class DrizzleLinkRepository implements LinkRepository {
  async create(input: CreateLinkInput, userId: string): Promise<Link> {
    const db = getDb();
    
    const newLink: NewLink = {
      url: input.url,
      title: input.title,
      description: input.description,
      dateAdded: new Date(),
      userId,
    };

    const [link] = await db.insert(links).values(newLink).returning();
    return link;
  }

  async findById(id: string): Promise<Link | null> {
    const db = getDb();
    const [link] = await db.select().from(links).where(eq(links.id, id)).limit(1);
    return link || null;
  }

  async findAllByUser(userId: string): Promise<Link[]> {
    const db = getDb();
    return await db
      .select()
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.dateAdded));
  }

  async findAll(): Promise<Link[]> {
    const db = getDb();
    return await db.select().from(links).orderBy(desc(links.dateAdded));
  }

  async update(id: string, input: UpdateLinkInput): Promise<Link | null> {
    const db = getDb();
    
    const [link] = await db
      .update(links)
      .set(input)
      .where(eq(links.id, id))
      .returning();
    
    return link || null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(links).where(eq(links.id, id)).returning();
    return result.length > 0;
  }
}