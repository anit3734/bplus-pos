import { useState, useRef } from "react";
import POSHeader from "@/components/pos-header";
import ProductPanel from "@/components/product-panel";
import CartPanel from "@/components/cart-panel";

import ReceiptModal from "@/components/receipt-modal";
import PaymentModal from "@/components/payment-modal";
import PaymentMethodModal from "@/components/payment-method-modal";
import CustomerSearchModal from "@/components/customer-search-modal";
import { ProductReturnModal } from "@/components/product-return-modal";
import { OrdersHistoryModal } from "@/components/orders-history-modal";
import { usePOS } from "@/hooks/use-pos";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Customer } from "@shared/schema";

export default function POSPage() {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastProcessedOrder, setLastProcessedOrder] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pos = usePOS();

  const handleProcessPayment = () => {
    // Show payment method selection modal instead of directly processing
    setShowPaymentMethodModal(true);
  };

  const handlePaymentConfirm = async (paymentDetails: any) => {
    try {
      const order = await pos.processPayment(paymentDetails);
      setLastProcessedOrder(order);
      setShowPaymentMethodModal(false);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Payment failed:", error);
      // Error handling will be shown via toast from the hook
    }
  };

  const handlePrintReceipt = () => {
    setShowReceiptModal(true);
  };



  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
  };

  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
  };

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    onBarcodeScanner: () => searchInputRef.current?.focus(),
    onClearCart: pos.clearCart,
    onProcessPayment: handleProcessPayment,
    onFocusSearch: () => searchInputRef.current?.focus(),
  });

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <POSHeader 
        selectedCustomer={selectedCustomer}
        onOpenCustomerModal={handleOpenCustomerModal}
        onOpenReturnModal={() => setShowReturnModal(true)}
        onOpenHistoryModal={() => setShowHistoryModal(true)}
      />
      
      <main className="flex h-[calc(100vh-64px)]">
        <ProductPanel
          onAddProduct={pos.addToCart}
          searchQuery={pos.searchQuery}
          onSearchChange={pos.setSearchQuery}
          onSmartSearch={pos.handleSmartSearch}
          selectedCategory={pos.selectedCategory}
          onCategoryChange={pos.setSelectedCategory}
        />
        
        <CartPanel
          cart={pos.cart}
          cartTotals={pos.cartTotals}
          couponCode={pos.couponCode}
          taxRate={pos.taxRate}
          onCouponCodeChange={pos.setCouponCode}
          onApplyCoupon={pos.applyCoupon}
          onUpdateQuantity={pos.updateQuantity}
          onRemoveItem={pos.removeFromCart}
          onClearCart={pos.clearCart}
          onProcessPayment={handleProcessPayment}
          onPrintReceipt={handlePrintReceipt}
          isProcessingPayment={pos.isProcessingPayment}
        />
      </main>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        customer={selectedCustomer}
        order={lastProcessedOrder || {
          order_number: `POS-${Date.now()}`,
          line_items: pos.cart.map(item => ({
            product_id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            price: item.product.sale_price || item.product.regular_price,
            total: (parseFloat(item.product.sale_price || item.product.regular_price) * item.quantity).toFixed(2),
            image_url: item.product.image_url,
          })),
          subtotal: pos.cartTotals.subtotal.toFixed(2),
          tax_total: pos.cartTotals.tax.toFixed(2),
          discount_total: pos.cartTotals.discount.toFixed(2),
          total: pos.cartTotals.total.toFixed(2),
          coupon_code: pos.couponCode,
          cashier_name: "John Doe",
          created_at: new Date(),
        }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          pos.clearCart();
        }}
        order={lastProcessedOrder}
        onPrintReceipt={() => {
          setShowPaymentModal(false);
          setShowReceiptModal(true);
        }}
      />

      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        totalAmount={pos.cartTotals.total}
        onPaymentConfirm={handlePaymentConfirm}
      />

      <CustomerSearchModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleSelectCustomer}
        selectedCustomer={selectedCustomer}
      />

      <ProductReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
      />

      <OrdersHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}
