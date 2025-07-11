import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./database-storage";
import { wooCommerceStorage } from "./woocommerce-storage";
import { z } from "zod";
import { insertOrderSchema, insertProductSchema } from "@shared/schema";
import bcrypt from "bcrypt";

// Use database storage for all operations (includes WooCommerce integration)
const activeStorage = storage;

// Use WooCommerce storage for product operations when configured
const productStorage = process.env.WOOCOMMERCE_URL && 
                       process.env.WOOCOMMERCE_CONSUMER_KEY && 
                       process.env.WOOCOMMERCE_CONSUMER_SECRET 
                       ? wooCommerceStorage 
                       : storage;

// Session middleware for authentication
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const isAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Initialize default users and database
  try {
    await activeStorage.initializeDefaultUsers();
    console.log("✅ Authentication system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize authentication:", error);
  }

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await activeStorage.getUserByUsername(username);
      if (!user || !user.is_active) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      };

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name
        },
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user });
  });

  // Admin-only: Manage cashiers
  app.get("/api/auth/cashiers", isAdmin, async (req, res) => {
    try {
      const cashiers = await activeStorage.getAllCashiers();
      res.json(cashiers.map(c => ({
        id: c.id,
        username: c.username,
        full_name: c.full_name,
        is_active: c.is_active,
        created_at: c.created_at
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cashiers" });
    }
  });

  app.post("/api/auth/cashiers", isAdmin, async (req, res) => {
    try {
      const { username, password, full_name } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const existingUser = await activeStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newCashier = await activeStorage.createUser({
        username,
        password_hash: password, // Will be hashed by the storage layer
        role: 'cashier',
        full_name: full_name || username,
        is_active: true
      });

      res.json({
        id: newCashier.id,
        username: newCashier.username,
        full_name: newCashier.full_name,
        is_active: newCashier.is_active,
        created_at: newCashier.created_at
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create cashier" });
    }
  });

  app.put("/api/auth/cashiers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password, full_name, is_active } = req.body;
      
      const updateData: any = { username, full_name, is_active };
      if (password) {
        updateData.password_hash = password; // Will be hashed by the storage layer
      }

      const updatedUser = await activeStorage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Cashier not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        full_name: updatedUser.full_name,
        is_active: updatedUser.is_active
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update cashier" });
    }
  });

  // Admin: Change password
  app.put("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = (req as any).session.user;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      const dbUser = await activeStorage.getUserByUsername(user.username);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      await activeStorage.updatePassword(user.id, newPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Test WooCommerce connectivity endpoint
  app.get("/api/test-woocommerce", async (req, res) => {
    try {
      if (productStorage === wooCommerceStorage) {
        const products = await productStorage.getProducts('', undefined);
        res.json({ 
          connected: true, 
          message: "WooCommerce connection successful",
          productCount: products.length,
          sampleProduct: products[0] || null
        });
      } else {
        res.json({ 
          connected: false, 
          message: "Using local storage - WooCommerce not configured" 
        });
      }
    } catch (error: any) {
      console.error("WooCommerce connection error:", error);
      res.status(500).json({ 
        connected: false, 
        message: "WooCommerce connection failed", 
        error: error.message 
      });
    }
  });
  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const search = req.query.search as string;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const products = await productStorage.getProducts(search, categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await productStorage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      console.log(`🔍 API: Searching for barcode: ${barcode}`);
      
      const product = await productStorage.getProductByBarcode(barcode);
      if (!product) {
        console.log(`❌ API: Product not found for barcode: ${barcode}`);
        return res.status(404).json({ message: "Product not found" });
      }
      
      console.log(`✅ API: Found product for barcode ${barcode}: ${product.name} (ID: ${product.id})`);
      res.json(product);
    } catch (error) {
      console.error(`❌ API: Error searching for barcode ${req.params.barcode}:`, error);
      res.status(500).json({ message: "Failed to fetch product by barcode" });
    }
  });

  // Debug endpoint to check barcode metadata
  app.get("/api/debug/barcodes", async (req, res) => {
    try {
      const products = await activeStorage.getProducts();
      const productsWithBarcodes = products
        .filter(p => p.barcode && p.barcode !== p.sku)
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          woocommerce_id: p.woocommerce_id
        }))
        .slice(0, 10); // Limit to first 10 for debugging
      
      res.json({
        total_products: products.length,
        products_with_barcodes: productsWithBarcodes.length,
        sample_products: productsWithBarcodes
      });
    } catch (error) {
      console.error("Error debugging barcodes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories endpoints
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await activeStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await activeStorage.getOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await activeStorage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/unsynced", async (req, res) => {
    try {
      const orders = await activeStorage.getUnsyncedOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unsynced orders" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const order = await activeStorage.updateOrder(id, updateData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Search order by order number
  app.get("/api/orders/search/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const order = await activeStorage.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error searching order:", error);
      res.status(500).json({ error: "Failed to search order" });
    }
  });

  // Process product return
  app.post("/api/returns", async (req, res) => {
    try {
      const returnData = req.body;
      
      // Create return record
      const returnRecord = {
        id: Date.now(), // Simple ID generation
        ...returnData,
        created_at: new Date().toISOString(),
        status: 'processed'
      };

      // Log the return for now (in a real system, save to returns table)
      console.log("Return processed:", returnRecord);
      
      res.status(201).json(returnRecord);
    } catch (error) {
      console.error("Error processing return:", error);
      res.status(500).json({ error: "Failed to process return" });
    }
  });

  // Download order PDF
  app.get("/api/orders/:id/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await activeStorage.getOrderById(parseInt(id));
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // For now, return order data (PDF generation happens on client side)
      res.json({ message: "PDF generation endpoint", order });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Coupons endpoints
  app.get("/api/coupons", async (req, res) => {
    try {
      const coupons = await activeStorage.getCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.get("/api/coupons/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const coupon = await activeStorage.getCouponByCode(code);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found or expired" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupon" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await activeStorage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updatedSettings = await activeStorage.updateSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const updateData = req.body;
      const settings = await activeStorage.updateSettings(updateData);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Customer endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const search = req.query.search as string;
      const customers = await activeStorage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await activeStorage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await activeStorage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await activeStorage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // WooCommerce sync endpoint (placeholder for future implementation)
  app.post("/api/sync/woocommerce", async (req, res) => {
    try {
      // This would implement actual WooCommerce sync
      // For now, just mark unsynced orders as synced
      const unsyncedOrders = await activeStorage.getUnsyncedOrders();
      
      for (const order of unsyncedOrders) {
        await activeStorage.updateOrder(order.id, { synced: true });
      }
      
      res.json({ 
        message: "Sync completed", 
        syncedOrders: unsyncedOrders.length 
      });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Create custom product
  app.post("/api/products/custom", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const newProduct = await activeStorage.createProduct(productData);
      res.json(newProduct);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to create custom product",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Email receipt endpoint
  app.post("/api/send-receipt", async (req, res) => {
    try {
      const { to, subject, text, html, attachment } = req.body;
      
      // Check if SendGrid API key is configured
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(400).json({ 
          error: "Email service not configured. Please add SENDGRID_API_KEY to environment variables." 
        });
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to,
        from: process.env.FROM_EMAIL || 'noreply@bplus-pos.com',
        subject,
        text,
        html,
        attachments: attachment ? [{
          content: attachment.content,
          filename: attachment.filename,
          type: 'application/pdf',
          disposition: 'attachment'
        }] : []
      };

      await sgMail.send(msg);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message 
      });
    }
  });

  // Debug endpoint to test raw WooCommerce product fetch with meta data
  app.get("/api/debug-product/:id", async (req, res) => {
    try {
      const productId = req.params.id;
      const wooConfig = {
        url: process.env.WOOCOMMERCE_URL!,
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!
      };

      const response = await fetch(`${wooConfig.url}/wp-json/wc/v3/products/${productId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64')}`
        }
      });

      const rawProduct = await response.json();
      res.json(rawProduct);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get WooCommerce tax rates
  app.get('/api/tax-rates', async (req, res) => {
    try {
      if (productStorage === wooCommerceStorage && 'getTaxRates' in productStorage) {
        const taxRates = await (productStorage as any).getTaxRates();
        res.json(taxRates);
      } else {
        res.status(500).json({ error: 'Tax rates not available - WooCommerce not configured' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get WooCommerce tax classes
  app.get('/api/tax-classes', async (req, res) => {
    try {
      if (productStorage === wooCommerceStorage && 'getTaxClasses' in productStorage) {
        const taxClasses = await (productStorage as any).getTaxClasses();
        res.json(taxClasses);
      } else {
        res.status(500).json({ error: 'Tax classes not available - WooCommerce not configured' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get WooCommerce tax rate
  app.get('/api/woocommerce-tax-rate', async (req, res) => {
    try {
      if (productStorage === wooCommerceStorage && 'getWooCommerceTaxRate' in productStorage) {
        const taxRate = await (productStorage as any).getWooCommerceTaxRate();
        res.json({ taxRate });
      } else {
        res.json({ taxRate: 18 }); // Default GST rate
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Debug endpoint to see WooCommerce tax information
  app.get('/api/debug-woocommerce-tax', isAuthenticated, async (req, res) => {
    try {
      if (productStorage === wooCommerceStorage && 'makeRequest' in productStorage) {
        const storage = productStorage as any;
        
        const generalSettings = await storage.makeRequest('settings/general');
        const taxSettings = await storage.makeRequest('settings/tax');
        const taxRates = await storage.getTaxRates();
        const taxClasses = await storage.getTaxClasses();
        
        // Get a sample product to see tax information
        const products = await storage.makeRequest('products?per_page=1&status=publish');
        
        res.json({
          generalSettings,
          taxSettings,
          taxRates,
          taxClasses,
          sampleProduct: products?.[0] || null
        });
      } else {
        res.status(500).json({ error: 'WooCommerce not configured' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Calculate product tax using WooCommerce rates
  app.post('/api/calculate-tax', async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
      }

      const product = await productStorage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (productStorage === wooCommerceStorage && 'calculateProductTax' in productStorage) {
        const taxInfo = await (productStorage as any).calculateProductTax(product, quantity);
        res.json(taxInfo);
      } else {
        res.status(500).json({ error: 'Tax calculation not available - WooCommerce not configured' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
