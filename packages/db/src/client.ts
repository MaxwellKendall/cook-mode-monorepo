import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '@cook-mode/config';
import * as schema from './schema.js';

let sql: ReturnType<typeof postgres> | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  if (!sql) {
    sql = postgres(databaseConfig.url, { prepare: false });
  }
  return sql;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getSql(), { schema });
  }
  return db;
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await getSql()`SELECT 1 as test`;
    return result.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
    db = null;
  }
}
