import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Hardcoded Railway PostgreSQL URL - no environment variables needed
const DATABASE_URL = "postgresql://postgres:kLABXvOMDLEkQEeoIGUwZZjKnWAJCcBM@centerbeam.proxy.rlwy.net:24504/railway";

console.log("🔗 Connecting to Railway PostgreSQL database...");

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
export { schema };