import { IStorage } from "./storage";
import { Product, InsertProduct, Category, InsertCategory, Order, InsertOrder, Coupon, InsertCoupon, Settings, InsertSettings, Customer, InsertCustomer, OrderLineItem } from "@shared/schema";

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ src: string; alt: string }>;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
  meta_data: Array<{ key: string; value: any }>;
}

interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: { src: string } | null;
  count: number;
}

interface WooCommerceTaxRate {
  id: number;
  country: string;
  state: string;
  postcode: string;
  city: string;
  rate: string;
  name: string;
  priority: number;
  compound: boolean;
  shipping: boolean;
  order: number;
  class: string;
}

interface WooCommerceTaxClass {
  slug: string;
  name: string;
}

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  total_tax: string;
  discount_total: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    price: number;
    total: string;
    sku: string;
    image: { src: string } | null;
  }>;
  customer_note: string;
  date_created: string;
  date_modified: string;
}

interface WooCommerceCoupon {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  description: string;
  usage_limit: number | null;
  usage_count: number;
  individual_use: boolean;
  exclude_sale_items: boolean;
  minimum_amount: string;
  maximum_amount: string;
  date_expires: string | null;
}

interface WooCommerceCustomer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: Array<{ key: string; value: any }>;
}

export class WooCommerceStorage implements IStorage {
  private config: WooCommerceConfig;
  private cache: {
    products: Map<number, Product>;
    categories: Map<number, Category>;
    settings: Settings | null;
    taxRate: number | null;
  };

  constructor() {
    this.config = {
      url: process.env.WOOCOMMERCE_URL!.replace(/\/$/, ''), // Remove trailing slash
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY!,
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET!,
    };

    this.cache = {
      products: new Map(),
      categories: new Map(),
      settings: null,
      taxRate: null,
    };

    this.initializeSettings();
  }

  private async initializeSettings() {
    this.cache.settings = {
      id: 1,
      store_name: "B-Plus POS Store",
      store_address: "Connected to WordPress",
      store_phone: "(555) 123-4567",
      tax_rate: "0.1",
      tax_inclusive: false,
      currency: "USD",
      currency_symbol: "$",
      woocommerce_url: this.config.url,
      woocommerce_consumer_key: this.config.consumerKey,
      woocommerce_consumer_secret: this.config.consumerSecret,
    };
  }

  private getAuthHeader(): string {
    const credentials = btoa(`${this.config.consumerKey}:${this.config.consumerSecret}`);
    return `Basic ${credentials}`;
  }

