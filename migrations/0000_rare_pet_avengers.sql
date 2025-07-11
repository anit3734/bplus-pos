CREATE TABLE "auth_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"full_name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" integer,
	CONSTRAINT "categories_woocommerce_id_unique" UNIQUE("woocommerce_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
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
--> statement-breakpoint
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
	"synced" boolean DEFAULT false,
	CONSTRAINT "customers_woocommerce_id_unique" UNIQUE("woocommerce_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'pending',
	"total" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_total" numeric(10, 2) DEFAULT '0',
	"discount_total" numeric(10, 2) DEFAULT '0',
	"coupon_code" text,
	"cashier_name" text NOT NULL,
	"payment_method" text DEFAULT 'cash',
	"payment_details" json,
	"line_items" json NOT NULL,
	"synced" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"woocommerce_id" integer,
	"name" text NOT NULL,
	"sku" text,
	"description" text,
	"regular_price" numeric(10, 2) NOT NULL,
	"sale_price" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0,
	"stock_status" text DEFAULT 'instock',
	"category_ids" json DEFAULT 'null'::json,
	"image_url" text,
	"barcode" text,
	"tax_class" text DEFAULT 'standard',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_woocommerce_id_unique" UNIQUE("woocommerce_id"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" text DEFAULT 'B-Plus Retail Store' NOT NULL,
	"store_address" text DEFAULT '123 Commerce Street, Downtown',
	"store_phone" text DEFAULT '(555) 123-4567',
	"tax_rate" numeric(5, 4) DEFAULT '0.085',
	"tax_inclusive" boolean DEFAULT false,
	"currency" text DEFAULT 'USD',
	"currency_symbol" text DEFAULT '$',
	"woocommerce_url" text,
	"woocommerce_consumer_key" text,
	"woocommerce_consumer_secret" text
);
