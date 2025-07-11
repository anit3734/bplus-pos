-- ====================================================================
-- B-Plus POS Database Schema
-- Generated on: July 11, 2025
-- Database System: PostgreSQL
-- ORM: Drizzle ORM
-- ====================================================================

-- This file contains the complete database structure for the B-Plus POS system
-- including all tables, constraints, and default values.

-- ====================================================================
-- AUTHENTICATION USERS TABLE
-- ====================================================================
-- Stores admin and cashier user accounts with role-based access
CREATE TABLE "auth_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL, -- 'admin' or 'cashier'
	"full_name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_username_unique" UNIQUE("username")
);

-- Default admin user (password: admin123)
-- INSERT INTO auth_users (username, password_hash, role, full_name) 
-- VALUES ('admin', '$2b$10$[hash]', 'admin', 'System Administrator');

-- ====================================================================
-- CATEGORIES TABLE  
-- ====================================================================
-- Product categories for organization and WooCommerce sync
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" integer,
	CONSTRAINT "categories_woocommerce_id_unique" UNIQUE("woocommerce_id")
);

-- Add foreign key constraint for parent categories
-- ALTER TABLE categories ADD CONSTRAINT fk_parent_category 
-- FOREIGN KEY (parent_id) REFERENCES categories(id);

-- ====================================================================
-- COUPONS TABLE
-- ====================================================================
-- Discount coupons and promotional codes
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"code" text NOT NULL,
	"discount_type" text NOT NULL, -- 'percentage', 'fixed_cart', 'fixed_product'
	"amount" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2),
	"maximum_amount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"enabled" boolean DEFAULT true,
	CONSTRAINT "coupons_woocommerce_id_unique" UNIQUE("woocommerce_id"),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);

-- ====================================================================
-- CUSTOMERS TABLE
-- ====================================================================
-- Customer information and contact details
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address_line_1" text,
	"address_line_2" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text DEFAULT 'US',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"synced" boolean DEFAULT false, -- WooCommerce sync status
	CONSTRAINT "customers_woocommerce_id_unique" UNIQUE("woocommerce_id")
);

-- ====================================================================
-- ORDERS TABLE
-- ====================================================================
-- Sales transactions and order history
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending', -- 'pending', 'completed', 'refunded', etc.
	"total" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_total" numeric(10, 2) DEFAULT '0',
	"discount_total" numeric(10, 2) DEFAULT '0',
	"coupon_code" text,
	"cashier_name" text NOT NULL,
	"payment_method" text DEFAULT 'cash', -- 'cash', 'card', 'digital', etc.
	"payment_details" json, -- Additional payment information
	"line_items" json NOT NULL, -- Array of OrderLineItem objects
	"synced" boolean DEFAULT false, -- WooCommerce sync status
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);

-- ====================================================================
-- PRODUCTS TABLE
-- ====================================================================
-- Product inventory and catalog management
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"name" text NOT NULL,
	"sku" text,
	"description" text,
	"regular_price" numeric(10, 2) NOT NULL,
	"sale_price" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0,
	"stock_status" text DEFAULT 'instock', -- 'instock', 'outofstock', 'onbackorder'
	"category_ids" json DEFAULT 'null'::json, -- Array of category IDs
	"image_url" text,
	"barcode" text,
	"tax_class" text DEFAULT 'standard',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_woocommerce_id_unique" UNIQUE("woocommerce_id"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);

-- ====================================================================
-- SETTINGS TABLE
-- ====================================================================
-- Store configuration and WooCommerce integration settings
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" text DEFAULT 'B-Plus Retail Store' NOT NULL,
	"store_address" text DEFAULT '123 Commerce Street, Downtown',
	"store_phone" text DEFAULT '(555) 123-4567',
	"tax_rate" numeric(5, 4) DEFAULT '0.085', -- 8.5% tax rate
	"tax_inclusive" boolean DEFAULT false,
	"currency" text DEFAULT 'USD',
	"currency_symbol" text DEFAULT '$',
	"woocommerce_url" text,
	"woocommerce_consumer_key" text,
	"woocommerce_consumer_secret" text
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
-- Create indexes for frequently queried columns

-- Products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_woocommerce_id ON products(woocommerce_id);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Orders indexes  
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_cashier_name ON orders(cashier_name);

-- Customers indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_woocommerce_id ON customers(woocommerce_id);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Coupons indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_enabled ON coupons(enabled);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- Auth users indexes
CREATE INDEX idx_auth_users_username ON auth_users(username);
CREATE INDEX idx_auth_users_role ON auth_users(role);
CREATE INDEX idx_auth_users_is_active ON auth_users(is_active);

-- ====================================================================
-- SAMPLE DATA INSERTS
-- ====================================================================

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password: admin123)
-- Note: This should be done through the application's initialization process
-- INSERT INTO auth_users (username, password_hash, role, full_name) 
-- VALUES ('admin', '$2b$10$hash_here', 'admin', 'System Administrator')
-- ON CONFLICT (username) DO NOTHING;

-- Sample product categories
-- INSERT INTO categories (name, slug) VALUES 
-- ('Electronics', 'electronics'),
-- ('Clothing', 'clothing'),
-- ('Books', 'books'),
-- ('Home & Garden', 'home-garden');

-- ====================================================================
-- JSON SCHEMA DOCUMENTATION
-- ====================================================================

-- OrderLineItem JSON structure:
-- {
--   "product_id": number,
--   "woocommerce_id": number (optional),
--   "name": string,
--   "sku": string (optional),
--   "quantity": number,
--   "price": string,
--   "total": string,
--   "image_url": string (optional)
-- }

-- Payment Details JSON structure:
-- {
--   "transaction_id": string (optional),
--   "card_last_four": string (optional),
--   "authorization_code": string (optional),
--   "reference_number": string (optional),
--   "notes": string (optional)
-- }

-- Category IDs JSON structure:
-- [1, 2, 3] - Array of category ID numbers

-- ====================================================================
-- BACKUP AND MAINTENANCE COMMANDS
-- ====================================================================

-- Create backup:
-- pg_dump -h hostname -U username -d database_name > bplus_pos_backup.sql

-- Restore backup:
-- psql -h hostname -U username -d database_name < bplus_pos_backup.sql

-- Vacuum and analyze for performance:
-- VACUUM ANALYZE;

-- Check table sizes:
-- SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats;

-- ====================================================================
-- DATABASE MIGRATION HISTORY
-- ====================================================================
-- This schema represents the current state of the B-Plus POS database
-- Generated from Drizzle ORM schema definitions
-- 
-- Migration: 0000_rare_pet_avengers.sql
-- Created: July 11, 2025
-- 
-- For future migrations, use:
-- npx drizzle-kit generate
-- npx drizzle-kit push
-- ====================================================================
