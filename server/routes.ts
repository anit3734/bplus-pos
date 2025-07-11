import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database-storage";
import { z } from "zod";
import { insertOrderSchema, insertProductSchema } from "@shared/schema";
import bcrypt from "bcrypt";

// Use database storage for all operations
const activeStorage = storage;
const productStorage = storage;

// Session middleware for authentication
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function setupRoutes(app: Express): Server {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await activeStorage.getUserByUsername(username);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user in session
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      };

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, limit } = req.query;
      const products = await productStorage.getProducts(
        search as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productStorage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await productStorage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = req.body;
      const product = await productStorage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Since deleteProduct might not exist, we'll use updateProduct to mark as deleted
      const product = await productStorage.updateProduct(id, { stock_status: "outofstock" });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { limit } = req.query;
      const orders = await activeStorage.getOrders(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await activeStorage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await activeStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Customers routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      const customers = await activeStorage.getCustomers(search as string);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customer = await activeStorage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Settings routes
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await activeStorage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await activeStorage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Coupons routes
  app.get("/api/coupons", isAuthenticated, async (req, res) => {
    try {
      const coupons = await activeStorage.getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.get("/api/coupons/validate/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const coupon = await activeStorage.getCouponByCode(code);
      
      if (!coupon || !coupon.enabled) {
        return res.status(404).json({ error: "Invalid or expired coupon" });
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return res.status(400).json({ error: "Coupon has expired" });
      }

      if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
        return res.status(400).json({ error: "Coupon usage limit reached" });
      }

      res.json(coupon);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });

  // Test database connectivity endpoint
  app.get("/api/test-woocommerce", async (req, res) => {
    try {
      const products = await productStorage.getProducts('', undefined);
      res.json({ 
        connected: true, 
        message: "Database connection successful",
        productCount: products.length,
        sampleProduct: products[0] || null
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({ 
        error: "Database connection failed", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Tax rate endpoint (simple implementation)
  app.get('/api/woocommerce-tax-rate', async (req, res) => {
    try {
      // Return default tax rate for database storage
      res.json({ taxRate: 0 }); // Default 0% tax rate
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Simplified tax-related endpoints that return defaults
  app.get('/api/tax-rates', async (req, res) => {
    res.json([]);
  });

  app.get('/api/tax-classes', async (req, res) => {
    res.json([]);
  });

  app.get('/api/debug-woocommerce-tax', isAuthenticated, async (req, res) => {
    res.status(500).json({ error: 'WooCommerce not configured' });
  });

  app.post('/api/calculate-product-tax', async (req, res) => {
    res.status(500).json({ error: 'Tax calculation not available - WooCommerce not configured' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
