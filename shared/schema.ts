import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  woocommerce_id: integer("woocommerce_id").unique(),
  name: text("name").notNull(),
  sku: text("sku").unique(),
  description: text("description"),
  regular_price: decimal("regular_price", { precision: 10, scale: 2 }).notNull(),
  sale_price: decimal("sale_price", { precision: 10, scale: 2 }),
  stock_quantity: integer("stock_quantity").default(0),
  stock_status: text("stock_status").default("instock"),
  category_ids: json("category_ids").$type<number[] | null>().default(null),
  image_url: text("image_url"),
  barcode: text("barcode"),
  tax_class: text("tax_class").default("standard"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  woocommerce_id: integer("woocommerce_id").unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parent_id: integer("parent_id"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  woocommerce_id: integer("woocommerce_id"),
  order_number: text("order_number").notNull().unique(),
  status: text("status").default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_total: decimal("tax_total", { precision: 10, scale: 2 }).default("0"),
  discount_total: decimal("discount_total", { precision: 10, scale: 2 }).default("0"),
  coupon_code: text("coupon_code"),
  cashier_name: text("cashier_name").notNull(),
  payment_method: text("payment_method").default("cash"),
  payment_details: json("payment_details"),
  line_items: json("line_items").$type<OrderLineItem[]>().notNull(),
  synced: boolean("synced").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  woocommerce_id: integer("woocommerce_id").unique(),
  code: text("code").notNull().unique(),
  discount_type: text("discount_type").notNull(), // percentage, fixed_cart, fixed_product
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  minimum_amount: decimal("minimum_amount", { precision: 10, scale: 2 }),
  maximum_amount: decimal("maximum_amount", { precision: 10, scale: 2 }),
  usage_limit: integer("usage_limit"),
  used_count: integer("used_count").default(0),
  expires_at: timestamp("expires_at"),
  enabled: boolean("enabled").default(true),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  store_name: text("store_name").notNull().default("B-Plus Retail Store"),
  store_address: text("store_address").default("123 Commerce Street, Downtown"),
  store_phone: text("store_phone").default("(555) 123-4567"),
  tax_rate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0.085"), // 8.5%
  tax_inclusive: boolean("tax_inclusive").default(false),
  currency: text("currency").default("USD"),
  currency_symbol: text("currency_symbol").default("$"),
  woocommerce_url: text("woocommerce_url"),
  woocommerce_consumer_key: text("woocommerce_consumer_key"),
  woocommerce_consumer_secret: text("woocommerce_consumer_secret"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  woocommerce_id: integer("woocommerce_id").unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address_line_1: text("address_line_1"),
  address_line_2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  postal_code: text("postal_code"),
  country: text("country").default("US"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  synced: boolean("synced").default(false),
});

// Authentication Users (Admin and Cashier)
export const authUsers = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' or 'cashier'
  full_name: text("full_name"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Types
export type OrderLineItem = {
  product_id: number;
  woocommerce_id?: number;
  name: string;
  sku?: string;
  quantity: number;
  price: string;
  total: string;
  image_url?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type CartTotals = {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
};

// Schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAuthUserSchema = createInsertSchema(authUsers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Inferred types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
