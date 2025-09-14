import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Products from "@/pages/products";
import Suppliers from "@/pages/suppliers";
import Warehouses from "@/pages/warehouses";
import Inventory from "@/pages/inventory";
import Sales from "@/pages/sales";
import Purchases from "@/pages/purchases";
import Finance from "@/pages/finance";
import POS from "@/pages/pos";
import HR from "@/pages/hr";
import Marketing from "@/pages/marketing";
import Settings from "@/pages/settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/customers" component={Customers} />
          <Route path="/products" component={Products} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/sales" component={Sales} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/finance" component={Finance} />
          <Route path="/pos" component={POS} />
          <Route path="/hr" component={HR} />
          <Route path="/marketing" component={Marketing} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
