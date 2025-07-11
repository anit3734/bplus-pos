#!/usr/bin/env tsx
// Simple database initialization script that can be run standalone
import 'dotenv/config';
import { initializeDatabase } from './init-db';

async function main() {
  try {
    console.log('🚀 Starting database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
