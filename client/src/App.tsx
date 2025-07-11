import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthQuery } from "@/hooks/useAuth";
import POSPage from "@/pages/pos";
import AdminPage from "@/pages/admin";
import LoginPage from "@/pages/login";
import LandingPage from "@/pages/landing";

function AuthenticatedRouter() {
  const { user, isLoading, isAuthenticated } = useAuthQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <Switch>
      <Route path="/pos" component={POSPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={() => <div>404 - Page Not Found</div>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={() => <LoginPage onLoginSuccess={() => {}} />} />
          <Route path="/pos" component={AuthenticatedRouter} />
          <Route path="/admin" component={AuthenticatedRouter} />
          <Route component={() => <div>404 - Page Not Found</div>} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