  // Get tax rates from WooCommerce
  async getTaxRates(): Promise<WooCommerceTaxRate[]> {
    try {
      const response = await fetch(`${this.config.url}/wp-json/wc/v3/taxes`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      return [];
    }
  }

  // Get tax classes from WooCommerce
  async getTaxClasses(): Promise<WooCommerceTaxClass[]> {
    try {
      const response = await fetch(`${this.config.url}/wp-json/wc/v3/taxes/classes`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tax classes:', error);
      return [];
    }
  }

  // Get WooCommerce tax settings and calculate effective tax rate
  async getWooCommerceTaxRate(): Promise<number> {
    try {
      // Check if we have cached tax rate
      if (this.cache.taxRate !== null) {
        console.log(`Using cached tax rate: ${this.cache.taxRate}%`);
        return this.cache.taxRate;
      }

      // Method 1: Try to get tax from WooCommerce API endpoints
      try {
        const taxRates = await this.getTaxRates();
        if (taxRates && taxRates.length > 0) {
          const defaultRate = taxRates.find(rate => 
            rate.class === 'standard' || rate.class === '' || !rate.class
          ) || taxRates[0];
          
          if (defaultRate) {
            const rate = parseFloat(defaultRate.rate);
            console.log(`Found WooCommerce tax rate: ${rate}% from tax API`);
            this.cache.taxRate = rate;
            return rate;
          }
        }
      } catch (error) {
        console.log('Tax rates API not accessible, trying alternative methods');
      }

      // Method 2: Analyze product prices to detect tax inclusion
      try {
        const products = await this.makeRequest('products?per_page=10&status=publish');
        if (products && products.length > 0) {
          const taxableProducts = products.filter((p: any) => 
            p.tax_status === 'taxable' && 
            p.price && 
            p.regular_price &&
            parseFloat(p.price) > 0
          );

          console.log(`Analyzing ${taxableProducts.length} taxable products for tax rate detection`);

          for (const product of taxableProducts) {
            const price = parseFloat(product.price);
            const regularPrice = parseFloat(product.regular_price);
            
            // Common tax rates to check (Indian GST rates: 5%, 12%, 18%, 28%)
            const commonTaxRates = [5, 12, 18, 28];
            
            for (const testRate of commonTaxRates) {
              // Check if price = regular_price * (1 + tax_rate/100) - tax inclusive
              const expectedPriceWithTax = regularPrice * (1 + testRate / 100);
              const tolerance = Math.max(0.50, regularPrice * 0.01); // 1% tolerance or ₹0.50
              
              if (Math.abs(price - expectedPriceWithTax) <= tolerance) {
                console.log(`Detected ${testRate}% tax rate from product: ${product.name}`);
                console.log(`Regular: ₹${regularPrice}, Price: ₹${price}, Expected with ${testRate}%: ₹${expectedPriceWithTax.toFixed(2)}`);
                this.cache.taxRate = testRate;
                return testRate;
              }

              // Check if regular_price includes tax and price is without tax
              const expectedPriceWithoutTax = regularPrice / (1 + testRate / 100);
              if (Math.abs(price - expectedPriceWithoutTax) <= tolerance) {
                console.log(`Detected ${testRate}% tax rate (reverse calculation) from product: ${product.name}`);
                this.cache.taxRate = testRate;
                return testRate;
              }
            }
          }

          // If no pattern found, check if prices are tax-inclusive by default
          let pricesAppearTaxInclusive = true;
          for (const product of taxableProducts.slice(0, 5)) {
            const price = parseFloat(product.price);
            const regularPrice = parseFloat(product.regular_price);
            
            // If prices are exactly the same, they likely include tax
            if (Math.abs(price - regularPrice) > 0.01) {
              pricesAppearTaxInclusive = false;
              break;
            }
          }

          if (pricesAppearTaxInclusive) {
            console.log('Prices appear to be tax-inclusive, using 18% GST default for India');
            this.cache.taxRate = 18;
            return 18;
          }
        }
      } catch (error) {
        console.log('Product analysis failed, using fallback');
      }

      // Method 3: Check store location for tax rate defaults
      try {
        const generalSettings = await this.makeRequest('settings/general');
        if (generalSettings && generalSettings.length > 0) {
          const countrySetting = generalSettings.find((s: any) => s.id === 'woocommerce_default_country');
          if (countrySetting && countrySetting.value) {
            if (countrySetting.value.startsWith('IN')) {
              console.log('Indian store detected, using 18% GST');
              this.cache.taxRate = 18;
              return 18;
            }
          }
        }
      } catch (error) {
        console.log('Settings API not accessible');
      }

      // Final fallback: Use common Indian GST rate
      console.log('Using fallback: 18% GST for Indian commerce');
      this.cache.taxRate = 18;
      return 18;

    } catch (error) {
      console.error('Error determining tax rate:', error);
      // Return 18% as it's the most common GST rate in India
      this.cache.taxRate = 18;
      return 18;
    }
  }

  // Calculate tax for a product based on WooCommerce tax rates
  async calculateProductTax(product: Product, quantity: number = 1): Promise<{ taxRate: number; taxAmount: string }> {
    try {
      const taxRate = await this.getWooCommerceTaxRate();
      const price = parseFloat(product.sale_price || product.regular_price);
      
      // Calculate tax amount (assuming tax-inclusive pricing)
      const priceWithoutTax = price / (1 + taxRate / 100);
      const taxAmount = (price - priceWithoutTax) * quantity;

      return { 
        taxRate: taxRate, 
        taxAmount: taxAmount.toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating tax:', error);
      return { taxRate: 18, taxAmount: '0.00' };
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.url}/wp-json/wc/v3/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`WooCommerce API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private convertWooProductToProduct(wooProduct: WooCommerceProduct): Product {
    // Find barcode in meta_data from YITH WooCommerce Barcodes plugin
    const barcodeMetaData = wooProduct.meta_data?.find(meta => 
      meta.key === '_ywbc_barcode_display_value' || 
      meta.key === '_barcode' || 
      meta.key === 'barcode' || 
      meta.key === '_sku'
    );

    return {
      id: wooProduct.id,
      woocommerce_id: wooProduct.id,
      name: wooProduct.name,
      sku: wooProduct.sku || null,
      description: wooProduct.short_description || wooProduct.description || null,
      regular_price: wooProduct.regular_price || wooProduct.price,
      sale_price: wooProduct.sale_price || null,
      stock_quantity: wooProduct.stock_quantity || null,
      manage_stock: wooProduct.manage_stock || false,
      stock_status: wooProduct.stock_status || 'instock',
      category_ids: wooProduct.categories?.map(cat => cat.id) || null,
      image_url: wooProduct.images?.[0]?.src || null,
      barcode: barcodeMetaData?.value || wooProduct.sku || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  private convertWooCategoryToCategory(wooCategory: WooCommerceCategory): Category {
    return {
      id: wooCategory.id,
      woocommerce_id: wooCategory.id,
      name: wooCategory.name,
      slug: wooCategory.slug,
      parent_id: wooCategory.parent || null,
    };
  }

  private convertWooCouponToCoupon(wooCoupon: WooCommerceCoupon): Coupon {
    return {
      id: wooCoupon.id,
      woocommerce_id: wooCoupon.id,
      code: wooCoupon.code,
      discount_type: wooCoupon.discount_type,
      amount: wooCoupon.amount,
      minimum_amount: wooCoupon.minimum_amount || null,
      maximum_amount: wooCoupon.maximum_amount || null,
      usage_limit: wooCoupon.usage_limit,
      used_count: wooCoupon.usage_count || 0,
      expires_at: wooCoupon.date_expires ? new Date(wooCoupon.date_expires) : null,
      enabled: true,
    };
  }

  private convertWooCustomerToCustomer(wooCustomer: WooCommerceCustomer): Customer {
    return {
      id: wooCustomer.id,
      woocommerce_id: wooCustomer.id,
      first_name: wooCustomer.first_name,
      last_name: wooCustomer.last_name,
      email: wooCustomer.email || null,
      phone: wooCustomer.billing?.phone || null,
      address_1: wooCustomer.billing?.address_1 || null,
      address_2: wooCustomer.billing?.address_2 || null,
      city: wooCustomer.billing?.city || null,
      state: wooCustomer.billing?.state || null,
      postcode: wooCustomer.billing?.postcode || null,
      country: wooCustomer.billing?.country || null,
      created_at: new Date(wooCustomer.date_created),
      updated_at: new Date(wooCustomer.date_modified),
      synced: true,
    };
  }

  // Products
  async getProducts(search?: string, categoryId?: number): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      params.append('per_page', '100');
      params.append('status', 'publish');
      
      if (search) {
        params.append('search', search);
      }
      
      if (categoryId) {
        params.append('category', categoryId.toString());
      }

      const wooProducts: WooCommerceProduct[] = await this.makeRequest(`products?${params.toString()}`);
      const products = wooProducts.map(wooProduct => this.convertWooProductToProduct(wooProduct));
      
      // Update cache
      products.forEach(product => this.cache.products.set(product.id, product));
      
      return products;
    } catch (error) {
      console.error('Failed to fetch products from WooCommerce:', error);
      // Return cached products as fallback
      return Array.from(this.cache.products.values());
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      const wooProduct: WooCommerceProduct = await this.makeRequest(`products/${id}`);
      const product = this.convertWooProductToProduct(wooProduct);
      
      // Update cache
      this.cache.products.set(product.id, product);
      
      return product;
    } catch (error) {
      console.error(`Failed to fetch product ${id} from WooCommerce:`, error);
      return this.cache.products.get(id);
    }
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    try {
      const wooProducts: WooCommerceProduct[] = await this.makeRequest(`products?sku=${sku}`);
      if (wooProducts.length > 0) {
        return this.convertWooProductToProduct(wooProducts[0]);
      }
    } catch (error) {
      console.error(`Failed to fetch product with SKU ${sku} from WooCommerce:`, error);
    }
    
    // Fallback to cache search
    return Array.from(this.cache.products.values()).find(p => p.sku === sku);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    try {
      console.log(`🔍 Searching for barcode: ${barcode}`);
      
      // First check cache (with exact barcode match)
      const cachedProduct = Array.from(this.cache.products.values()).find(p => 
        p.barcode && String(p.barcode).trim() === String(barcode).trim()
      );
      if (cachedProduct) {
        console.log(`✅ Found in cache: ${cachedProduct.name} (barcode: ${cachedProduct.barcode})`);
        return cachedProduct;
      }

      // Search with multiple strategies for YITH barcode plugin
      const searchStrategies = [
        // Strategy 1: Direct meta query with correct parameter format
        `${this.config.url}/wp-json/wc/v3/products?meta_key=_ywbc_barcode_display_value&meta_value=${encodeURIComponent(barcode)}`,
        // Strategy 2: Alternative meta key
        `${this.config.url}/wp-json/wc/v3/products?meta_key=_ywbc_barcode_value&meta_value=${encodeURIComponent(barcode)}`,
        // Strategy 3: Search by SKU as fallback
        `${this.config.url}/wp-json/wc/v3/products?sku=${encodeURIComponent(barcode)}`
      ];

      for (const searchUrl of searchStrategies) {
        console.log(`🔍 Trying search URL: ${searchUrl}`);
        
        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')}`
          }
        });

        if (response.ok) {
          const products = await response.json() as WooCommerceProduct[];
          console.log(`📦 API returned ${products.length} products`);
          
          if (products && products.length > 0) {
            // Look for exact barcode match in metadata instead of taking the first result
            for (const wcProduct of products) {
              const barcodeMetaKeys = [
                '_ywbc_barcode_display_value',
                '_ywbc_barcode_value',
                'ywbc_barcode_display_value_custom_field',
                '_barcode'
              ];
              
              for (const metaKey of barcodeMetaKeys) {
                const barcodeMetaData = wcProduct.meta_data?.find((meta: any) => 
                  meta.key === metaKey && String(meta.value) === String(barcode)
                );
                
                if (barcodeMetaData) {
                  console.log(`✅ Found exact barcode match in ${metaKey}: ${wcProduct.name} (Product ID: ${wcProduct.id})`);
                  const product = this.convertWooProductToProduct(wcProduct);
                  this.cache.products.set(product.id, product);
                  return product;
                }
              }
              
              // Also check SKU match
              if (wcProduct.sku && String(wcProduct.sku) === String(barcode)) {
                console.log(`✅ Found exact SKU match: ${wcProduct.name} (Product ID: ${wcProduct.id})`);
                const product = this.convertWooProductToProduct(wcProduct);
                this.cache.products.set(product.id, product);
                return product;
              }
            }
            
            console.log(`❌ No exact barcode match found in API results for ${barcode}`);
          }
        } else {
          console.log(`❌ Search failed with status: ${response.status}`);
        }
      }

