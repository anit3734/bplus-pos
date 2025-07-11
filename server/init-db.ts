import { db } from './db';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import bcrypt from 'bcrypt';

export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Test database connection
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');

    // Check if tables exist by trying to query one of them
    try {
      const existingSettings = await db.select().from(schema.settings).limit(1);
      console.log('✅ Database tables already exist');
      
      // Check if we have any admin users
      const adminUsers = await db.select()
        .from(schema.authUsers)
        .where(sql`${schema.authUsers.role} = 'admin'`)
        .limit(1);

      if (adminUsers.length === 0) {
        console.log('🔄 Creating default admin user...');
        await createDefaultAdmin();
      } else {
        console.log('✅ Admin user already exists');
      }

      return true;
    } catch (error) {
      console.log('⚠️ Tables do not exist, creating database schema...');
      await createDatabaseSchema();
      await seedInitialData();
      return true;
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createDatabaseSchema() {
  try {
    console.log('🔄 Creating database tables...');

    // Create tables using raw SQL since we're using Neon and drizzle-kit might not be available
    await db.execute(sql`
      -- Create auth_users table
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        woocommerce_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        parent_id INTEGER
      );

      -- Create products table
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        woocommerce_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        description TEXT,
        regular_price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        stock_status TEXT DEFAULT 'instock',
        category_ids JSON DEFAULT NULL,
        image_url TEXT,
        barcode TEXT,
        tax_class TEXT DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        woocommerce_id INTEGER UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address_line_1 TEXT,
        address_line_2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT false
      );

      -- Create orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        woocommerce_id INTEGER,
        order_number TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_total DECIMAL(10,2) DEFAULT 0,
        discount_total DECIMAL(10,2) DEFAULT 0,
        coupon_code TEXT,
        cashier_name TEXT NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        payment_details JSON,
        line_items JSON NOT NULL,
        synced BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create coupons table
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        woocommerce_id INTEGER UNIQUE,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        minimum_amount DECIMAL(10,2),
        maximum_amount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        enabled BOOLEAN DEFAULT true
      );

      -- Create settings table
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL DEFAULT 'B-Plus Retail Store',
        store_address TEXT DEFAULT '123 Commerce Street, Downtown',
        store_phone TEXT DEFAULT '(555) 123-4567',
        tax_rate DECIMAL(5,4) DEFAULT 0.085,
        tax_inclusive BOOLEAN DEFAULT false,
        currency TEXT DEFAULT 'USD',
        currency_symbol TEXT DEFAULT '$',
        woocommerce_url TEXT,
        woocommerce_consumer_key TEXT,
        woocommerce_consumer_secret TEXT
      );
    `);

    console.log('✅ Database schema created successfully');
  } catch (error) {
    console.error('❌ Failed to create database schema:', error);
    throw error;
  }
}

async function seedInitialData() {
  try {
    console.log('🔄 Seeding initial data...');

    // Create default admin user
    await createDefaultAdmin();

    // Create default settings
    await db.insert(schema.settings).values({
      store_name: 'B-Plus Retail Store',
      store_address: '123 Commerce Street, Downtown',
      store_phone: '(555) 123-4567',
      tax_rate: '0.085',
      currency: 'USD',
      currency_symbol: '$',
    });

    // Create default category
    await db.insert(schema.categories).values({
      name: 'General',
      slug: 'general',
    });

    // Create some sample products
    const [category] = await db.select().from(schema.categories).limit(1);
    
    await db.insert(schema.products).values([
      {
        name: 'Sample Product 1',
        sku: 'SAMPLE-001',
        description: 'This is a sample product for testing',
        regular_price: '19.99',
        stock_quantity: 100,
        stock_status: 'instock',
        category_ids: [category.id],
      },
      {
        name: 'Sample Product 2',
        sku: 'SAMPLE-002',
        description: 'Another sample product',
        regular_price: '29.99',
        sale_price: '24.99',
        stock_quantity: 50,
        stock_status: 'instock',
        category_ids: [category.id],
      },
    ]);

    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
    throw error;
  }
}

async function createDefaultAdmin() {
  const defaultPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await db.insert(schema.authUsers).values({
    username: 'admin',
    password_hash: hashedPassword,
    role: 'admin',
    full_name: 'Administrator',
    is_active: true,
  });

  console.log('✅ Default admin user created');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   ⚠️  Please change the default password after first login!');
}
