import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Undo2, Search, ShoppingCart } from "lucide-react";

interface ProductReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReturnItem {
  product_id: number;
  name: string;
  sku: string;
  original_price: string;
  quantity_returned: number;
  return_reason: string;
  condition: 'new' | 'used' | 'damaged';
}

export function ProductReturnModal({ isOpen, onClose }: ProductReturnModalProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchOrderMutation = useMutation({
    mutationFn: async (orderNum: string) => {
      const response = await fetch(`/api/orders/search/${orderNum}`);
      if (!response.ok) throw new Error('Order not found');
      return response.json();
    },
    onSuccess: (data) => {
      setOrder(data);
      // Initialize return items with all order items
      const items = data.line_items.map((item: any) => ({
        product_id: item.product_id,
        name: item.name,
        sku: item.sku || '',
        original_price: item.price,
        quantity_returned: 0,
        return_reason: '',
        condition: 'new' as const
      }));
      setReturnItems(items);
      setIsSearching(false);
    },
    onError: () => {
      toast({
        title: "Order Not Found",
        description: "Please check the order number and try again.",
        variant: "destructive",
      });
      setIsSearching(false);
    }
  });

  const processReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });
      if (!response.ok) throw new Error('Failed to process return');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Processed",
        description: "Product return has been processed successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Return Failed",
        description: "Failed to process return. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSearchOrder = () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Order Number Required",
        description: "Please enter an order number to search.",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    searchOrderMutation.mutate(orderNumber);
  };

  const updateReturnItem = (index: number, field: keyof ReturnItem, value: any) => {
    const updated = [...returnItems];
    updated[index] = { ...updated[index], [field]: value };
    setReturnItems(updated);
  };

  const calculateRefundAmount = () => {
    return returnItems.reduce((total, item) => {
      return total + (parseFloat(item.original_price) * item.quantity_returned);
    }, 0);
  };

  const handleProcessReturn = () => {
    const itemsToReturn = returnItems.filter(item => item.quantity_returned > 0);
    
    if (itemsToReturn.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to return.",
        variant: "destructive",
      });
      return;
    }

    if (!refundMethod) {
      toast({
        title: "Refund Method Required",
        description: "Please select a refund method.",
        variant: "destructive",
      });
      return;
    }

    const returnData = {
      order_id: order.id,
      order_number: order.order_number,
      return_items: itemsToReturn,
      refund_method: refundMethod,
      refund_amount: calculateRefundAmount(),
      notes: notes,
      processed_by: "Cashier", // This could be dynamic based on logged-in user
      return_date: new Date().toISOString()
    };

    processReturnMutation.mutate(returnData);
  };

  const handleClose = () => {
    setOrderNumber("");
    setOrder(null);
    setReturnItems([]);
    setRefundMethod("");
    setNotes("");
    setIsSearching(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Undo2 className="h-5 w-5" />
            <span>Product Return</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Search Section */}
          <div className="space-y-4">
            <Label htmlFor="orderNumber">Search Order</Label>
            <div className="flex space-x-2">
              <Input
                id="orderNumber"
                placeholder="Enter order number..."
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchOrder()}
              />
              <Button 
                onClick={handleSearchOrder} 
                disabled={isSearching || searchOrderMutation.isPending}
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Order Number: <span className="font-medium">{order.order_number}</span></div>
                <div>Date: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span></div>
                <div>Total: <span className="font-medium">{formatCurrency(parseFloat(order.total))}</span></div>
                <div>Status: <span className="font-medium">{order.status}</span></div>
              </div>
            </div>
          )}

          {/* Return Items */}
          {order && returnItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Items to Return</h3>
              <div className="space-y-3">
                {returnItems.map((item, index) => (
                  <div key={item.product_id} className="border p-3 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">Price: {formatCurrency(parseFloat(item.original_price))}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`quantity-${index}`}>Quantity to Return</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="0"
                          max="10"
                          value={item.quantity_returned}
                          onChange={(e) => updateReturnItem(index, 'quantity_returned', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`condition-${index}`}>Condition</Label>
                        <Select 
                          value={item.condition} 
                          onValueChange={(value) => updateReturnItem(index, 'condition', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor={`reason-${index}`}>Return Reason</Label>
                        <Input
                          id={`reason-${index}`}
                          placeholder="Reason for return..."
                          value={item.return_reason}
                          onChange={(e) => updateReturnItem(index, 'return_reason', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refund Details */}
          {order && (
            <div className="space-y-4">
              <h3 className="font-semibold">Refund Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="refundMethod">Refund Method</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select refund method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="store_credit">Store Credit</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Refund Amount</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(calculateRefundAmount())}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the return..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            {order && (
              <Button 
                onClick={handleProcessReturn} 
                disabled={processReturnMutation.isPending}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {processReturnMutation.isPending ? "Processing..." : "Process Return"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}