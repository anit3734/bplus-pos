import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CustomProductModal } from "./custom-product-modal";
import type { Product, Category } from "@shared/schema";

interface ProductPanelProps {
  onAddProduct: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSmartSearch: (query: string) => void;
  selectedCategory: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export default function ProductPanel({
  onAddProduct,
  searchQuery,
  onSearchChange,
  onSmartSearch,
  selectedCategory,
  onCategoryChange,
}: ProductPanelProps) {
  const [customProductModalOpen, setCustomProductModalOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery, categoryId: selectedCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory.toString());
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const formatPrice = (price: string) => {
    return formatCurrency(parseFloat(price));
  };

  const getEffectivePrice = (product: Product) => {
    return product.sale_price || product.regular_price;
  };

  const hasDiscount = (product: Product) => {
    return product.sale_price && parseFloat(product.sale_price) < parseFloat(product.regular_price);
  };

  return (
    <div className="w-3/5 bg-card border-r border-border flex flex-col">
      {/* Search and Actions Bar */}
      <div className="p-3 border-b border-border">
        <div className="flex space-x-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
            <Input
              type="text"
              placeholder="Search products by name, SKU, or scan barcode..."
              className="pl-7 text-sm h-8"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                onSearchChange(value);
                
                // Auto-trigger barcode search for numeric strings 4+ digits
                if (/^\d{4,}$/.test(value)) {
                  setTimeout(() => {
                    onSmartSearch(value);
                  }, 500); // Small delay to allow for more typing
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onSmartSearch(searchQuery);
                }
              }}
            />
          </div>
          <Button
            onClick={() => onSmartSearch(searchQuery)}
            size="sm"
            className="h-8 px-3"
          >
            <Search className="mr-1 h-3 w-3" />
            Search
          </Button>
          <Button
            onClick={() => setCustomProductModalOpen(true)}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Plus className="mr-1 h-3 w-3" />
            Custom
          </Button>
        </div>
        
        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => onCategoryChange(null)}
            size="sm"
            className="h-7 px-3 text-xs whitespace-nowrap"
          >
            All Products
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => onCategoryChange(category.id)}
              size="sm"
              className="h-7 px-3 text-xs whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {isLoading ? (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pos-card animate-pulse">
                <div className="w-full h-32 bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-6 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory ? "No products found" : "No products available"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded p-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onAddProduct(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                      <span>SKU: {product.sku || "N/A"}</span>
                      <span>Stock: {product.stock_quantity || 0}</span>
                      {hasDiscount(product) && (
                        <span className="text-green-600 font-medium">SALE</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">
                        {formatPrice(getEffectivePrice(product))}
                      </div>
                      {hasDiscount(product) && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.regular_price)}
                        </div>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      product.stock_status === "instock" ? "bg-green-500" : "bg-red-500"
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom Product Modal */}
      <CustomProductModal
        open={customProductModalOpen}
        onOpenChange={setCustomProductModalOpen}
        onProductCreated={onAddProduct}
        categories={categories}
      />
    </div>
  );
}
