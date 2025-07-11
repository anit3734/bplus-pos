import { useState } from "react";
import { X, Camera, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

export default function BarcodeModal({ isOpen, onClose, onBarcodeScanned }: BarcodeModalProps) {
  const [manualBarcode, setManualBarcode] = useState("");

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Barcode Scanner
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Scan a product barcode using your camera or enter the barcode number manually to find products.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera View Placeholder */}
          <div className="bg-muted h-48 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Camera view for barcode scanning</p>
              <p className="text-xs text-muted-foreground mt-1">
                Camera integration would use QuaggaJS or html5-qrcode
              </p>
            </div>
          </div>
          
          {/* Manual Input Fallback */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Or enter barcode manually:
            </label>
            <Input
              type="text"
              placeholder="Enter barcode or SKU..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pos-input"
              autoFocus
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleManualSearch}
              disabled={!manualBarcode.trim()}
              className="flex-1 pos-button pos-button-primary"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Product
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 pos-button pos-button-neutral"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
