import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, Save, Trash2, Plus, Wifi } from "lucide-react";
import WooCommerceSyncPanel from "@/components/woocommerce-sync-panel";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Settings as SettingsType, Product, Category } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("settings");

  // Settings
  const { data: settings } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SettingsType>) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your POS settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Products and Categories
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    updateSettingsMutation.mutate(data);
  };

  const handleReceiptSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    updateSettingsMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your POS system settings</p>
            </div>
          </div>
          <Settings className="h-8 w-8 text-gray-400" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings">Store Settings</TabsTrigger>
            <TabsTrigger value="receipts">Receipt Setup</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {settings && (
                  <form onSubmit={handleSettingsSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="store_name">Store Name</Label>
                        <Input
                          id="store_name"
                          name="store_name"
                          defaultValue={settings.store_name || ""}
                          className="pos-input"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          name="currency"
                          defaultValue={settings.currency || ""}
                          className="pos-input"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="store_address">Store Address</Label>
                      <Input
                        id="store_address"
                        name="store_address"
                        defaultValue={settings.store_address || ""}
                        className="pos-input"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="store_phone">Store Phone</Label>
                      <Input
                        id="store_phone"
                        name="store_phone"
                        defaultValue={settings.store_phone || ""}
                        className="pos-input"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                        <Input
                          id="tax_rate"
                          name="tax_rate"
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          defaultValue={parseFloat(settings.tax_rate || "0") * 100}
                          className="pos-input"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency_symbol">Currency Symbol</Label>
                        <Input
                          id="currency_symbol"
                          name="currency_symbol"
                          defaultValue={settings.currency_symbol || ""}
                          className="pos-input"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="pos-button pos-button-primary"
                      disabled={updateSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <WooCommerceSyncPanel />
          </TabsContent>

          <TabsContent value="receipts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
              </CardHeader>
              <CardContent>
                {settings && (
                  <form onSubmit={handleReceiptSettingsSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-base">Receipt Header</h4>
                        
                        <div>
                          <Label htmlFor="receipt_logo_text">Logo Text</Label>
                          <Input
                            id="receipt_logo_text"
                            name="receipt_logo_text"
                            defaultValue={settings.store_name || ""}
                            className="pos-input"
                            placeholder="Store Logo Text"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_tagline">Tagline</Label>
                          <Input
                            id="receipt_tagline"
                            name="receipt_tagline"
                            defaultValue=""
                            className="pos-input"
                            placeholder="Your Store Tagline"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_website">Website</Label>
                          <Input
                            id="receipt_website"
                            name="receipt_website"
                            defaultValue=""
                            className="pos-input"
                            placeholder="www.yourstore.com"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_email">Email</Label>
                          <Input
                            id="receipt_email"
                            name="receipt_email"
                            type="email"
                            defaultValue=""
                            className="pos-input"
                            placeholder="info@yourstore.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-base">Receipt Footer</h4>
                        
                        <div>
                          <Label htmlFor="receipt_thanks_message">Thank You Message</Label>
                          <Input
                            id="receipt_thanks_message"
                            name="receipt_thanks_message"
                            defaultValue="Thank you for shopping with us!"
                            className="pos-input"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_return_policy">Return Policy</Label>
                          <Input
                            id="receipt_return_policy"
                            name="receipt_return_policy"
                            defaultValue="Returns accepted within 30 days with receipt."
                            className="pos-input"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_social_media">Social Media</Label>
                          <Input
                            id="receipt_social_media"
                            name="receipt_social_media"
                            defaultValue=""
                            className="pos-input"
                            placeholder="Follow us @yourstore"
                          />
                        </div>

                        <div>
                          <Label htmlFor="receipt_promo_message">Promotional Message</Label>
                          <Input
                            id="receipt_promo_message"
                            name="receipt_promo_message"
                            defaultValue=""
                            className="pos-input"
                            placeholder="Next purchase 10% off with code SAVE10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                      <h4 className="font-semibold text-base">Email Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="default_from_email">Default From Email</Label>
                          <Input
                            id="default_from_email"
                            name="default_from_email"
                            type="email"
                            defaultValue=""
                            className="pos-input"
                            placeholder="receipts@yourstore.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="default_from_name">Default From Name</Label>
                          <Input
                            id="default_from_name"
                            name="default_from_name"
                            defaultValue={settings.store_name || ""}
                            className="pos-input"
                            placeholder="Your Store Name"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="pos-button pos-button-primary"
                      disabled={updateSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Receipt Settings"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Receipt Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 max-w-sm mx-auto text-sm font-mono shadow-lg">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">{settings?.store_name || "B-Plus POS Store"}</h3>
                    <p className="text-xs text-gray-600">Your Store Tagline</p>
                    <p className="text-xs text-gray-600">{settings?.store_address || "123 Commerce Street, Downtown"}</p>
                    <p className="text-xs text-gray-600">Phone: {settings?.store_phone || "(555) 123-4567"}</p>
                    <p className="text-xs text-gray-600">www.yourstore.com</p>
                  </div>
                  
                  <hr className="border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span>Demo User</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order #:</span>
                      <span>BPP-001</span>
                    </div>
                  </div>
                  
                  <hr className="border-dashed my-3" />
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-semibold">Sample Product</div>
                      <div className="text-gray-600">Qty: 2</div>
                      <div className="grid grid-cols-4 gap-1 text-xs bg-gray-50 p-1 rounded">
                        <div>
                          <div className="font-medium">MRP</div>
                          <div>₹100.00</div>
                        </div>
                        <div>
                          <div className="font-medium">Sale</div>
                          <div>₹90.00</div>
                        </div>
                        <div>
                          <div className="font-medium">Tax</div>
                          <div>₹16.20</div>
                        </div>
                        <div>
                          <div className="font-medium">Disc</div>
                          <div>₹20.00</div>
                        </div>
                      </div>
                      <div className="text-right font-bold">Total: ₹180.00</div>
                    </div>
                  </div>
                  
                  <hr className="border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹180.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18% GST):</span>
                      <span>₹16.20</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₹180.00</span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4 text-xs text-gray-600 space-y-1">
                    <p>Thank you for shopping with us!</p>
                    <p>Returns accepted within 30 days with receipt.</p>
                    <p>Follow us @yourstore</p>
                    <p className="font-semibold">Next purchase 10% off with code SAVE10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Product Management</h3>
              <Button className="pos-button pos-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products?.map((product: Product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                className="h-10 w-10 rounded object-cover"
                                src={product.image_url || "/placeholder.png"}
                                alt={product.name}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sku || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${product.sale_price || product.regular_price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.stock_quantity || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cashier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders?.map((order: any) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.cashier_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h3 className="text-lg font-semibold">Sales Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${orders?.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0).toFixed(2) || "0.00"}
                  </div>
                  <p className="text-gray-600">{orders?.length || 0} orders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {products?.length || 0}
                  </div>
                  <p className="text-gray-600">In catalog</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {categories?.length || 0}
                  </div>
                  <p className="text-gray-600">Active categories</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}