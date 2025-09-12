import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import MetricCard from "@/components/metric-card";
import ExpiryAlertsTable from "@/components/expiry-alerts-table";
import AIRecommendations from "@/components/ai-recommendations";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  Package, 
  FileText, 
  AlertCircle,
  File,
  UserPlus,
  Truck,
  BarChart3,
  ChevronRight
} from "lucide-react";

interface DashboardMetrics {
  totalRevenue: number;
  activeProducts: number;
  openOrders: number;
  outstandingAmount: number;
  expiringProductsCount: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'purchase' | 'payment';
  customerOrSupplier: string;
  amount: number;
  status: string;
  reference: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    enabled: isAuthenticated && !isLoading,
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/transactions"],
    enabled: isAuthenticated && !isLoading,
  });

  useEffect(() => {
    if (metricsError && isUnauthorizedError(metricsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [metricsError, toast]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
  }

  const filteredTransactions = transactions?.filter(t => 
    transactionFilter === "all" || t.type === transactionFilter
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-100 text-green-800';
      case 'purchase': return 'bg-orange-100 text-orange-800';
      case 'payment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Implementation would navigate to appropriate pages or open modals
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Admin Dashboard"
          subtitle="Overview of your pharmaceutical distribution operations"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-dashboard">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {metricsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-lg" />
                  </div>
                </Card>
              ))
            ) : metrics ? (
              <>
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(metrics.totalRevenue)}
                  subtitle="↗ 12.5% vs last month"
                  icon={DollarSign}
                  iconColor="text-primary"
                  iconBgColor="bg-primary/10"
                  subtitleColor="text-green-600"
                  testId="card-revenue"
                />
                
                <MetricCard
                  title="Active Products"
                  value={metrics.activeProducts}
                  subtitle={`⚠ ${metrics.expiringProductsCount} expiring soon`}
                  icon={Package}
                  iconColor="text-accent-foreground"
                  iconBgColor="bg-accent"
                  subtitleColor="text-orange-600"
                  testId="card-products"
                />
                
                <MetricCard
                  title="Open Orders"
                  value={metrics.openOrders}
                  subtitle="⏱ 23 pending approval"
                  icon={FileText}
                  iconColor="text-secondary-foreground"
                  iconBgColor="bg-secondary"
                  subtitleColor="text-blue-600"
                  testId="card-orders"
                />
                
                <MetricCard
                  title="Outstanding"
                  value={formatCurrency(metrics.outstandingAmount)}
                  subtitle="↓ 8 overdue invoices"
                  icon={AlertCircle}
                  iconColor="text-destructive"
                  iconBgColor="bg-destructive/10"
                  subtitleColor="text-red-600"
                  testId="card-outstanding"
                />
              </>
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-muted-foreground">Failed to load dashboard metrics</p>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Expiry Alerts Section */}
            <div className="xl:col-span-2">
              <ExpiryAlertsTable />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* AI Recommendations */}
              <AIRecommendations />

              {/* Quick Actions */}
              <Card data-testid="card-quick-actions">
                <CardHeader className="border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => handleQuickAction('create-invoice')}
                    data-testid="button-create-invoice"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="text-primary w-5 h-5" />
                      <span>Create Invoice</span>
                    </div>
                    <ChevronRight className="text-muted-foreground w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => handleQuickAction('add-customer')}
                    data-testid="button-add-customer"
                  >
                    <div className="flex items-center space-x-3">
                      <UserPlus className="text-primary w-5 h-5" />
                      <span>Add Customer</span>
                    </div>
                    <ChevronRight className="text-muted-foreground w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => handleQuickAction('stock-movement')}
                    data-testid="button-stock-movement"
                  >
                    <div className="flex items-center space-x-3">
                      <Truck className="text-primary w-5 h-5" />
                      <span>Stock Movement</span>
                    </div>
                    <ChevronRight className="text-muted-foreground w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => handleQuickAction('generate-report')}
                    data-testid="button-generate-report"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="text-primary w-5 h-5" />
                      <span>Generate Report</span>
                    </div>
                    <ChevronRight className="text-muted-foreground w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Warehouse Status */}
              <Card data-testid="card-warehouse-status">
                <CardHeader className="border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Warehouse Status</h3>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-foreground">Main Warehouse</span>
                    </div>
                    <span className="text-muted-foreground text-sm">85% capacity</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-foreground">Cold Storage</span>
                    </div>
                    <span className="text-muted-foreground text-sm">62% capacity</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-foreground">Branch - Luanda</span>
                    </div>
                    <span className="text-muted-foreground text-sm">95% capacity</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-8">
            <Card data-testid="card-recent-transactions">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                  <div className="flex items-center space-x-2">
                    <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                      <SelectTrigger className="w-48" data-testid="select-transaction-filter">
                        <SelectValue placeholder="All Transactions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transactions</SelectItem>
                        <SelectItem value="sale">Sales</SelectItem>
                        <SelectItem value="purchase">Purchases</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="link" 
                      className="text-primary hover:text-primary/80 text-sm p-0"
                      data-testid="button-view-all-transactions"
                    >
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Customer/Supplier</th>
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactionsLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                            <td className="px-6 py-4">
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                          </tr>
                        ))
                      ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.slice(0, 10).map((transaction) => (
                          <tr key={transaction.id} className="table-row" data-testid={`row-transaction-${transaction.id}`}>
                            <td className="px-6 py-4 text-sm text-foreground" data-testid={`text-date-${transaction.id}`}>
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getTransactionTypeColor(transaction.type)}`}
                                    data-testid={`badge-type-${transaction.id}`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground" data-testid={`text-party-${transaction.id}`}>
                                  {transaction.customerOrSupplier}
                                </p>
                                <p className="text-muted-foreground text-sm" data-testid={`text-reference-${transaction.id}`}>
                                  {transaction.reference}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground" data-testid={`text-amount-${transaction.id}`}>
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(transaction.status)}`}
                                    data-testid={`badge-status-${transaction.id}`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 space-x-2">
                              <Button 
                                variant="link" 
                                className="text-primary hover:text-primary/80 text-sm p-0"
                                data-testid={`button-view-${transaction.id}`}
                              >
                                View
                              </Button>
                              <Button 
                                variant="link" 
                                className="text-muted-foreground hover:text-foreground text-sm p-0"
                                data-testid={`button-print-${transaction.id}`}
                              >
                                Print
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="w-12 h-12 text-muted-foreground/40 mb-2" />
                              <p className="text-muted-foreground">No transactions found</p>
                              <p className="text-sm text-muted-foreground/70">
                                {transactionFilter !== 'all' ? 'Try changing the filter' : 'Transactions will appear here as they are created'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
