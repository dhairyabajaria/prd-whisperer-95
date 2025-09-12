import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Plus, DollarSign, Calendar, User, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { type SalesOrder, type Customer, type User as UserType } from "@shared/schema";

interface SalesOrderWithRelations extends SalesOrder {
  customer: Customer;
  salesRep?: UserType;
}

export default function Sales() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: salesOrders, isLoading, error } = useQuery<SalesOrderWithRelations[]>({
    queryKey: ["/api/sales-orders"],
  });

  const filteredOrders = salesOrders?.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Sales"
            subtitle="Manage sales orders, quotations, and customer transactions"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load sales orders</h3>
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
          title="Sales"
          subtitle="Manage sales orders, quotations, and customer transactions"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-sales">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search orders or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-sales"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="bg-primary text-primary-foreground" data-testid="button-create-order">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>

          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-orders">
                      {filteredOrders.length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Value</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-value">
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
                    <p className="text-muted-foreground text-sm">Confirmed Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-confirmed-orders">
                      {filteredOrders.filter(order => order.status === 'confirmed').length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Pending Orders</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-pending-orders">
                      {filteredOrders.filter(order => order.status === 'draft').length}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Orders Table */}
          <Card data-testid="card-sales-orders">
            <CardHeader>
              <CardTitle>Sales Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Sales Rep</th>
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
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                        </tr>
                      ))
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="table-row" data-testid={`row-order-${order.id}`}>
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm" data-testid={`text-order-number-${order.id}`}>
                              {order.orderNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-foreground" data-testid={`text-customer-name-${order.id}`}>
                                {order.customer.name}
                              </div>
                              {order.customer.email && (
                                <div className="text-muted-foreground text-sm" data-testid={`text-customer-email-${order.id}`}>
                                  {order.customer.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm" data-testid={`text-order-date-${order.id}`}>
                            {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            {order.salesRep ? (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm" data-testid={`text-sales-rep-${order.id}`}>
                                  {order.salesRep.firstName && order.salesRep.lastName
                                    ? `${order.salesRep.firstName} ${order.salesRep.lastName}`
                                    : order.salesRep.email?.split('@')[0] || 'Unknown'
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium" data-testid={`text-order-amount-${order.id}`}>
                            {formatCurrency(order.totalAmount || 0)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(order.status || 'draft')} data-testid={`badge-status-${order.id}`}>
                              {getStatusText(order.status || 'draft')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Link href={`/sales/${order.id}`}>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                              {searchTerm || statusFilter !== "all" ? "No orders found" : "No sales orders yet"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                              {searchTerm || statusFilter !== "all"
                                ? "No orders match your current filters. Try adjusting your search."
                                : "Get started by creating your first sales order."
                              }
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                              <Button data-testid="button-create-first-order">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Sales Order
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
