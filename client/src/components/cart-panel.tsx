import { Trash2, Minus, Plus, CreditCard, Save, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, calculateLineTotal } from "@/lib/utils";
import type { CartItem, CartTotals } from "@shared/schema";

interface CartPanelProps {
  cart: CartItem[];
  cartTotals: CartTotals;
  couponCode: string;
  taxRate: number;
  onCouponCodeChange: (code: string) => void;
  onApplyCoupon: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onProcessPayment: () => void;
  onPrintReceipt: () => void;
  isProcessingPayment: boolean;
}

export default function CartPanel({
  cart,
  cartTotals,
  couponCode,
  taxRate,
  onCouponCodeChange,
  onApplyCoupon,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProcessPayment,
  onPrintReceipt,
  isProcessingPayment,
}: CartPanelProps) {
  const getItemPrice = (item: CartItem) => {
    return parseFloat(item.product.sale_price || item.product.regular_price);
  };

  const getItemTotal = (item: CartItem) => {
    return getItemPrice(item) * item.quantity;
  };

  return (
    <div className="w-2/5 bg-neutral-light flex flex-col">
      {/* Cart Header */}
      <div className="bg-card p-3 border-b border-border">
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="text-destructive hover:text-destructive"
            disabled={cart.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        
        {/* Coupon Input */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter coupon code..."
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button
            onClick={onApplyCoupon}
            size="sm"
            className="h-8 px-3"
            disabled={!couponCode.trim()}
          >
            Apply
          </Button>
          {couponCode && (
            <Button
              onClick={() => onCouponCodeChange("")}
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
          </div>
        ) : (
          cart.map((item) => {
            const regularPrice = parseFloat(item.product.regular_price);
            const salePrice = item.product.sale_price ? parseFloat(item.product.sale_price) : null;
            const currentPrice = getItemPrice(item);
            const itemTotal = getItemTotal(item);
            const hasDiscount = salePrice && salePrice < regularPrice;
            const itemDiscount = hasDiscount ? (regularPrice - salePrice!) * item.quantity : 0;
            const taxRate = cartTotals.tax > 0 ? ((cartTotals.tax / cartTotals.subtotal) * 100) : 18; // Dynamic tax rate
            const taxAmount = itemTotal * (taxRate / 100);
            
            return (
              <div key={item.product.id} className="border-b border-gray-100 p-2">
                <div className="flex-1 min-w-0">
                  {/* Product Name & Controls */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-xs truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.product.sku || "N/A"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-destructive hover:text-destructive ml-2 h-5 w-5 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Price Information Grid */}
                  <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                    <div>
                      <span className="text-muted-foreground">MRP:</span>
                      <div className="font-medium">{formatCurrency(regularPrice)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sale:</span>
                      <div className="font-medium text-green-600">
                        {hasDiscount ? formatCurrency(salePrice!) : formatCurrency(regularPrice)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tax:</span>
                      <div className="font-medium">{formatCurrency(taxAmount)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Discount:</span>
                      <div className="font-medium text-orange-600">{formatCurrency(itemDiscount)}</div>
                    </div>
                  </div>
                  
                  {/* Quantity Controls & Total */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1">
                        @ {formatCurrency(currentPrice)}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {formatCurrency(itemTotal)}
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatCurrency(regularPrice * item.quantity)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="bg-card border-t border-border p-3">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(cartTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">{formatCurrency(cartTotals.tax)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-xs text-orange-600">
                <span>Total Discount:</span>
                <span className="font-medium">-{formatCurrency(cartTotals.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(cartTotals.total)}</span>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onProcessPayment}
              disabled={isProcessingPayment}
              className="w-full h-10 text-sm font-bold"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessingPayment ? "Processing..." : "Process Payment"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isProcessingPayment}
              >
                <Save className="mr-1 h-3 w-3" />
                Hold
              </Button>
              <Button
                variant="outline"
                onClick={onPrintReceipt}
                size="sm"
                className="h-8"
                disabled={isProcessingPayment}
              >
                <Printer className="mr-1 h-3 w-3" />
                Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
