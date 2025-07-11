// Local storage utilities for offline functionality
import type { Product, Order, Category, Coupon, Settings, CartItem } from "@shared/schema";

const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  CATEGORIES: 'pos_categories',
  COUPONS: 'pos_coupons',
  SETTINGS: 'pos_settings',
  CART: 'pos_cart',
  OFFLINE_ORDERS: 'pos_offline_orders',
  LAST_SYNC: 'pos_last_sync',
} as const;

// Generic storage operations
function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

// Products
export function cacheProducts(products: Product[]): void {
  setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function getCachedProducts(): Product[] {
  return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
}

// Categories
export function cacheCategories(categories: Category[]): void {
  setToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

export function getCachedCategories(): Category[] {
  return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
}

// Coupons
export function cacheCoupons(coupons: Coupon[]): void {
  setToStorage(STORAGE_KEYS.COUPONS, coupons);
}

export function getCachedCoupons(): Coupon[] {
  return getFromStorage<Coupon[]>(STORAGE_KEYS.COUPONS) || [];
}

// Settings
export function cacheSettings(settings: Settings): void {
  setToStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function getCachedSettings(): Settings | null {
  return getFromStorage<Settings>(STORAGE_KEYS.SETTINGS);
}

// Cart persistence
export function saveCart(cart: CartItem[]): void {
  setToStorage(STORAGE_KEYS.CART, cart);
}

export function loadCart(): CartItem[] {
  return getFromStorage<CartItem[]>(STORAGE_KEYS.CART) || [];
}

export function clearCart(): void {
  removeFromStorage(STORAGE_KEYS.CART);
}

// Offline orders
export function saveOfflineOrder(order: Order): void {
  const offlineOrders = getOfflineOrders();
  offlineOrders.push(order);
  setToStorage(STORAGE_KEYS.OFFLINE_ORDERS, offlineOrders);
}

export function getOfflineOrders(): Order[] {
  return getFromStorage<Order[]>(STORAGE_KEYS.OFFLINE_ORDERS) || [];
}

export function removeOfflineOrder(orderId: number): void {
  const offlineOrders = getOfflineOrders();
  const filteredOrders = offlineOrders.filter(order => order.id !== orderId);
  setToStorage(STORAGE_KEYS.OFFLINE_ORDERS, filteredOrders);
}

export function clearOfflineOrders(): void {
  removeFromStorage(STORAGE_KEYS.OFFLINE_ORDERS);
}

// Sync timestamp
export function setLastSyncTime(timestamp: Date): void {
  setToStorage(STORAGE_KEYS.LAST_SYNC, timestamp.toISOString());
}

export function getLastSyncTime(): Date | null {
  const timestamp = getFromStorage<string>(STORAGE_KEYS.LAST_SYNC);
  return timestamp ? new Date(timestamp) : null;
}

// Network status detection
export function isOnline(): boolean {
  return navigator.onLine;
}

// Storage size utilities
export function getStorageUsage(): { used: number; available: number } {
  let used = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length;
    }
  }
  
  // Approximate available space (5MB is typical localStorage limit)
  const available = 5 * 1024 * 1024 - used;
  
  return {
    used: Math.round(used / 1024), // KB
    available: Math.round(available / 1024), // KB
  };
}

// Clear all POS data
export function clearAllPOSData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key);
  });
}

// Export/Import for backup
export function exportPOSData(): string {
  const data: Record<string, any> = {};
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = getFromStorage(key);
    if (value !== null) {
      data[name] = value;
    }
  });
  
  return JSON.stringify(data, null, 2);
}

export function importPOSData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name]) {
        setToStorage(key, data[name]);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error importing POS data:', error);
    return false;
  }
}
