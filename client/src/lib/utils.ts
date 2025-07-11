import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting with Rupee symbol
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`
}

// Tax-inclusive pricing calculations
export function calculateTaxInclusivePrice(priceIncludingTax: number, taxRate: number): {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
} {
  // When tax is included in the price, we need to extract the base price
  // Formula: basePrice = priceIncludingTax / (1 + taxRate)
  const basePrice = priceIncludingTax / (1 + taxRate / 100);
  const taxAmount = priceIncludingTax - basePrice;
  
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalPrice: priceIncludingTax
  };
}

// Calculate line total with tax-inclusive pricing
export function calculateLineTotal(price: number, quantity: number, taxRate: number = 0): {
  baseTotal: number;
  taxTotal: number;
  grandTotal: number;
} {
  const lineTotal = price * quantity;
  const taxCalc = calculateTaxInclusivePrice(lineTotal, taxRate);
  
  return {
    baseTotal: taxCalc.basePrice,
    taxTotal: taxCalc.taxAmount,
    grandTotal: taxCalc.totalPrice
  };
}

// Calculate cart totals with tax-inclusive pricing
export function calculateCartTotals(
  items: Array<{ price: number; quantity: number; taxRate?: number }>,
  discount: number = 0,
  taxRate: number = 0
): {
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  grandTotal: number;
} {
  // Calculate subtotal (this is the tax-inclusive price)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Calculate discount amount
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;

  // Extract tax from the tax-inclusive price
  const taxCalc = calculateTaxInclusivePrice(subtotalAfterDiscount, taxRate);
  
  return {
    subtotal: subtotal,
    taxTotal: taxCalc.taxAmount,
    discountAmount: discountAmount,
    grandTotal: subtotalAfterDiscount
  };
}
