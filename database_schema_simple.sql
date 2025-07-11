-- B-Plus POS Database Tables - Simple Structure
-- ============================================

-- Authentication Users
CREATE TABLE auth_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    woocommerce_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id INTEGER
);

-- Discount Coupons
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    woocommerce_id INTEGER UNIQUE,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    minimum_amount NUMERIC(10,2),
    maximum_amount NUMERIC(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE
);

-- Customer Information
CREATE TABLE customers (
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    synced BOOLEAN DEFAULT FALSE
);

-- Sales Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    woocommerce_id INTEGER,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    total NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    tax_total NUMERIC(10,2) DEFAULT 0,
    discount_total NUMERIC(10,2) DEFAULT 0,
    coupon_code TEXT,
    cashier_name TEXT NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    payment_details JSON,
    line_items JSON NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product Inventory
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    woocommerce_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    regular_price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2),
    stock_quantity INTEGER DEFAULT 0,
    stock_status TEXT DEFAULT 'instock',
    category_ids JSON,
    image_url TEXT,
    barcode TEXT,
    tax_class TEXT DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Store Settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    store_name TEXT NOT NULL DEFAULT 'B-Plus Retail Store',
    store_address TEXT DEFAULT '123 Commerce Street, Downtown',
    store_phone TEXT DEFAULT '(555) 123-4567',
    tax_rate NUMERIC(5,4) DEFAULT 0.085,
    tax_inclusive BOOLEAN DEFAULT FALSE,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    woocommerce_url TEXT,
    woocommerce_consumer_key TEXT,
    woocommerce_consumer_secret TEXT
);
