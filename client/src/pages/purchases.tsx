import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  DollarSign, 
  Calendar, 
  Building, 
  Eye, 
  Edit, 
  Package, 
  Truck, 
  CheckCircle, 
  FileText,
  Receipt,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Upload,
  Download,
  RefreshCw,
  Check,
  X,
  Settings
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertPurchaseRequestSchema, 
  insertPurchaseOrderSchema,
  insertGoodsReceiptSchema,
  insertVendorBillSchema,
  insertCompetitorPriceSchema,
  type PurchaseRequest,
  type PurchaseOrder, 
  type GoodsReceipt,
  type VendorBill,
  type FxRate,
  type CompetitorPrice,
  type Supplier, 
  type Product,
  type Warehouse,
  type User,
  type InsertPurchaseRequest,
  type InsertPurchaseOrder,
  type InsertGoodsReceipt,
  type InsertVendorBill,
  type InsertCompetitorPrice
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

// Extended types for frontend
interface PurchaseRequestWithDetails extends PurchaseRequest {
  requester: User;
  supplier?: Supplier;
  items: Array<{
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitPrice?: string;
    lineTotal?: string;
    notes?: string;
  }>;
}

interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier: Supplier;
  items: Array<{
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

interface GoodsReceiptWithDetails extends GoodsReceipt {
  purchaseOrder: PurchaseOrder & { supplier: Supplier };
  warehouse: Warehouse;
  receivedByUser: User;
  items: Array<{
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
    notes?: string;
  }>;
}

interface VendorBillWithDetails extends VendorBill {
  supplier: Supplier;
  purchaseOrder?: PurchaseOrder;
  createdByUser: User;
  items: Array<{
    id: string;
    productId?: string;
    product?: Product;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    description?: string;
  }>;
}

interface CompetitorPriceWithDetails extends CompetitorPrice {
  product: Product;
}

interface PurchaseDashboardMetrics {
  totalPurchaseOrders: number;
  pendingApprovals: number;
  openPurchaseOrders: number;
  totalPurchaseValue: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    orderCount: number;
    totalValue: number;
  }>;
  upcomingPayments: Array<{
    billId: string;
    billNumber: string;
    supplierName: string;
    amount: number;
    currency: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  matchingExceptions: number;
  currencyExposure: Array<{
    currency: string;
    amount: number;
    exposureType: 'payables' | 'orders';
  }>;
}

export default function Purchases() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreatePRModalOpen, setIsCreatePRModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [isCreateGRModalOpen, setIsCreateGRModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isCreateCompPriceModalOpen, setIsCreateCompPriceModalOpen] = useState(false);
  const { toast } = useToast();

  // Queries
  const { data: dashboardMetrics, isLoading: isDashboardLoading } = useQuery<PurchaseDashboardMetrics>({
    queryKey: ["/api/purchases/dashboard"],
  });

  const { data: purchaseRequests, isLoading: isPRLoading } = useQuery<PurchaseRequestWithDetails[]>({
    queryKey: ["/api/purchases/requests"],
  });

  const { data: purchaseOrders, isLoading: isPOLoading } = useQuery<PurchaseOrderWithDetails[]>({
    queryKey: ["/api/purchases/orders"],
  });

  const { data: goodsReceipts, isLoading: isGRLoading } = useQuery<GoodsReceiptWithDetails[]>({
    queryKey: ["/api/purchases/receipts"],
  });

  const { data: vendorBills, isLoading: isBillsLoading } = useQuery<VendorBillWithDetails[]>({
    queryKey: ["/api/purchases/bills"],
  });

  const { data: competitorPrices, isLoading: isCompPricesLoading } = useQuery<CompetitorPriceWithDetails[]>({
    queryKey: ["/api/purchases/competitor-prices"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: fxRates } = useQuery<FxRate[]>({
    queryKey: ["/api/fx/rates"],
  });

  // Forms
  const prForm = useForm<InsertPurchaseRequest>({
    resolver: zodResolver(insertPurchaseRequestSchema),
    defaultValues: {
      prNumber: `PR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      totalAmount: "0",
      currency: "USD",
      status: "draft",
      notes: "",
    },
  });

  const poForm = useForm<InsertPurchaseOrder>({
    resolver: zodResolver(insertPurchaseOrderSchema),
    defaultValues: {
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      orderDate: new Date().toISOString().split('T')[0],
      status: "draft",
      subtotal: "0",
      taxAmount: "0",
      totalAmount: "0",
      currency: "USD",
    },
  });

  const grForm = useForm<InsertGoodsReceipt>({
    resolver: zodResolver(insertGoodsReceiptSchema),
    defaultValues: {
      status: "draft",
      notes: "",
    },
  });

  const billForm = useForm<InsertVendorBill>({
    resolver: zodResolver(insertVendorBillSchema),
    defaultValues: {
      billDate: new Date().toISOString().split('T')[0],
      totalAmount: "0",
      currency: "USD",
      status: "draft",
    },
  });

  const compPriceForm = useForm<InsertCompetitorPrice>({
    resolver: zodResolver(insertCompetitorPriceSchema),
    defaultValues: {
      price: "0",
      currency: "USD",
      isActive: true,
    },
  });

  // Mutations
  const createPRMutation = useMutation({
    mutationFn: async (data: InsertPurchaseRequest) => {
      const response = await apiRequest("POST", "/api/purchases/requests", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      setIsCreatePRModalOpen(false);
      prForm.reset();
      toast({ title: "Success", description: "Purchase request created successfully" });
    },
    onError: handleMutationError,
  });

  const createPOMutation = useMutation({
    mutationFn: async (data: InsertPurchaseOrder) => {
      const response = await apiRequest("POST", "/api/purchases/orders", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      setIsCreatePOModalOpen(false);
      poForm.reset();
      toast({ title: "Success", description: "Purchase order created successfully" });
    },
    onError: handleMutationError,
  });

  const approvePRMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${id}/approve`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase request approved successfully" });
    },
    onError: handleMutationError,
  });

  const rejectPRMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${id}/reject`, { comment });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase request rejected" });
    },
    onError: handleMutationError,
  });

  const performMatchingMutation = useMutation({
    mutationFn: async (poId: string) => {
      const response = await apiRequest("POST", `/api/purchases/match/${poId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/match"] });
      toast({ title: "Success", description: "Three-way matching completed" });
    },
    onError: handleMutationError,
  });

  const refreshFxRatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fx/refresh", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fx/rates"] });
      toast({ title: "Success", description: "FX rates refreshed successfully" });
    },
    onError: handleMutationError,
  });

  // Purchase Order status management mutations
  const sendPOMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/purchases/orders/${id}`, { status: "sent" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase order sent to supplier" });
    },
    onError: handleMutationError,
  });

  const confirmPOMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/purchases/orders/${id}`, { status: "confirmed" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase order confirmed" });
    },
    onError: handleMutationError,
  });

  const receivePOMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/purchases/orders/${id}`, { status: "received" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase order marked as received" });
    },
    onError: handleMutationError,
  });

  const cancelPOMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/purchases/orders/${id}`, { status: "cancelled" });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Purchase order cancelled" });
    },
    onError: handleMutationError,
  });

  function handleMutationError(error: any) {
    if (isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    toast({
      title: "Error",
      description: "Operation failed. Please try again.",
      variant: "destructive",
    });
  }

  // Utility functions
  const formatCurrency = (amount: string | number, currency = "USD") => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': 
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved':
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'received':
      case 'posted': return 'bg-purple-100 text-purple-800';
      case 'rejected':
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'matched': return 'bg-green-100 text-green-800';
      case 'quantity_mismatch':
      case 'price_mismatch': return 'bg-yellow-100 text-yellow-800';
      case 'missing_receipt':
      case 'missing_bill': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Dashboard Tab Component
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Purchase Orders</p>
                <h3 className="text-2xl font-bold" data-testid="text-total-purchase-orders">
                  {dashboardMetrics?.totalPurchaseOrders || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Approvals</p>
                <h3 className="text-2xl font-bold" data-testid="text-pending-approvals">
                  {dashboardMetrics?.pendingApprovals || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Purchase Value</p>
                <h3 className="text-2xl font-bold" data-testid="text-total-purchase-value">
                  {formatCurrency(dashboardMetrics?.totalPurchaseValue || 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Matching Exceptions</p>
                <h3 className="text-2xl font-bold" data-testid="text-matching-exceptions">
                  {dashboardMetrics?.matchingExceptions || 0}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isDashboardLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
              ) : dashboardMetrics?.topSuppliers.length ? (
                dashboardMetrics.topSuppliers.slice(0, 5).map((supplier) => (
                  <div key={supplier.supplierId} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{supplier.supplierName}</div>
                      <div className="text-sm text-muted-foreground">{supplier.orderCount} orders</div>
                    </div>
                    <div className="font-bold">{formatCurrency(supplier.totalValue)}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No supplier data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isDashboardLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))
              ) : dashboardMetrics?.upcomingPayments.length ? (
                dashboardMetrics.upcomingPayments.slice(0, 5).map((payment) => (
                  <div key={payment.billId} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{payment.billNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.supplierName} • Due in {payment.daysUntilDue} days
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(payment.amount, payment.currency)}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No upcoming payments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Purchase Requests Tab Component
  const PurchaseRequestsTab = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search purchase requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
              data-testid="input-search-requests"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter-pr">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreatePRModalOpen} onOpenChange={setIsCreatePRModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-purchase-request">
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Purchase Request</DialogTitle>
            </DialogHeader>
            <Form {...prForm}>
              <form onSubmit={prForm.handleSubmit((data) => createPRMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={prForm.control}
                    name="prNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PR Number *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-pr-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={prForm.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-supplier-pr">
                              <SelectValue placeholder="Select supplier (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={prForm.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-pr-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={prForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency-pr">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="AOA">AOA</SelectItem>
                            <SelectItem value="BRL">BRL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={prForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} data-testid="textarea-pr-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreatePRModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPRMutation.isPending} data-testid="button-submit-pr">
                    {createPRMutation.isPending ? "Creating..." : "Create Purchase Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase Requests Table */}
      <Card data-testid="card-purchase-requests">
        <CardHeader>
          <CardTitle>Purchase Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">PR Number</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPRLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : purchaseRequests && purchaseRequests.length > 0 ? (
                  purchaseRequests
                    .filter(pr => {
                      const matchesSearch = pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        pr.requester.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (pr.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || pr.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((pr) => (
                      <tr key={pr.id} data-testid={`row-purchase-request-${pr.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">{pr.prNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{pr.requester.firstName && pr.requester.lastName ? `${pr.requester.firstName} ${pr.requester.lastName}` : pr.requester.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{pr.supplier?.name || 'TBD'}</div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatCurrency(pr.totalAmount || 0, pr.currency || 'USD')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(pr.status || 'draft')}>
                            {getStatusText(pr.status || 'draft')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {pr.status === 'submitted' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approvePRMutation.mutate(pr.id)}
                                  disabled={approvePRMutation.isPending}
                                  data-testid={`button-approve-pr-${pr.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => rejectPRMutation.mutate({ id: pr.id, comment: "Rejected from list" })}
                                  disabled={rejectPRMutation.isPending}
                                  data-testid={`button-reject-pr-${pr.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" data-testid={`button-view-pr-${pr.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No purchase requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Purchase Orders Tab Component
  const PurchaseOrdersTab = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
              data-testid="input-search-orders"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter-po">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreatePOModalOpen} onOpenChange={setIsCreatePOModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-purchase-order">
              <Plus className="w-4 h-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Purchase Order</DialogTitle>
            </DialogHeader>
            <Form {...poForm}>
              <form onSubmit={poForm.handleSubmit((data) => createPOMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={poForm.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO Number *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-po-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={poForm.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-supplier-po">
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={poForm.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-po-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={poForm.control}
                    name="expectedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} data-testid="input-po-delivery-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={poForm.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ""} data-testid="input-po-payment-terms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={poForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency-po">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="AOA">AOA</SelectItem>
                            <SelectItem value="BRL">BRL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={poForm.control}
                    name="incoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-incoterm">
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                            <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
                            <SelectItem value="FOB">FOB - Free on Board</SelectItem>
                            <SelectItem value="CIF">CIF - Cost, Insurance & Freight</SelectItem>
                            <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={poForm.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-po-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={poForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} data-testid="textarea-po-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreatePOModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPOMutation.isPending} data-testid="button-submit-po">
                    {createPOMutation.isPending ? "Creating..." : "Create Purchase Order"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase Orders Table */}
      <Card data-testid="card-purchase-orders">
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPOLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : purchaseOrders && purchaseOrders.length > 0 ? (
                  purchaseOrders
                    .filter(po => {
                      const matchesSearch = po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((po) => (
                      <tr key={po.id} data-testid={`row-purchase-order-${po.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">{po.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{po.supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{po.supplier.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{format(new Date(po.orderDate), 'MMM dd, yyyy')}</div>
                          {po.expectedDeliveryDate && (
                            <div className="text-sm text-muted-foreground">
                              Exp: {format(new Date(po.expectedDeliveryDate), 'MMM dd')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatCurrency(po.totalAmount || 0, po.currency || 'USD')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(po.status || 'draft')}>
                            {getStatusText(po.status || 'draft')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {po.status === 'draft' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => sendPOMutation.mutate(po.id)}
                                  disabled={sendPOMutation.isPending}
                                  data-testid={`button-send-po-${po.id}`}
                                >
                                  <Truck className="w-4 h-4 mr-1" />
                                  {sendPOMutation.isPending ? "Sending..." : "Send"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => cancelPOMutation.mutate(po.id)}
                                  disabled={cancelPOMutation.isPending}
                                  data-testid={`button-cancel-po-${po.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {po.status === 'sent' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => confirmPOMutation.mutate(po.id)}
                                  disabled={confirmPOMutation.isPending}
                                  data-testid={`button-confirm-po-${po.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {confirmPOMutation.isPending ? "Confirming..." : "Confirm"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => cancelPOMutation.mutate(po.id)}
                                  disabled={cancelPOMutation.isPending}
                                  data-testid={`button-cancel-po-${po.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {po.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => receivePOMutation.mutate(po.id)}
                                disabled={receivePOMutation.isPending}
                                data-testid={`button-receive-po-${po.id}`}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                {receivePOMutation.isPending ? "Processing..." : "Mark Received"}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" data-testid={`button-view-po-${po.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {['draft', 'sent'].includes(po.status || '') && (
                              <Button size="sm" variant="outline" data-testid={`button-edit-po-${po.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No purchase orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Purchases"
          subtitle="Comprehensive purchase management system"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-purchases">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">
                <FileText className="w-4 h-4 mr-2" />
                Requests
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="receipts" data-testid="tab-receipts">
                <Receipt className="w-4 h-4 mr-2" />
                Receipts
              </TabsTrigger>
              <TabsTrigger value="bills" data-testid="tab-bills">
                <FileText className="w-4 h-4 mr-2" />
                Bills
              </TabsTrigger>
              <TabsTrigger value="matching" data-testid="tab-matching">
                <CheckCircle className="w-4 h-4 mr-2" />
                Matching
              </TabsTrigger>
              <TabsTrigger value="prices" data-testid="tab-prices">
                <TrendingUp className="w-4 h-4 mr-2" />
                Prices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <DashboardTab />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <PurchaseRequestsTab />
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <PurchaseOrdersTab />
            </TabsContent>

            <TabsContent value="receipts" className="mt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Goods Receipts tab - Coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="bills" className="mt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Vendor Bills tab - Coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="matching" className="mt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Three-Way Matching tab - Coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="prices" className="mt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Competitor Prices tab - Coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}