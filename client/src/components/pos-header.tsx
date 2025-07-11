import { useQuery } from "@tanstack/react-query";
import { Store, Wifi, WifiOff, RotateCcw, Settings, User, Plus, Undo2, History, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Settings as SettingsType, Customer } from "@shared/schema";
import { useAuthQuery } from "@/hooks/useAuth";

interface POSHeaderProps {
  selectedCustomer?: Customer | null;
  onOpenCustomerModal?: () => void;
  onOpenReturnModal?: () => void;
  onOpenHistoryModal?: () => void;
}

export default function POSHeader({ selectedCustomer, onOpenCustomerModal, onOpenReturnModal, onOpenHistoryModal }: POSHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuthQuery();
  
  const { data: settings } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Mock sync status - in real app this would come from actual sync state
  const syncStatus = {
    connected: true,
    syncing: false,
    lastSync: new Date(),
  };

  return (
    <header className="bg-card shadow-sm border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {(settings as any)?.store_name || "B-Plus Retail Store"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {(settings as any)?.store_address || "123 Commerce Street, Downtown"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Customer Selection */}
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            {selectedCustomer ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCustomerModal}
                className="flex items-center space-x-2"
              >
                <span className="text-sm font-medium">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCustomerModal}
                className="flex items-center space-x-2"
              >
                <Plus className="w-3 h-3" />
                <span className="text-sm">Select Customer</span>
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenReturnModal}
              className="flex items-center space-x-2"
            >
              <Undo2 className="w-4 h-4" />
              <span className="text-sm">Returns</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHistoryModal}
              className="flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </Button>
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-2">
            {syncStatus.syncing ? (
              <>
                <RotateCcw className="w-3 h-3 text-accent animate-spin" />
                <span className="text-sm font-medium text-accent">Syncing...</span>
              </>
            ) : syncStatus.connected ? (
              <>
                <div className="sync-indicator sync-connected" />
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">WooCommerce Connected</span>
              </>
            ) : (
              <>
                <div className="sync-indicator sync-disconnected" />
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Offline Mode</span>
              </>
            )}
          </div>
          
          {/* Cashier Info */}
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role || "cashier"}
            </p>
          </div>
          
          {/* Admin Button - Only show for admin users */}
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Button>
            </Link>
          )}
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
          
          {/* Date & Time */}
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{formatDate(currentTime)}</p>
            <p className="text-xs text-muted-foreground">{formatTime(currentTime)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
