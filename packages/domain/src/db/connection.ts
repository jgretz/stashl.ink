import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sql: ReturnType<typeof postgres> | null = null;

export function initializeDatabase(connectionString?: string): void {
  const databaseUrl = connectionString || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Close existing connection if reinitializing
  if (sql) {
    sql.end().catch(() => {});
    sql = null;
    db = null;
  }

  sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 300,
    connect_timeout: 30,
  });

  db = drizzle(sql, {schema});
}

export function getDb(): ReturnType<typeof drizzle> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    throw new Error('SQL connection not initialized. Call initializeDatabase() first.');
  }
  return sql;
}

export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
  }
}
