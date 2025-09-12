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
import { ShoppingCart, Search, Plus, DollarSign, Calendar, Building, Eye, Edit, Package, Truck, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPurchaseOrderSchema, type PurchaseOrder, type Supplier, type InsertPurchaseOrder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

interface PurchaseOrderWithSupplier extends PurchaseOrder {
  supplier: Supplier;
}

export default function Purchases() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading, error } = useQuery<PurchaseOrderWithSupplier[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<InsertPurchaseOrder>({
    resolver: zodResolver(insertPurchaseOrderSchema),
    defaultValues: {
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      supplierId: "",
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: "",
      status: "draft",
      subtotal: "0",
      taxAmount: "0",
      totalAmount: "0",
      notes: "",
    },
  });

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: InsertPurchaseOrder) => {
      const response = await apiRequest("POST", "/api/purchase-orders", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setIsCreateModalOpen(false);
      form.reset({
        orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        supplierId: "",
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: "",
        status: "draft",
        subtotal: "0",
        taxAmount: "0",
        totalAmount: "0",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Purchase order created successfully",
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
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPurchaseOrder) => {
    createPurchaseOrderMutation.mutate(data);
  };

  const filteredOrders = purchaseOrders?.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return Package;
      case 'sent': return Truck;
      case 'confirmed': return CheckCircle;
      case 'received': return Building;
      case 'closed': return CheckCircle;
      default: return Package;
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Purchases"
            subtitle="Manage purchase orders and supplier relationships"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load purchase orders</h3>
                  <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
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
          title="Purchases"
          subtitle="Manage purchase orders and supplier relationships"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-purchases">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search purchase orders or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-purchases"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" data-testid="button-create-purchase-order">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Purchase Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Purchase Order</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="PO-2024-0001" {...field} data-testid="input-order-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-supplier">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-order-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="expectedDeliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Delivery Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-delivery-date" />
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
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-subtotal" />
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
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-tax-amount" />
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
                              <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-total-amount" />
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
                            <Textarea placeholder="Additional notes or requirements..." {...field} data-testid="textarea-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPurchaseOrderMutation.isPending}
                        data-testid="button-submit-purchase-order"
                      >
                        {createPurchaseOrderMutation.isPending ? "Creating..." : "Create Purchase Order"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Purchase Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-purchase-orders">
                      {filteredOrders.length}
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
                    <p className="text-muted-foreground text-sm">Total Value</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-purchase-value">
                      {formatCurrency(
                        filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0)
                      )}
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
                    <p className="text-muted-foreground text-sm">Pending Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-pending-purchase-orders">
                      {filteredOrders.filter(order => order.status === 'sent' || order.status === 'draft').length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Received Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-received-purchase-orders">
                      {filteredOrders.filter(order => order.status === 'received' || order.status === 'closed').length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Order Date</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Delivery Date</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
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
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => {
                        const StatusIcon = getStatusIcon(order.status || 'draft');
                        
                        return (
                          <tr key={order.id} className="table-row" data-testid={`row-purchase-order-${order.id}`}>
                            <td className="px-6 py-4">
                              <div className="font-mono text-sm" data-testid={`text-order-number-${order.id}`}>
                                {order.orderNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-foreground" data-testid={`text-supplier-name-${order.id}`}>
                                  {order.supplier.name}
                                </div>
                                {order.supplier.country && (
                                  <div className="text-muted-foreground text-sm" data-testid={`text-supplier-country-${order.id}`}>
                                    {order.supplier.country}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm" data-testid={`text-order-date-${order.id}`}>
                              {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm" data-testid={`text-delivery-date-${order.id}`}>
                              {order.expectedDeliveryDate ? format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy') : 'Not set'}
                            </td>
                            <td className="px-6 py-4 font-medium" data-testid={`text-order-amount-${order.id}`}>
                              {formatCurrency(order.totalAmount || 0)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="w-4 h-4" />
                                <Badge className={getStatusColor(order.status || 'draft')} data-testid={`badge-status-${order.id}`}>
                                  {getStatusText(order.status || 'draft')}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Link href={`/purchases/${order.id}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    data-testid={`button-view-${order.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  data-testid={`button-edit-${order.id}`}
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
                            <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              {searchTerm || statusFilter !== "all" ? "No purchase orders found" : "No purchase orders yet"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchTerm || statusFilter !== "all"
                                ? "No orders match your current filters. Try adjusting your search."
                                : "Get started by creating your first purchase order."
                              }
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-first-purchase-order">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Purchase Order
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
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
