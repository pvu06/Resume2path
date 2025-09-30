import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create database connection
let db: any;
if (process.env.POSTGRES_URL) {
  const connectionString = process.env.POSTGRES_URL;
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  // Mock db for build time or when no connection string
  db = {
    select: () => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => [] }) }) }) }),
    insert: () => ({ values: () => ({ onConflictDoNothing: () => ({ returning: () => [] }) }) })
  };
}

export { db };
