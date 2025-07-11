import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });