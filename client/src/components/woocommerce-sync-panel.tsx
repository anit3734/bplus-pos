import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WooCommerceStatus {
  connected: boolean;
  message: string;
  productCount?: number;
  sampleProduct?: any;
  error?: string;
}

export default function WooCommerceSyncPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check WooCommerce connection status
  const { data: wooStatus, isLoading: statusLoading } = useQuery<WooCommerceStatus>({
    queryKey: ['/api/test-woocommerce'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Manual refresh products from WooCommerce
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      // Invalidate all caches to force fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/test-woocommerce'] });
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Products and categories refreshed from WooCommerce",
      });
    },
    onError: () => {
      setIsRefreshing(false);
      toast({
        title: "Sync Failed",
        description: "Failed to refresh data from WooCommerce",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = () => {
    if (statusLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (wooStatus?.connected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (statusLoading) return <Badge variant="secondary">Checking...</Badge>;
    if (wooStatus?.connected) return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {wooStatus?.connected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            WooCommerce Integration
          </CardTitle>
          <CardDescription>
            Live connection to your WordPress website for real-time product and order sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">Connection Status</span>
            </div>
            {getStatusBadge()}
          </div>

          <div className="text-sm text-muted-foreground">
            {wooStatus?.message || "Checking connection..."}
          </div>

          {wooStatus?.connected && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-foreground">Products Available</div>
                  <div className="text-muted-foreground">{wooStatus.productCount || 0} items</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Sync Status</div>
                  <div className="text-green-600">Live</div>
                </div>
              </div>

              {wooStatus.sampleProduct && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium text-sm mb-2">Sample Product</div>
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <div className="font-medium">{wooStatus.sampleProduct.name}</div>
                      <div className="text-muted-foreground">
                        ID: {wooStatus.sampleProduct.id} | 
                        Stock: {wooStatus.sampleProduct.stock_status}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {wooStatus?.error && (
            <>
              <Separator />
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="font-medium text-red-800 dark:text-red-200 text-sm">Connection Error</div>
                <div className="text-red-600 dark:text-red-400 text-xs mt-1">{wooStatus.error}</div>
              </div>
            </>
          )}

          <Separator />
          
          <div className="flex gap-2">
            <Button 
              onClick={() => refreshMutation.mutate()} 
              disabled={isRefreshing || statusLoading}
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/test-woocommerce'] })}
            >
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Data Sources
          </CardTitle>
          <CardDescription>
            Information about where your POS data is coming from
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">Products & Categories</span>
              <Badge variant={wooStatus?.connected ? "default" : "secondary"}>
                {wooStatus?.connected ? "Live WooCommerce" : "Local Cache"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Inventory Tracking</span>
              <Badge variant={wooStatus?.connected ? "default" : "secondary"}>
                {wooStatus?.connected ? "Real-time Sync" : "Manual Entry"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Processing</span>
              <Badge variant={wooStatus?.connected ? "default" : "secondary"}>
                {wooStatus?.connected ? "Auto-sync to WooCommerce" : "Local Only"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Coupon Codes</span>
              <Badge variant={wooStatus?.connected ? "default" : "secondary"}>
                {wooStatus?.connected ? "Live Validation" : "Static List"}
              </Badge>
            </div>
          </div>

          <Separator />
          
          <div className="text-xs text-muted-foreground">
            {wooStatus?.connected ? (
              <>
                ✅ Your POS is fully integrated with your WordPress website. 
                All transactions will automatically sync to your WooCommerce store.
              </>
            ) : (
              <>
                ⚠️ Currently using local data. Configure WooCommerce credentials 
                to enable live website integration.
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}