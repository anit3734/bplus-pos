import { 
  products, categories, orders, coupons, settings, customers, authUsers,
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type Coupon, type InsertCoupon,
  type Settings, type InsertSettings,
  type Customer, type InsertCustomer,
  type AuthUser, type InsertAuthUser
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IAuthStorage {
  // Auth operations
  getUserByUsername(username: string): Promise<AuthUser | undefined>;
  createUser(user: InsertAuthUser): Promise<AuthUser>;
  updateUser(id: number, user: Partial<InsertAuthUser>): Promise<AuthUser | undefined>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  getAllCashiers(): Promise<AuthUser[]>;
  initializeDefaultUsers(): Promise<void>;
}

export interface IStorage {
  // Products
  getProducts(search?: string, categoryId?: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Orders
  getOrders(limit?: number): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getUnsyncedOrders(): Promise<Order[]>;

  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Auth operations
  getUserByUsername(username: string): Promise<AuthUser | undefined>;
  createUser(user: InsertAuthUser): Promise<AuthUser>;
  updateUser(id: number, user: Partial<InsertAuthUser>): Promise<AuthUser | undefined>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  getAllCashiers(): Promise<AuthUser[]>;
  initializeDefaultUsers(): Promise<void>;
}

export class DatabaseStorage implements IStorage, IAuthStorage {
  constructor() {
    this.initializeDefaultUsers();
  }

  // Auth operations
  async getUserByUsername(username: string): Promise<AuthUser | undefined> {
    const [user] = await db.select().from(authUsers).where(eq(authUsers.username, username));
    return user || undefined;
  }

  async createUser(user: InsertAuthUser): Promise<AuthUser> {
    const passwordHash = await bcrypt.hash(user.password_hash, 10);
    const [newUser] = await db
      .insert(authUsers)
      .values({ ...user, password_hash: passwordHash })
      .returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertAuthUser>): Promise<AuthUser | undefined> {
    const updateData: any = { ...user };
    if (user.password_hash) {
      updateData.password_hash = await bcrypt.hash(user.password_hash, 10);
    }
    const [updated] = await db
      .update(authUsers)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(authUsers.id, id))
      .returning();
    return updated || undefined;
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(passwordHash, 10);
    await db
      .update(authUsers)
      .set({ password_hash: hashedPassword, updated_at: new Date() })
      .where(eq(authUsers.id, id));
  }

  async getAllCashiers(): Promise<AuthUser[]> {
    return await db.select().from(authUsers).where(eq(authUsers.role, 'cashier'));
  }

  async initializeDefaultUsers(): Promise<void> {
    try {
      // Check if admin exists
      const existingAdmin = await this.getUserByUsername('admin');
      if (!existingAdmin) {
        const adminPasswordHash = await bcrypt.hash('123123', 10);
        await db.insert(authUsers).values({
          username: 'admin',
          password_hash: adminPasswordHash,
          role: 'admin',
          full_name: 'System Administrator',
          is_active: true,
        });
      }

      // Check if cashier exists
      const existingCashier = await this.getUserByUsername('cashier');
      if (!existingCashier) {
        const cashierPasswordHash = await bcrypt.hash('123', 10);
        await db.insert(authUsers).values({
          username: 'cashier',
          password_hash: cashierPasswordHash,
          role: 'cashier',
          full_name: 'POS Cashier',
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Error initializing default users:', error);
    }
  }

  // Products
  async getProducts(search?: string, categoryId?: number): Promise<Product[]> {
    if (search || categoryId) {
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            like(products.name, `%${search}%`),
            like(products.sku, `%${search}%`),
            like(products.barcode, `%${search}%`)
          )
        );
      }
      // Note: categoryId filtering would need JSON handling for category_ids array
      if (conditions.length > 0) {
        return await db.select().from(products).where(conditions.length === 1 ? conditions[0] : or(...conditions));
      }
    }
    
    return await db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const productData = {
      ...product,
      category_ids: Array.isArray(product.category_ids) ? product.category_ids : null
    };
    const [newProduct] = await db.insert(products).values(productData).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const productData = {
      ...product,
      category_ids: Array.isArray(product.category_ids) ? product.category_ids : null,
      updated_at: new Date()
    };
    const [updated] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Orders
  async getOrders(limit?: number): Promise<Order[]> {
    let query = db.select().from(orders).orderBy(desc(orders.created_at));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.order_number, orderNumber));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderData = {
      ...order,
      line_items: order.line_items as any[]
    };
    const [newOrder] = await db.insert(orders).values(orderData as any).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const orderData = {
      ...order,
      line_items: order.line_items ? (order.line_items as any[]) : undefined
    };
    const [updated] = await db
      .update(orders)
      .set(orderData as any)
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async getUnsyncedOrders(): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.synced, false));
  }

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons);
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon || undefined;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values(coupon).returning();
    return newCoupon;
  }

  async updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updated] = await db
      .update(coupons)
      .set(coupon)
      .where(eq(coupons.id, id))
      .returning();
    return updated || undefined;
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(settings).values({}).returning();
      return newSettings;
    }
    return setting;
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    const [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      const [newSettings] = await db.insert(settings).values(settingsData).returning();
      return newSettings;
    }
    const [updated] = await db
      .update(settings)
      .set(settingsData)
      .where(eq(settings.id, setting.id))
      .returning();
    return updated;
  }

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    if (search) {
      return await db.select().from(customers).where(
        or(
          like(customers.first_name, `%${search}%`),
          like(customers.last_name, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phone, `%${search}%`)
        )
      );
    }
    return await db.select().from(customers);
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updated_at: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();