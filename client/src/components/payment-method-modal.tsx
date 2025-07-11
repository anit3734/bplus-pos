import { useState } from "react";
import { CreditCard, Banknote, Smartphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PaymentMethod = "cash" | "upi" | "online";

interface PaymentDetails {
  method: PaymentMethod;
  reference?: string;
  upiId?: string;
  cardNumber?: string;
  amountReceived?: number;
  changeAmount?: number;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentConfirm: (paymentDetails: PaymentDetails) => void;
}

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  onPaymentConfirm 
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState<string>(totalAmount.toString());
  const [reference, setReference] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");

  const changeAmount = parseFloat(amountReceived) - totalAmount;

  const handleConfirmPayment = () => {
    const paymentDetails: PaymentDetails = {
      method: selectedMethod,
      amountReceived: parseFloat(amountReceived),
      changeAmount: selectedMethod === "cash" ? Math.max(0, changeAmount) : 0,
    };

    if (selectedMethod === "upi") {
      paymentDetails.upiId = upiId;
      paymentDetails.reference = reference;
    } else if (selectedMethod === "online") {
      paymentDetails.reference = reference;
    }

    onPaymentConfirm(paymentDetails);
  };

  const isValidPayment = () => {
    if (selectedMethod === "cash") {
      return parseFloat(amountReceived) >= totalAmount;
    }
    if (selectedMethod === "upi") {
      return upiId.trim() !== "" && parseFloat(amountReceived) === totalAmount;
    }
    if (selectedMethod === "online") {
      return reference.trim() !== "" && parseFloat(amountReceived) === totalAmount;
    }
    return false;
  };

  const resetForm = () => {
    setAmountReceived(totalAmount.toString());
    setReference("");
    setUpiId("");
  };

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedMethod === "cash" ? "default" : "outline"}
              onClick={() => handleMethodChange("cash")}
              className="h-16 flex flex-col items-center gap-1"
            >
              <Banknote className="h-5 w-5" />
              <span className="text-xs">Cash</span>
            </Button>
            
            <Button
              variant={selectedMethod === "upi" ? "default" : "outline"}
              onClick={() => handleMethodChange("upi")}
              className="h-16 flex flex-col items-center gap-1"
            >
              <Smartphone className="h-5 w-5" />
              <span className="text-xs">UPI</span>
            </Button>
            
            <Button
              variant={selectedMethod === "online" ? "default" : "outline"}
              onClick={() => handleMethodChange("online")}
              className="h-16 flex flex-col items-center gap-1"
            >
              <Globe className="h-5 w-5" />
              <span className="text-xs">Online</span>
            </Button>
          </div>

          {/* Total Amount Display */}
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </div>

          {/* Payment Details Form */}
          <div className="space-y-3">
            {selectedMethod === "cash" && (
              <>
                <div>
                  <Label htmlFor="amount-received">Amount Received</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter amount received"
                  />
                </div>
                
                {changeAmount > 0 && (
                  <div className="bg-green-50 border border-green-200 p-2 rounded">
                    <div className="text-sm text-green-700">Change to Return</div>
                    <div className="font-bold text-green-800">${changeAmount.toFixed(2)}</div>
                  </div>
                )}
                
                {changeAmount < 0 && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded">
                    <div className="text-sm text-red-700">Insufficient Amount</div>
                    <div className="font-bold text-red-800">${Math.abs(changeAmount).toFixed(2)} short</div>
                  </div>
                )}
              </>
            )}

            {selectedMethod === "upi" && (
              <>
                <div>
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter UPI ID (e.g., user@paytm)"
                  />
                </div>
                <div>
                  <Label htmlFor="upi-reference">Transaction Reference</Label>
                  <Input
                    id="upi-reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter UPI transaction reference"
                  />
                </div>
              </>
            )}

            {selectedMethod === "online" && (
              <div>
                <Label htmlFor="online-reference">Transaction Reference</Label>
                <Input
                  id="online-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter online payment reference"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!isValidPayment()}
              className="flex-1"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}