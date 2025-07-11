import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

// Get DATABASE_URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error(`
❌ DATABASE_URL is not set!

Please set one of these environment variables:
- DATABASE_URL
- POSTGRES_URL

Examples:
- For Railway: Use the POSTGRES_URL provided in your service variables
- For local dev: postgresql://postgres:password@localhost:5432/bplus_pos
- For Neon: Your Neon database connection string

Copy .env.example to .env and configure your database URL.
`);
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log("Connecting to database:", DATABASE_URL.replace(/\/\/[^@]+@/, '//***:***@'));

// Check if this is a Railway or standard PostgreSQL connection
const isRailway = DATABASE_URL.includes('railway.app') || DATABASE_URL.includes('rlwy.net');
const isNeon = DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('neon.db');

let pool: any;
let db: any;

if (isNeon) {
  // Use Neon serverless for Neon databases
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use standard PostgreSQL client for Railway and other providers
  pool = new PgPool({ 
    connectionString: DATABASE_URL,
    ssl: isRailway ? { rejectUnauthorized: false } : undefined
  });
  db = drizzlePg(pool, { schema });
}

export { pool, db };