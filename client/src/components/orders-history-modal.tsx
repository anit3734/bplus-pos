import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { History, Download, MessageCircle, Mail, Eye, Search, Calendar } from "lucide-react";
import ReceiptModal from "./receipt-modal";

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Order {
  id: number;
  woocommerce_id: number | null;
  order_number: string;
  created_at: Date | null;
  total: string;
  subtotal: string;
  tax_total: string | null;
  discount_total: string | null;
  status: string | null;
  cashier_name: string;
  customer_name?: string | null;
  coupon_code: string | null;
  payment_method: string | null;
  payment_details: any;
  synced: boolean | null;
  line_items: any[];
}

export function OrdersHistoryModal({ isOpen, onClose }: OrdersHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isOpen,
  });

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
      (order.created_at && new Date(order.created_at).toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesDate;
  }) || [];

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedOrder(null);
  };

  const downloadOrderPDF = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${order.order_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Orders History</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filter Section */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Orders</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by order number, cashier, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dateFilter">Filter by Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="dateFilter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 font-semibold text-sm border-b">
                <div className="grid grid-cols-7 gap-4">
                  <div>Order #</div>
                  <div>Date & Time</div>
                  <div>Customer</div>
                  <div>Cashier</div>
                  <div>Total</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm || dateFilter ? "No orders found matching your search." : "No orders found."}
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="px-4 py-3 border-b hover:bg-gray-50">
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="font-medium text-blue-600">
                          #{order.order_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </div>
                        <div className="text-sm">
                          {order.customer_name || "Walk-in Customer"}
                        </div>
                        <div className="text-sm">
                          {order.cashier_name}
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(parseFloat(order.total))}
                        </div>
                        <div>
                          <Badge className={getStatusColor(order.status || 'pending')}>
                            {order.status || 'pending'}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReceipt(order)}
                            title="View Receipt"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadOrderPDF(order)}
                            title="Download PDF"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary Statistics */}
            {filteredOrders.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="font-semibold ml-2">{filteredOrders.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-semibold ml-2">
                      {formatCurrency(
                        filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Order Value:</span>
                    <span className="font-semibold ml-2">
                      {formatCurrency(
                        filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0) / filteredOrders.length
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      {selectedOrder && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={handleCloseReceipt}
          order={{
            ...selectedOrder,
            payment_details: selectedOrder.payment_details || null,
            created_at: selectedOrder.created_at ? new Date(selectedOrder.created_at) : new Date()
          }}
          customer={selectedOrder.customer_name ? {
            phone: "",
            email: "",
            first_name: selectedOrder.customer_name.split(' ')[0] || "",
            last_name: selectedOrder.customer_name.split(' ')[1] || ""
          } : null}
        />
      )}
    </>
  );
}