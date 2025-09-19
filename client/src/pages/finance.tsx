import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Search, 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  Eye, 
  Edit,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type Invoice, type Customer, type InsertInvoice } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format, differenceInDays } from "date-fns";

interface InvoiceWithCustomer extends Invoice {
  customer: Customer;
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

interface DashboardMetrics {
  totalRevenue: number;
  activeProducts: number;
  openOrders: number;
  outstandingAmount: number;
  expiringProductsCount: number;
}

export default function Finance() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery<InvoiceWithCustomer[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/transactions", { limit: 50 }],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const form = useForm<InsertInvoice>({
    resolver: zodResolver(insertInvoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      customerId: "",
      salesOrderId: undefined,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      status: "draft",
      subtotal: "0",
      taxAmount: "0",
      totalAmount: "0",
      paidAmount: "0",
      notes: "",
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateInvoiceModalOpen(false);
      form.reset({
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        customerId: "",
        salesOrderId: undefined,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        status: "draft",
        subtotal: "0",
        taxAmount: "0",
        totalAmount: "0",
        paidAmount: "0",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error) => {
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
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInvoice) => {
    createInvoiceMutation.mutate(data);
  };

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return FileText;
      case 'sent': return Clock;
      case 'paid': return CheckCircle;
      case 'overdue': return AlertCircle;
      case 'cancelled': return AlertCircle;
      default: return FileText;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    return differenceInDays(new Date(), new Date(dueDate));
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-100 text-green-800';
      case 'purchase': return 'bg-orange-100 text-orange-800';
      case 'payment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return TrendingUp;
      case 'purchase': return TrendingDown;
      case 'payment': return DollarSign;
      default: return FileText;
    }
  };

  if (invoicesError) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Finance"
            subtitle="Manage invoices, payments, and financial reporting"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-heading-5 content-gap">Failed to load financial data</h3>
                  <p className="text-body-small text-muted-foreground">Please check your connection and try again</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Finance"
          subtitle="Manage invoices, payments, and financial reporting"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-finance">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-small text-muted-foreground">Total Revenue</p>
                        <h3 className="text-metric-value text-foreground" data-testid="text-total-revenue">
                          {formatCurrency(metrics.totalRevenue)}
                        </h3>
                        <p className="text-body-small text-green-600 mt-1">↗ 12.5% vs last month</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-small text-muted-foreground">Outstanding Amount</p>
                        <h3 className="text-metric-value text-foreground" data-testid="text-outstanding-amount">
                          {formatCurrency(metrics.outstandingAmount)}
                        </h3>
                        <p className="text-body-small text-red-600 mt-1">↓ 8 overdue invoices</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-small text-muted-foreground">Paid Invoices</p>
                        <h3 className="text-metric-value text-foreground" data-testid="text-paid-invoices">
                          {filteredInvoices.filter(inv => inv.status === 'paid').length}
                        </h3>
                        <p className="text-body-small text-blue-600 mt-1">This month</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-small text-muted-foreground">Pending Invoices</p>
                        <h3 className="text-metric-value text-foreground" data-testid="text-pending-invoices">
                          {filteredInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length}
                        </h3>
                        <p className="text-body-small text-orange-600 mt-1">Awaiting payment</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Tabs for different finance sections */}
          <Tabs defaultValue="invoices" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
            </TabsList>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search invoices or customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-invoices"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48" data-testid="select-invoice-status-filter">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isCreateInvoiceModalOpen} onOpenChange={setIsCreateInvoiceModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground" data-testid="button-create-invoice">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="invoiceNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Invoice Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="INV-2024-0001" {...field} data-testid="input-invoice-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-invoice-customer">
                                      <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {customers?.map((customer) => (
                                      <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
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
                            control={form.control}
                            name="invoiceDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Invoice Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-invoice-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-due-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="subtotal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subtotal</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} data-testid="input-invoice-subtotal" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="taxAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax Amount</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} data-testid="input-invoice-tax-amount" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="totalAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Amount</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} data-testid="input-invoice-total-amount" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Additional notes or terms..." {...field} value={field.value || ''} data-testid="textarea-invoice-notes" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-3">
                          <Button type="button" variant="outline" onClick={() => setIsCreateInvoiceModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createInvoiceMutation.isPending}
                            data-testid="button-submit-invoice"
                            className="flex items-center space-x-2"
                          >
                            {createInvoiceMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating...</span>
                              </>
                            ) : (
                              "Create Invoice"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Invoices Table */}
              <Card data-testid="card-invoices">
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Invoice #</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-table-header text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoicesLoading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                              <td className="px-6 py-4">
                                <div>
                                  <Skeleton className="h-4 w-32 mb-1" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                            </tr>
                          ))
                        ) : filteredInvoices.length > 0 ? (
                          filteredInvoices.map((invoice) => {
                            const StatusIcon = getStatusIcon(invoice.status || 'draft');
                            const daysOverdue = invoice.status === 'overdue' ? getDaysOverdue(invoice.dueDate) : 0;
                            
                            return (
                              <tr key={invoice.id} className="table-row" data-testid={`row-invoice-${invoice.id}`}>
                                <td className="px-6 py-4">
                                  <div className="font-mono text-sm" data-testid={`text-invoice-number-${invoice.id}`}>
                                    {invoice.invoiceNumber}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="font-medium text-foreground" data-testid={`text-invoice-customer-name-${invoice.id}`}>
                                      {invoice.customer.name}
                                    </div>
                                    {invoice.customer.email && (
                                      <div className="text-muted-foreground text-sm" data-testid={`text-invoice-customer-email-${invoice.id}`}>
                                        {invoice.customer.email}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm" data-testid={`text-invoice-date-${invoice.id}`}>
                                  {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm" data-testid={`text-invoice-due-date-${invoice.id}`}>
                                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                  </div>
                                  {daysOverdue > 0 && (
                                    <div className="text-xs text-red-600">
                                      {daysOverdue} days overdue
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium" data-testid={`text-invoice-amount-${invoice.id}`}>
                                    {formatCurrency(invoice.totalAmount || 0)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Paid: {formatCurrency(invoice.paidAmount || 0)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <StatusIcon className="w-4 h-4" />
                                    <Badge className={getStatusColor(invoice.status || 'draft')} data-testid={`badge-invoice-status-${invoice.id}`}>
                                      {getStatusText(invoice.status || 'draft')}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <Link href={`/finance/invoices/${invoice.id}`}>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        data-testid={`button-view-invoice-${invoice.id}`}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      data-testid={`button-edit-invoice-${invoice.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                  {searchTerm || statusFilter !== "all" ? "No invoices found" : "No invoices yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                  {searchTerm || statusFilter !== "all"
                                    ? "No invoices match your current filters. Try adjusting your search."
                                    : "Get started by creating your first invoice."
                                  }
                                </p>
                                {!searchTerm && statusFilter === "all" && (
                                  <Button onClick={() => setIsCreateInvoiceModalOpen(true)} data-testid="button-create-first-invoice">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Invoice
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card data-testid="card-transactions">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Party</th>
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {transactionsLoading ? (
                          Array.from({ length: 10 }).map((_, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                              <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                            </tr>
                          ))
                        ) : transactions && transactions.length > 0 ? (
                          transactions.map((transaction) => {
                            const TransactionIcon = getTransactionIcon(transaction.type);
                            
                            return (
                              <tr key={transaction.id} className="table-row" data-testid={`row-transaction-${transaction.id}`}>
                                <td className="px-6 py-4 text-sm" data-testid={`text-transaction-date-${transaction.id}`}>
                                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <TransactionIcon className="w-4 h-4" />
                                    <Badge className={getTransactionTypeColor(transaction.type)} data-testid={`badge-transaction-type-${transaction.id}`}>
                                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium" data-testid={`text-transaction-party-${transaction.id}`}>
                                  {transaction.customerOrSupplier}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono" data-testid={`text-transaction-reference-${transaction.id}`}>
                                  {transaction.reference}
                                </td>
                                <td className="px-6 py-4 font-medium" data-testid={`text-transaction-amount-${transaction.id}`}>
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className={getStatusColor(transaction.status)} data-testid={`badge-transaction-status-${transaction.id}`}>
                                    {getStatusText(transaction.status)}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <DollarSign className="w-12 h-12 text-muted-foreground/40 mb-4" />
                                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                                <p className="text-muted-foreground">Transactions will appear here as they are created</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid="card-financial-reports">
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-profit-loss-report">
                      <FileText className="w-4 h-4 mr-2" />
                      Profit & Loss Statement
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-balance-sheet-report">
                      <FileText className="w-4 h-4 mr-2" />
                      Balance Sheet
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-cash-flow-report">
                      <FileText className="w-4 h-4 mr-2" />
                      Cash Flow Statement
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-receivables-report">
                      <FileText className="w-4 h-4 mr-2" />
                      Aged Receivables
                    </Button>
                  </CardContent>
                </Card>

                <Card data-testid="card-analytics-reports">
                  <CardHeader>
                    <CardTitle>Analytics & Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-sales-analysis-report">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Sales Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-customer-analysis-report">
                      <User className="w-4 h-4 mr-2" />
                      Customer Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-payment-trends-report">
                      <Calendar className="w-4 h-4 mr-2" />
                      Payment Trends
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-tax-summary-report">
                      <Calculator className="w-4 h-4 mr-2" />
                      Tax Summary
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
