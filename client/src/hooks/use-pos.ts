import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthQuery } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { calculateCartTotals } from "@/lib/utils";
import type { Product, CartItem, CartTotals, Coupon, Order } from "@shared/schema";

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthQuery();

  // Get settings for tax calculation
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Payment processing mutation
  const { mutateAsync: processPaymentMutation, isPending: isProcessingPayment } = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Payment Successful",
        description: "Order has been processed successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment.",
        variant: "destructive",
      });
    },
  });

  // Apply coupon mutation
  const { mutateAsync: applyCouponMutation } = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/coupons/${code}`);
      if (!response.ok) throw new Error("Invalid coupon code");
      return response.json();
    },
    onSuccess: (coupon: Coupon) => {
      setAppliedCoupon(coupon);
      toast({
        title: "Coupon Applied",
        description: `${coupon.code} applied successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Invalid Coupon",
        description: error.message || "Coupon code not found or expired.",
        variant: "destructive",
      });
    },
  });

  // Get WooCommerce tax rate
  const { data: wooTaxData } = useQuery<{ taxRate: number }>({
    queryKey: ["/api/woocommerce-tax-rate"],
    staleTime: 300000, // Cache for 5 minutes
  });

  // Calculate cart totals with tax-inclusive pricing
  const cartTotals = useMemo((): CartTotals => {
    const cartItems = cart.map(item => ({
      price: parseFloat(item.product.sale_price || item.product.regular_price),
      quantity: item.quantity,
      taxRate: 0 // Tax is already included in the price
    }));

    let discountPercentage = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === "percentage") {
        discountPercentage = parseFloat(appliedCoupon.amount);
      } else if (appliedCoupon.discount_type === "fixed_cart") {
        // For fixed amount discounts, we'll calculate percentage based on subtotal
        const subtotalTemp = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        discountPercentage = subtotalTemp > 0 ? (parseFloat(appliedCoupon.amount) / subtotalTemp) * 100 : 0;
      }
      
      // Apply minimum/maximum amount restrictions
      const subtotalTemp = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (appliedCoupon.minimum_amount && subtotalTemp < parseFloat(appliedCoupon.minimum_amount)) {
        discountPercentage = 0;
      }
      if (appliedCoupon.maximum_amount && (subtotalTemp * discountPercentage / 100) > parseFloat(appliedCoupon.maximum_amount)) {
        discountPercentage = (parseFloat(appliedCoupon.maximum_amount) / subtotalTemp) * 100;
      }
    }

    // Use WooCommerce tax rate instead of POS settings
    const taxRate = wooTaxData?.taxRate ?? 0; // Use 0% if not available (to match WooCommerce)
    const totals = calculateCartTotals(cartItems, discountPercentage, taxRate);

    return {
      subtotal: totals.subtotal,
      tax: totals.taxTotal,
      discount: totals.discountAmount,
      total: totals.grandTotal,
    };
  }, [cart, appliedCoupon, wooTaxData]);

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    if (product.stock_status !== "instock") {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (product.stock_quantity && newQuantity > product.stock_quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${product.stock_quantity} units available.`,
            variant: "destructive",
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart.`,
      variant: "default",
    });
  }, [toast]);

  // Add product by barcode
  const addProductByBarcode = useCallback(async (barcode: string) => {
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`);
      if (!response.ok) {
        throw new Error("Product not found");
      }
      const product = await response.json();
      addToCart(product);
    } catch (error) {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  }, [addToCart, toast]);

  // Smart search that handles both text and barcode
  const handleSmartSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchQuery("");
      return;
    }

    // Check if the query looks like a barcode (numeric and longer than 4 digits, including leading zeros)
    const isBarcode = /^\d{4,}$/.test(query.trim());
    
    if (isBarcode) {
      // Try barcode search first
      try {
        const response = await fetch(`/api/products/barcode/${query.trim()}`);
        if (response.ok) {
          const product = await response.json();
          addToCart(product);
          
          // Clear search bar after 1 second
          setTimeout(() => {
            setSearchQuery("");
          }, 1000);
          
          return;
        }
      } catch (error) {
        console.log("Barcode search failed:", error);
        // If barcode search fails, show error message
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${query.trim()}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Use regular text search
    setSearchQuery(query);
  }, [addToCart, setSearchQuery, toast]);

  // Update quantity
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          if (item.product.stock_quantity && quantity > item.product.stock_quantity) {
            toast({
              title: "Insufficient Stock",
              description: `Only ${item.product.stock_quantity} units available.`,
              variant: "destructive",
            });
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, [toast]);

  // Remove from cart
  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode("");
    setAppliedCoupon(null);
  }, []);

  // Apply coupon
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    
    try {
      await applyCouponMutation(couponCode.trim());
    } catch (error) {
      // Error is handled in the mutation
    }
  }, [couponCode, applyCouponMutation]);

  // Process payment
  const processPayment = useCallback(async (paymentDetails?: any) => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing payment.",
        variant: "destructive",
      });
      throw new Error("Empty cart");
    }

    const orderNumber = `POS-${Date.now()}`;
    const lineItems = cart.map(item => ({
      product_id: item.product.id,
      woocommerce_id: item.product.woocommerce_id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      price: item.product.sale_price || item.product.regular_price,
      total: (parseFloat(item.product.sale_price || item.product.regular_price) * item.quantity).toFixed(2),
      image_url: item.product.image_url,
    }));

    const orderData = {
      order_number: orderNumber,
      status: "completed",
      total: cartTotals.total.toFixed(2),
      subtotal: cartTotals.subtotal.toFixed(2),
      tax_total: cartTotals.tax.toFixed(2),
      discount_total: cartTotals.discount.toFixed(2),
      coupon_code: appliedCoupon?.code || null,
      cashier_name: user?.username || "POS User",
      payment_method: paymentDetails?.method || "cash",
      payment_details: paymentDetails || null,
      line_items: lineItems,
      synced: false,
    };

    const order = await processPaymentMutation(orderData);
    
    // Clear cart after successful payment
    setCart([]);
    setCouponCode("");
    setAppliedCoupon(null);
    
    return order;
  }, [cart, cartTotals, appliedCoupon, processPaymentMutation, toast]);

  return {
    // State
    cart,
    cartTotals,
    searchQuery,
    selectedCategory,
    couponCode,
    appliedCoupon,
    isProcessingPayment,
    taxRate: wooTaxData?.taxRate ?? 0,

    // Actions
    addToCart,
    addProductByBarcode,
    handleSmartSearch,
    updateQuantity,
    removeFromCart,
    clearCart,
    setSearchQuery,
    setSelectedCategory,
    setCouponCode,
    applyCoupon,
    processPayment,
  };
}
