import { defineConfig } from "drizzle-kit";

// Hardcoded Railway PostgreSQL URL
const DATABASE_URL = "postgresql://postgres:kLABXvOMDLEkQEeoIGUwZZjKnWAJCcBM@centerbeam.proxy.rlwy.net:24504/railway";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
