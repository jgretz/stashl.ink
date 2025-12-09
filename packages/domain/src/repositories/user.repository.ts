import {eq} from 'drizzle-orm';
import {getDb} from '../db/connection';
import {users, type User, type NewUser} from '../db/schema';
import type {UserRepository, CreateUserInput, UpdateUserInput} from '../types';

export class DrizzleUserRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const db = getDb();
    const now = new Date();
    
    const newUser: NewUser = {
      email: input.email,
      name: input.name,
      password: input.password,
      createdAt: now,
      updatedAt: now,
    };

    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async findAll(): Promise<User[]> {
    const db = getDb();
    return await db.select().from(users);
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const db = getDb();
    const updatedFields: Partial<User> = {
      ...input,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updatedFields)
      .where(eq(users.id, id))
      .returning();
    
    return user || null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const db = getDb();
    const result = await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    
    return result.length > 0;
  }

  async findByResetToken(token: string): Promise<User | null> {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token))
      .limit(1);
    
    return user || null;
  }

  async clearResetToken(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
}