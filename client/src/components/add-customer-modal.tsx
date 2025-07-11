import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus } from "lucide-react";
import { Customer, InsertCustomer } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: AddCustomerModalProps) {
  const [newCustomer, setNewCustomer] = useState<InsertCustomer>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "IN",
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customer: InsertCustomer) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create customer");
      }
      return response.json();
    },
    onSuccess: (newCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onCustomerCreated(newCustomer);
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      console.error("Failed to create customer:", error);
    },
  });

  const resetForm = () => {
    setNewCustomer({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "IN",
    });
  };

  const handleCreateCustomer = () => {
    if (newCustomer.first_name && newCustomer.last_name) {
      createCustomerMutation.mutate(newCustomer);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg">
            <UserPlus className="h-4 w-4" />
            <span>Add New Customer</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create a new customer profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Basic Information */}
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
            </div>
            
            <div>
              <Label htmlFor="first_name" className="text-xs">First Name *</Label>
              <Input
                id="first_name"
                value={newCustomer.first_name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, first_name: e.target.value })
                }
                placeholder="First name"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="last_name" className="text-xs">Last Name *</Label>
              <Input
                id="last_name"
                value={newCustomer.last_name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, last_name: e.target.value })
                }
                placeholder="Last name"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value || null })
                }
                placeholder="Email address"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                value={newCustomer.phone || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value || null })
                }
                placeholder="Phone number"
                className="h-8 text-sm"
              />
            </div>

            {/* Address Information */}
            <div className="col-span-2 mt-3">
              <h4 className="text-xs font-medium text-gray-900 mb-2">Address (Optional)</h4>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="address_line_1" className="text-xs">Street Address</Label>
              <Input
                id="address_line_1"
                value={newCustomer.address_line_1 || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address_line_1: e.target.value || null })
                }
                placeholder="Street address"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="city" className="text-xs">City</Label>
              <Input
                id="city"
                value={newCustomer.city || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, city: e.target.value || null })
                }
                placeholder="City"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="state" className="text-xs">State</Label>
              <Input
                id="state"
                value={newCustomer.state || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, state: e.target.value || null })
                }
                placeholder="State"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="postal_code" className="text-xs">PIN Code</Label>
              <Input
                id="postal_code"
                value={newCustomer.postal_code || ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, postal_code: e.target.value || null })
                }
                placeholder="PIN Code"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCustomer}
              disabled={
                !newCustomer.first_name ||
                !newCustomer.last_name ||
                createCustomerMutation.isPending
              }
              className="min-w-[100px]"
            >
              {createCustomerMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Create
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}