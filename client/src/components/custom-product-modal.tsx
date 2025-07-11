import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

const customProductSchema = insertProductSchema.extend({
  category_ids: z.array(z.number()).optional(),
  stock_quantity: z.number().min(0).optional(),
  generate_sku: z.boolean().optional(),
  generate_barcode: z.boolean().optional(),
});

type CustomProductForm = z.infer<typeof customProductSchema>;

interface CustomProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: any) => void;
  categories: Array<{ id: number; name: string }>;
}

export function CustomProductModal({ 
  open, 
  onOpenChange, 
  onProductCreated,
  categories 
}: CustomProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomProductForm>({
    resolver: zodResolver(customProductSchema),
    defaultValues: {
      name: "",
      regular_price: "0",
      sale_price: "",
      description: "",
      sku: "",
      stock_quantity: 1,
      stock_status: "instock",
      category_ids: [],
      tax_class: "",
      generate_sku: true,
      generate_barcode: true,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: CustomProductForm) => {
      const productData = {
        ...data,
        category_ids: data.category_ids || [15], // Default to Uncategorized
        sku: data.generate_sku ? undefined : data.sku,
        barcode: data.generate_barcode ? undefined : data.barcode,
      };
      
      const response = await fetch("/api/products/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create product");
      }
      
      return response.json();
    },
    onSuccess: (newProduct) => {
      toast({
        title: "Custom Product Created",
        description: `${newProduct.name} has been added to your catalog and WooCommerce.`,
      });
      
      // Invalidate products cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Add the product to cart immediately
      onProductCreated(newProduct);
      
      // Reset form and close modal
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomProductForm) => {
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Product</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter product name" 
                      {...field} 
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="regular_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="Optional" 
                        {...field}
                        value={field.value || ""}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Product description (optional)" 
                      {...field}
                      value={field.value || ""}
                      className="text-base"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value?.[0]?.toString() || "15"}
                      onValueChange={(value) => field.onChange([Number(value)])}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generate_sku"
                  {...form.register("generate_sku")}
                  className="h-4 w-4"
                />
                <Label htmlFor="generate_sku" className="text-sm">
                  Auto-generate SKU
                </Label>
              </div>

              {!form.watch("generate_sku") && (
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter SKU" 
                          {...field}
                          value={field.value || ""}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="generate_barcode"
                  {...form.register("generate_barcode")}
                  className="h-4 w-4"
                />
                <Label htmlFor="generate_barcode" className="text-sm">
                  Auto-generate Barcode
                </Label>
              </div>

              {!form.watch("generate_barcode") && (
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter barcode" 
                          {...field}
                          value={field.value || ""}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
                className="min-w-[120px]"
              >
                {createProductMutation.isPending ? "Creating..." : "Create & Add to Cart"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}