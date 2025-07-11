import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, User, Phone, Mail, Loader2 } from "lucide-react";
import { Customer } from "@shared/schema";
import AddCustomerModal from "./add-customer-modal";

// Debounce hook for search optimization
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
}

export default function CustomerSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomer,
}: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch customers with debounced search
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers", debouncedSearchTerm],
    queryFn: async () => {
      const url = debouncedSearchTerm 
        ? `/api/customers?search=${encodeURIComponent(debouncedSearchTerm)}`
        : '/api/customers';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    },
    enabled: isOpen && debouncedSearchTerm.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleCustomerCreated = (customer: Customer) => {
    onSelectCustomer(customer);
    setShowAddCustomerModal(false);
    onClose();
  };

  const formatCustomerDisplay = (customer: Customer) => {
    const parts = [];
    if (customer.first_name || customer.last_name) {
      parts.push(`${customer.first_name} ${customer.last_name}`.trim());
    }
    if (customer.email) parts.push(customer.email);
    if (customer.phone) parts.push(customer.phone);
    return parts.join(" • ");
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Search for existing customers or add a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or phone (min 2 characters)..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Selected: {formatCustomerDisplay(selectedCustomer)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectCustomer(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Search Results</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New</span>
                  </Button>
                </div>

                <ScrollArea className="h-64 border rounded-lg">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Searching customers...
                    </div>
                  ) : Array.isArray(customers) && customers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers found. Try a different search term or add a new customer.
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {Array.isArray(customers) && customers.map((customer: Customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {customer.first_name} {customer.last_name}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {customer.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{customer.email}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Quick Actions */}
            {searchTerm.length < 2 && (
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="text-gray-500">
                    Enter at least 2 characters to search for customers
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Customer</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}