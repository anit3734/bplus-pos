import { useState, useEffect } from "react";
import { X, Printer, Download, MessageCircle, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import type { Order } from "@shared/schema";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  customer?: {
    phone?: string | null;
    email?: string | null;
    first_name?: string;
    last_name?: string;
  } | null;
}

export default function ReceiptModal({ isOpen, onClose, order, customer }: ReceiptModalProps) {
  const [customerEmail, setCustomerEmail] = useState(customer?.email || "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || "");
  const [showContactForm, setShowContactForm] = useState(false);
  
  const { toast } = useToast();
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Update customer info when customer prop changes
  useEffect(() => {
    if (customer) {
      setCustomerEmail(customer.email || "");
      setCustomerPhone(customer.phone || "");
    }
  }, [customer]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined || price === '') {
      return formatCurrency(0);
    }
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return formatCurrency(isNaN(numericPrice) ? 0 : numericPrice);
  };

  const calculateProductDetails = (item: any) => {
    const regularPrice = parseFloat(item.regular_price || item.price || '0');
    const salePrice = parseFloat(item.sale_price || item.price || '0');
    const quantity = item.quantity || 1;
    const effectivePrice = salePrice || regularPrice;
    
    // Calculate discount
    const discountAmount = regularPrice > salePrice ? (regularPrice - salePrice) * quantity : 0;
    
    // Calculate tax (18% GST included in price)
    const taxRate = 0.18;
    const priceBeforeTax = effectivePrice / (1 + taxRate);
    const taxAmount = effectivePrice - priceBeforeTax;
    
    return {
      mrp: regularPrice,
      salePrice: salePrice || regularPrice,
      discount: discountAmount,
      tax: taxAmount * quantity,
      total: effectivePrice * quantity
    };
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 200], // Receipt paper size
      orientation: 'portrait'
    });

    let y = 10;
    const pageWidth = 80;
    const leftMargin = 5;
    const rightMargin = 5;

    // Store Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const storeName = (settings as any)?.store_name || "B-Plus Retail Store";
    doc.text(storeName, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const storeAddress = (settings as any)?.store_address || "123 Commerce Street, Downtown";
    doc.text(storeAddress, pageWidth / 2, y, { align: 'center' });
    y += 4;

    const storePhone = (settings as any)?.store_phone || "(555) 123-4567";
    doc.text(`Phone: ${storePhone}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Receipt Details
    doc.setFontSize(8);
    doc.text(`Date: ${formatDate(order.created_at || new Date())}`, leftMargin, y);
    y += 4;
    doc.text(`Cashier: ${order.cashier_name}`, leftMargin, y);
    y += 4;
    doc.text(`Order #: ${order.order_number}`, leftMargin, y);
    y += 8;

    // Line separator
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 6;

    // Items Header
    doc.setFont('helvetica', 'bold');
    doc.text('Item Details:', leftMargin, y);
    y += 6;

    // Items
    doc.setFont('helvetica', 'normal');
    order.line_items?.forEach((item: any) => {
      const details = calculateProductDetails(item);
      
      // Product name
      doc.setFont('helvetica', 'bold');
      doc.text(item.name, leftMargin, y);
      y += 4;
      
      // Quantity and prices
      doc.setFont('helvetica', 'normal');
      doc.text(`Qty: ${item.quantity}`, leftMargin, y);
      y += 3;
      doc.text(`MRP: ${formatPrice(details.mrp)}`, leftMargin, y);
      doc.text(`Sale: ${formatPrice(details.salePrice)}`, leftMargin + 25, y);
      y += 3;
      doc.text(`Tax: ${formatPrice(details.tax)}`, leftMargin, y);
      doc.text(`Disc: ${formatPrice(details.discount)}`, leftMargin + 25, y);
      y += 3;
      doc.text(`Total: ${formatPrice(details.total)}`, leftMargin + 45, y);
      y += 6;
    });

    // Line separator
    doc.line(leftMargin, y, pageWidth - rightMargin, y);
    y += 6;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ${formatPrice(order.subtotal)}`, leftMargin, y);
    y += 4;
    doc.text(`Tax: ${formatPrice(order.tax_total || '0')}`, leftMargin, y);
    y += 4;
    if (parseFloat(order.discount_total || "0") > 0) {
      doc.text(`Discount: -${formatPrice(order.discount_total || "0")}`, leftMargin, y);
      y += 4;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatPrice(order.total)}`, leftMargin, y);
    y += 8;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Thank you for shopping with us!', pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.text('Returns accepted within 30 days with receipt.', pageWidth / 2, y, { align: 'center' });

    return doc;
  };

  const downloadPDF = () => {
    const doc = generatePDF();
    doc.save(`receipt-${order.order_number}.pdf`);
    toast({
      title: "PDF Downloaded",
      description: "Receipt has been downloaded successfully.",
      variant: "default",
    });
  };

  const shareWhatsApp = async () => {
    if (!customerPhone) {
      setShowContactForm(true);
      return;
    }

    try {
      // Generate PDF
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');
      
      // Create a detailed message with receipt information
      const itemsList = order.line_items.map(item => {
        const details = calculateProductDetails(item);
        return `• ${item.name} (Qty: ${item.quantity})\n  MRP: ${formatPrice(details.mrp)} | Sale: ${formatPrice(details.salePrice)}\n  Tax: ${formatPrice(details.tax)} | Total: ${formatPrice(item.total)}`;
      }).join('\n\n');

      const message = `🧾 *Receipt - Order ${order.order_number}*\n\n` +
        `📅 Date: ${formatDate(order.created_at || new Date())}\n` +
        `🏪 Store: ${(settings as any)?.store_name || 'B-Plus POS Store'}\n\n` +
        `📋 *Items:*\n${itemsList}\n\n` +
        `💰 *Summary:*\n` +
        `Subtotal: ${formatPrice(order.subtotal)}\n` +
        `Tax (18%): ${formatPrice(order.tax_total || "0")}\n` +
        (parseFloat(order.discount_total || "0") > 0 ? `Discount: -${formatPrice(order.discount_total || "0")}\n` : '') +
        `*Total: ${formatPrice(order.total)}*\n\n` +
        `Thank you for shopping with us! 🙏`;

      // Always open WhatsApp directly with customer's phone number
      const cleanPhone = customerPhone.replace(/[^\d]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Auto-download PDF for manual attachment
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "WhatsApp Opened",
        description: `WhatsApp opened for ${cleanPhone}. PDF downloaded for manual attachment.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast({
        title: "Share Failed",
        description: "Unable to share receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async () => {
    if (!customerEmail) {
      setShowContactForm(true);
      return;
    }

    try {
      const doc = generatePDF();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      const emailData = {
        to: customerEmail,
        subject: `Receipt for Order ${order.order_number}`,
        text: `Thank you for shopping with us! Please find your receipt attached for order ${order.order_number}. Total: ${formatPrice(order.total)}`,
        html: `
          <h2>Thank you for shopping with us!</h2>
          <p>Please find your receipt attached for order <strong>${order.order_number}</strong>.</p>
          <p><strong>Total: ${formatPrice(order.total)}</strong></p>
          <p>We appreciate your business!</p>
        `,
        attachment: {
          filename: `receipt-${order.order_number}.pdf`,
          content: pdfBase64
        }
      };

      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Receipt has been sent to customer's email.",
          variant: "default",
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Failed to send receipt via email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const receiptContent = document.getElementById("receipt-content");
    if (!receiptContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: monospace; 
              font-size: 12px; 
              max-width: 300px; 
              margin: 0 auto; 
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 11px; }
            .text-gray-600 { color: #6b7280; }
            .text-success { color: #16a34a; }
            hr { 
              border: none; 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mt-6 { margin-top: 24px; }
            .product-details { 
              border-left: 2px solid #ddd; 
              padding-left: 8px; 
              margin: 4px 0; 
            }
            .price-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr 1fr 1fr; 
              gap: 4px; 
              font-size: 9px; 
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-96 max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Receipt Preview
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Customer Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowContactForm(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setShowContactForm(false)} className="flex-1">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Receipt Content */}
        <div id="receipt-content" className="bg-card p-6 border border-border rounded-lg mb-4 text-sm receipt-content">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">
              {(settings as any)?.store_name || "B-Plus Retail Store"}
            </h2>
            <p className="text-xs text-gray-600">
              {(settings as any)?.store_address || "123 Commerce Street, Downtown"}
            </p>
            <p className="text-xs text-gray-600">
              Phone: {(settings as any)?.store_phone || "(555) 123-4567"}
            </p>
          </div>
          
          <div className="mb-4 text-xs">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(order.created_at || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{order.cashier_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Order #:</span>
              <span>{order.order_number}</span>
            </div>
          </div>
          
          <hr />
          
          {/* Enhanced Receipt Items with Detailed Pricing */}
          <div className="space-y-3 mb-4 text-xs">
            {order.line_items?.map((item, index) => {
              const details = calculateProductDetails(item);
              return (
                <div key={index} className="border-b border-gray-200 pb-2">
                  <div className="font-medium mb-1">{item.name}</div>
                  <div className="text-gray-600 mb-2">Quantity: {item.quantity}</div>
                  
                  {/* Price Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs bg-gray-50 p-2 rounded">
                    <div>
                      <div className="font-medium">MRP</div>
                      <div>{formatPrice(details.mrp)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Sale</div>
                      <div>{formatPrice(details.salePrice)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Tax (18%)</div>
                      <div>{formatPrice(details.tax)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Discount</div>
                      <div className="text-green-600">{formatPrice(details.discount)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right font-bold mt-2">
                    Total: {formatPrice(details.total)}
                  </div>
                </div>
              );
            })}
          </div>
          
          <hr />
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18% GST):</span>
              <span>{formatPrice(order.tax_total || '0')}</span>
            </div>
            {parseFloat(order.discount_total || "0") > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}:</span>
                <span>-{formatPrice(order.discount_total || "0")}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          
          <div className="text-center mt-6 text-xs text-gray-600">
            <p>Thank you for shopping with us!</p>
            <p>Returns accepted within 30 days with receipt.</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handlePrint}
              className="flex-1 pos-button pos-button-primary"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={shareWhatsApp}
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp + PDF
            </Button>
            <Button
              onClick={sendEmail}
              variant="outline"
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full pos-button pos-button-neutral"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}