      // If direct searches don't work, do a comprehensive search through products
      console.log(`🔍 Starting comprehensive search for barcode: ${barcode}`);
      
      let page = 1;
      const perPage = 100;
      let foundProduct: Product | undefined;

      while (!foundProduct && page <= 5) { // Limit to 5 pages (500 products max)
        const searchUrl = `${this.config.url}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`;
        console.log(`🔍 Searching page ${page}: ${searchUrl}`);
        
        const allProductsResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')}`
          }
        });

        if (allProductsResponse.ok) {
          const allProducts = await allProductsResponse.json() as WooCommerceProduct[];
          
          if (allProducts.length === 0) {
            console.log(`📦 No more products on page ${page}`);
            break;
          }
          
          console.log(`📦 Checking page ${page} with ${allProducts.length} products`);
          
          for (const wcProduct of allProducts) {
            // Check multiple barcode meta keys
            const barcodeMetaKeys = [
              '_ywbc_barcode_display_value',
              '_ywbc_barcode_value',
              'ywbc_barcode_display_value_custom_field',
              '_barcode'
            ];
            
            // Check each meta key for barcode match
            for (const metaKey of barcodeMetaKeys) {
              const barcodeMetaData = wcProduct.meta_data?.find((meta: any) => 
                meta.key === metaKey && String(meta.value) === String(barcode)
              );
              
              if (barcodeMetaData) {
                console.log(`✅ Found barcode match in ${metaKey}: ${wcProduct.name} (Product ID: ${wcProduct.id})`);
                foundProduct = this.convertWooProductToProduct(wcProduct);
                this.cache.products.set(foundProduct.id, foundProduct);
                return foundProduct;
              }
            }
            
            // Also check SKU match
            if (wcProduct.sku && String(wcProduct.sku) === String(barcode)) {
              console.log(`✅ Found SKU match: ${wcProduct.name} (Product ID: ${wcProduct.id})`);
              foundProduct = this.convertWooProductToProduct(wcProduct);
              this.cache.products.set(foundProduct.id, foundProduct);
              return foundProduct;
            }
          }
          
          page++;
        } else {
          console.log(`❌ Failed to fetch page ${page}: ${allProductsResponse.status}`);
          break;
        }
      }

      console.log(`❌ No product found for barcode: ${barcode}`);
      return undefined;
      
    } catch (error) {
      console.error('Error searching for product by barcode:', error);
      
      // Final fallback to cache search
      return Array.from(this.cache.products.values()).find(p => p.barcode === barcode);
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      // Auto-generate SKU if not provided
      let sku = product.sku;
      if (!sku) {
        const timestamp = Date.now().toString().slice(-6);
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        sku = `CUSTOM-${timestamp}-${randomId}`;
      }

      // Auto-generate barcode if not provided
      let barcode = product.barcode;
      if (!barcode) {
        // Generate a simple EAN-style barcode (13 digits)
        const timestamp = Date.now().toString().slice(-8);
        const randomDigits = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        barcode = `0000${timestamp}${randomDigits}`.slice(-13);
      }

      const wooProductData = {
        name: product.name,
        sku: sku,
        regular_price: product.regular_price,
        sale_price: product.sale_price || "",
        description: product.description || "",
        stock_quantity: product.stock_quantity || 1,
        manage_stock: true,
        stock_status: product.stock_status || "instock",
        categories: product.category_ids?.map((id: number) => ({ id })) || [{ id: 15 }], // Default to Uncategorized
        meta_data: [
          { key: '_ywbc_barcode_value', value: barcode },
          { key: '_ywbc_barcode_display_value', value: barcode },
          { key: '_ywbc_barcode_protocol', value: 'EAN13' },
          { key: 'ywbc_barcode_display_value_custom_field', value: barcode }
        ],
      };

      const wooProduct: WooCommerceProduct = await this.makeRequest('products', {
        method: 'POST',
        body: JSON.stringify(wooProductData),
      });

      return this.convertWooProductToProduct(wooProduct);
    } catch (error) {
      throw new Error(`Failed to create product in WooCommerce: ${error}`);
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const updateData: any = {};
      
      if (product.name) updateData.name = product.name;
      if (product.sku) updateData.sku = product.sku;
      if (product.regular_price) updateData.regular_price = product.regular_price;
      if (product.sale_price) updateData.sale_price = product.sale_price;
      if (product.description) updateData.description = product.description;
      if (product.stock_quantity !== undefined) updateData.stock_quantity = product.stock_quantity;
      if (product.manage_stock !== undefined) updateData.manage_stock = product.manage_stock;
      if (product.category_ids) updateData.categories = product.category_ids.map(id => ({ id }));
      
      if (product.barcode) {
        updateData.meta_data = [{ key: '_barcode', value: product.barcode }];
      }

      const wooProduct: WooCommerceProduct = await this.makeRequest(`products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const updatedProduct = this.convertWooProductToProduct(wooProduct);
      this.cache.products.set(id, updatedProduct);
      
      return updatedProduct;
    } catch (error) {
      console.error(`Failed to update product ${id} in WooCommerce:`, error);
      return this.cache.products.get(id);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const wooCategories: WooCommerceCategory[] = await this.makeRequest('products/categories?per_page=100');
      const categories = wooCategories.map(wooCat => this.convertWooCategoryToCategory(wooCat));
      
      // Update cache
      categories.forEach(category => this.cache.categories.set(category.id, category));
      
      return categories;
    } catch (error) {
      console.error('Failed to fetch categories from WooCommerce:', error);
      // Return cached categories as fallback
      return Array.from(this.cache.categories.values());
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    try {
      const wooCategory: WooCommerceCategory = await this.makeRequest(`products/categories/${id}`);
      const category = this.convertWooCategoryToCategory(wooCategory);
      
      this.cache.categories.set(id, category);
      return category;
    } catch (error) {
      console.error(`Failed to fetch category ${id} from WooCommerce:`, error);
      return this.cache.categories.get(id);
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const wooCategoryData = {
        name: category.name,
        slug: category.slug,
        parent: category.parent_id || 0,
      };

      const wooCategory: WooCommerceCategory = await this.makeRequest('products/categories', {
        method: 'POST',
        body: JSON.stringify(wooCategoryData),
      });

      return this.convertWooCategoryToCategory(wooCategory);
    } catch (error) {
      throw new Error(`Failed to create category in WooCommerce: ${error}`);
    }
  }

  // Orders
  async getOrders(limit?: number): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      params.append('per_page', (limit || 50).toString());
      params.append('orderby', 'date');
      params.append('order', 'desc');

      const wooOrders: WooCommerceOrder[] = await this.makeRequest(`orders?${params.toString()}`);
      
      return wooOrders.map(wooOrder => ({
        id: wooOrder.id,
        woocommerce_id: wooOrder.id,
        order_number: wooOrder.number,
        status: wooOrder.status,
        total: wooOrder.total,
        subtotal: wooOrder.subtotal,
        tax_total: wooOrder.total_tax,
        discount_total: wooOrder.discount_total,
        line_items: wooOrder.line_items.map(item => ({
          product_id: item.product_id,
          woocommerce_id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price.toString(),
          total: item.total,
          image_url: item.image?.src || null,
        })),
        customer_name: "Walk-in Customer",
        cashier_name: "POS User",
        payment_method: "cash",
        created_at: new Date(wooOrder.date_created),
        synced: true,
      }));
    } catch (error) {
      console.error('Failed to fetch orders from WooCommerce:', error);
      return [];
    }
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    try {
      const wooOrder: WooCommerceOrder = await this.makeRequest(`orders/${id}`);
      
      return {
        id: wooOrder.id,
        woocommerce_id: wooOrder.id,
        order_number: wooOrder.number,
        status: wooOrder.status,
        total: wooOrder.total,
        subtotal: wooOrder.subtotal,
        tax_total: wooOrder.total_tax,
        discount_total: wooOrder.discount_total,
        line_items: wooOrder.line_items.map(item => ({
          product_id: item.product_id,
          woocommerce_id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price.toString(),
          total: item.total,
          image_url: item.image?.src || null,
        })),
        customer_name: "Walk-in Customer",
        cashier_name: "POS User",
        payment_method: "cash",
        created_at: new Date(wooOrder.date_created),
        synced: true,
      };
    } catch (error) {
      console.error(`Failed to fetch order ${id} from WooCommerce:`, error);
      return undefined;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    try {
      const wooOrders: WooCommerceOrder[] = await this.makeRequest(`orders?number=${orderNumber}`);
      if (wooOrders.length > 0) {
        return this.getOrderById(wooOrders[0].id);
      }
    } catch (error) {
      console.error(`Failed to fetch order ${orderNumber} from WooCommerce:`, error);
    }
    return undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const wooOrderData = {
        status: 'completed',
        currency: 'USD',
        line_items: order.line_items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
          total: (parseFloat(item.price.toString()) * parseInt(item.quantity.toString())).toFixed(2),
        })),
        total: order.total,
        customer_note: `POS Order - ${order.customer_name || 'Walk-in Customer'}`,
        meta_data: [
          { key: '_pos_order', value: 'true' },
          { key: '_cashier_name', value: order.cashier_name },
          { key: '_payment_method', value: order.payment_method },
        ],
      };

      const wooOrder: WooCommerceOrder = await this.makeRequest('orders', {
        method: 'POST',
        body: JSON.stringify(wooOrderData),
      });

      return {
        id: wooOrder.id,
        woocommerce_id: wooOrder.id,
        order_number: wooOrder.number,
        status: wooOrder.status,
        total: wooOrder.total,
        subtotal: wooOrder.subtotal,
        tax_total: wooOrder.total_tax,
        discount_total: wooOrder.discount_total,
        line_items: order.line_items,
        customer_name: order.customer_name || "Walk-in Customer",
        cashier_name: order.cashier_name,
        payment_method: order.payment_method,
        created_at: new Date(),
        synced: true,
      };
    } catch (error) {
      throw new Error(`Failed to create order in WooCommerce: ${error}`);
    }
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const updateData: any = {};
      
      if (order.status) updateData.status = order.status;
      if (order.customer_name) {
        updateData.customer_note = `POS Order - ${order.customer_name}`;
      }

      const wooOrder: WooCommerceOrder = await this.makeRequest(`orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return this.getOrderById(wooOrder.id);
    } catch (error) {
      console.error(`Failed to update order ${id} in WooCommerce:`, error);
      return undefined;
    }
  }

  async getUnsyncedOrders(): Promise<Order[]> {
    // In WooCommerce integration, orders are synced immediately
    return [];
  }

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const wooCoupons: WooCommerceCoupon[] = await this.makeRequest('coupons?per_page=100');
      return wooCoupons.map(wooCoupon => this.convertWooCouponToCoupon(wooCoupon));
    } catch (error) {
      console.error('Failed to fetch coupons from WooCommerce:', error);
      return [];
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    try {
      const wooCoupons: WooCommerceCoupon[] = await this.makeRequest(`coupons?code=${code}`);
      if (wooCoupons.length > 0) {
        return this.convertWooCouponToCoupon(wooCoupons[0]);
      }
    } catch (error) {
      console.error(`Failed to fetch coupon ${code} from WooCommerce:`, error);
    }
    return undefined;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    try {
      const wooCouponData = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        amount: coupon.amount,
        minimum_amount: coupon.minimum_amount,
        maximum_amount: coupon.maximum_amount,
        usage_limit: coupon.usage_limit,
        date_expires: coupon.expires_at?.toISOString() || null,
      };

      const wooCoupon: WooCommerceCoupon = await this.makeRequest('coupons', {
        method: 'POST',
        body: JSON.stringify(wooCouponData),
      });

      return this.convertWooCouponToCoupon(wooCoupon);
    } catch (error) {
      throw new Error(`Failed to create coupon in WooCommerce: ${error}`);
    }
  }

  async updateCoupon(id: number, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    try {
      const updateData: any = {};
      
      if (coupon.code) updateData.code = coupon.code;
      if (coupon.discount_type) updateData.discount_type = coupon.discount_type;
      if (coupon.amount) updateData.amount = coupon.amount;
      if (coupon.minimum_amount) updateData.minimum_amount = coupon.minimum_amount;
      if (coupon.maximum_amount) updateData.maximum_amount = coupon.maximum_amount;
      if (coupon.usage_limit !== undefined) updateData.usage_limit = coupon.usage_limit;
      if (coupon.expires_at) updateData.date_expires = coupon.expires_at.toISOString();

      const wooCoupon: WooCommerceCoupon = await this.makeRequest(`coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return this.convertWooCouponToCoupon(wooCoupon);
    } catch (error) {
      console.error(`Failed to update coupon ${id} in WooCommerce:`, error);
      return undefined;
    }
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.cache.settings!;
  }

  async updateSettings(settings: Partial<InsertSettings>): Promise<Settings> {
    this.cache.settings = {
      ...this.cache.settings!,
      ...settings,
    };
    return this.cache.settings;
  }

  // Customer methods
  async getCustomers(search?: string): Promise<Customer[]> {
    try {
      let endpoint = 'customers?per_page=100';
      if (search && search.length >= 2) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }

      const wooCustomers: WooCommerceCustomer[] = await this.makeRequest(endpoint);
      return wooCustomers.map(wooCustomer => this.convertWooCustomerToCustomer(wooCustomer));
    } catch (error) {
      console.error('Failed to fetch customers from WooCommerce:', error);
      return [];
    }
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    try {
      const wooCustomer: WooCommerceCustomer = await this.makeRequest(`customers/${id}`);
      return this.convertWooCustomerToCustomer(wooCustomer);
    } catch (error) {
      console.error(`Failed to fetch customer ${id} from WooCommerce:`, error);
      return undefined;
    }
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    try {
      const wooCustomers: WooCommerceCustomer[] = await this.makeRequest(`customers?email=${encodeURIComponent(email)}`);
      if (wooCustomers.length > 0) {
        return this.convertWooCustomerToCustomer(wooCustomers[0]);
      }
      return undefined;
    } catch (error) {
      console.error(`Failed to fetch customer by email ${email} from WooCommerce:`, error);
      return undefined;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    try {
      // WooCommerce doesn't have direct phone search, so we search all customers and filter
      const wooCustomers: WooCommerceCustomer[] = await this.makeRequest('customers?per_page=100');
      const customer = wooCustomers.find(wooCustomer => 
        wooCustomer.billing?.phone === phone || 
        wooCustomer.shipping?.phone === phone
      );
      
      if (customer) {
        return this.convertWooCustomerToCustomer(customer);
      }
      return undefined;
    } catch (error) {
      console.error(`Failed to fetch customer by phone ${phone} from WooCommerce:`, error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const wooCustomerData = {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        billing: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address_1: customer.address_1,
          address_2: customer.address_2,
          city: customer.city,
          state: customer.state,
          postcode: customer.postcode,
          country: customer.country,
        },
        shipping: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          address_1: customer.address_1,
          address_2: customer.address_2,
          city: customer.city,
          state: customer.state,
          postcode: customer.postcode,
          country: customer.country,
        }
      };

      const wooCustomer: WooCommerceCustomer = await this.makeRequest('customers', {
        method: 'POST',
        body: JSON.stringify(wooCustomerData),
      });

      return this.convertWooCustomerToCustomer(wooCustomer);
    } catch (error) {
      throw new Error(`Failed to create customer in WooCommerce: ${error}`);
    }
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      const updateData: any = {};
      
      if (customer.first_name) updateData.first_name = customer.first_name;
      if (customer.last_name) updateData.last_name = customer.last_name;
      if (customer.email) updateData.email = customer.email;

      if (customer.phone || customer.address_1 || customer.city || customer.state || customer.postcode || customer.country) {
        updateData.billing = {};
        if (customer.first_name) updateData.billing.first_name = customer.first_name;
        if (customer.last_name) updateData.billing.last_name = customer.last_name;
        if (customer.email) updateData.billing.email = customer.email;
        if (customer.phone) updateData.billing.phone = customer.phone;
        if (customer.address_1) updateData.billing.address_1 = customer.address_1;
        if (customer.address_2) updateData.billing.address_2 = customer.address_2;
        if (customer.city) updateData.billing.city = customer.city;
        if (customer.state) updateData.billing.state = customer.state;
        if (customer.postcode) updateData.billing.postcode = customer.postcode;
        if (customer.country) updateData.billing.country = customer.country;
      }

      const wooCustomer: WooCommerceCustomer = await this.makeRequest(`customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return this.convertWooCustomerToCustomer(wooCustomer);
    } catch (error) {
      console.error(`Failed to update customer ${id} in WooCommerce:`, error);
      return undefined;
    }
  }
}

export const wooCommerceStorage = new WooCommerceStorage();