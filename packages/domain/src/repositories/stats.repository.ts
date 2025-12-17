import {eq, desc} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {stats, type Stats, type NewStats} from '../db/schema';
import type {StatsRepository, CreateStatsInput} from '../types';

export class DrizzleStatsRepository implements StatsRepository {
  async create(input: CreateStatsInput): Promise<Stats> {
    const db = getDb();

    const newStat: NewStats = {
      type: input.type,
      data: input.data,
      statTime: input.statTime || new Date(),
    };

    const [stat] = await db.insert(stats).values(newStat).returning();
    return stat;
  }

  async getLatestByType(type: string): Promise<Stats | null> {
    const db = getDb();
    const [stat] = await db
      .select()
      .from(stats)
      .where(eq(stats.type, type))
      .orderBy(desc(stats.statTime))
      .limit(1);
    return stat || null;
  }
}
