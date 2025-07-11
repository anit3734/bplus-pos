import { CheckCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Order } from "@shared/schema";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPrintReceipt: () => void;
}

export default function PaymentModal({ isOpen, onClose, order, onPrintReceipt }: PaymentModalProps) {
  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  const handlePrintAndClose = () => {
    onPrintReceipt();
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-96 text-center">
        <DialogHeader>
          <DialogTitle>Payment Successful!</DialogTitle>
          <DialogDescription>
            Order {order.order_number} has been processed successfully.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          
          <p className="text-2xl font-bold text-success mb-6">
            {formatPrice(order.total)}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={handlePrintAndClose}
              className="w-full pos-button pos-button-primary"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt & Continue
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full pos-button pos-button-neutral"
            >
              Continue without Printing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
