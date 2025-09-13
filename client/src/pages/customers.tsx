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
import { Progress } from "@/components/ui/progress";
import { Users, Search, Plus, Edit, Trash2, DollarSign, Calendar, Phone, Mail, MapPin, FileText, CreditCard, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Customers() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: customers, isLoading, error } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch credit information for each customer
  const { data: creditInfoMap } = useQuery({
    queryKey: ["/api/crm/customers/credit-summary"],
    queryFn: async () => {
      if (!customers?.length) return {};
      
      const creditPromises = customers.map(async (customer) => {
        try {
          const response = await fetch(`/api/crm/customers/${customer.id}/credit-check?orderAmount=0`);
          if (response.ok) {
            const creditInfo = await response.json();
            return { [customer.id]: creditInfo };
          }
        } catch (error) {
          console.warn(`Failed to fetch credit info for customer ${customer.id}:`, error);
        }
        return { [customer.id]: null };
      });
      
      const results = await Promise.all(creditPromises);
      return results.reduce((acc, item) => ({ ...acc, ...item }), {});
    },
    enabled: !!customers?.length,
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      creditLimit: "0",
      paymentTerms: 30,
      assignedSalesRep: "",
      isActive: true,
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Customer created successfully",
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
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    // Clean up empty values - convert empty strings to null for optional FK fields
    const cleanedData = {
      ...data,
      assignedSalesRep: data.assignedSalesRep || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      taxId: data.taxId || null,
    };
    createCustomerMutation.mutate(cleanedData);
  };

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  // Utility functions for CRM features
  const getSentimentIndicator = (customer: Customer) => {
    // Mock sentiment analysis based on payment behavior and credit utilization
    const creditInfo = creditInfoMap?.[customer.id];
    if (!creditInfo) return { icon: Minus, color: "text-muted-foreground", label: "Unknown" };

    const creditUtilization = creditInfo.creditLimit > 0 
      ? (creditInfo.outstandingAmount / creditInfo.creditLimit) * 100 
      : 0;

    if (creditUtilization < 30) {
      return { icon: CheckCircle, color: "text-green-600", label: "Excellent" };
    } else if (creditUtilization < 60) {
      return { icon: TrendingUp, color: "text-blue-600", label: "Good" };
    } else if (creditUtilization < 90) {
      return { icon: AlertTriangle, color: "text-orange-600", label: "Caution" };
    } else {
      return { icon: XCircle, color: "text-red-600", label: "High Risk" };
    }
  };

  const getCreditUtilization = (customer: Customer) => {
    const creditInfo = creditInfoMap?.[customer.id];
    if (!creditInfo || creditInfo.creditLimit <= 0) return { percentage: 0, available: 0 };

    const percentage = (creditInfo.outstandingAmount / creditInfo.creditLimit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      available: creditInfo.availableCredit,
      outstanding: creditInfo.outstandingAmount
    };
  };

  // Quick action mutations
  const createQuotationMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const quotationData = {
        quotationNumber: `QT-${Date.now()}`,
        customerId,
        status: 'draft',
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        currency: 'USD',
        fxRate: '1.00',
        subtotal: '0.00',
        taxAmount: '0.00',
        discountAmount: '0.00',
        totalAmount: '0.00',
        notes: null,
      };
      
      const response = await apiRequest("POST", "/api/crm/quotations", quotationData);
      return await response.json();
    },
    onSuccess: (quotation) => {
      toast({
        title: "Success",
        description: `Quotation ${quotation.quotationNumber} created successfully`,
      });
      // Redirect to quotation page when we have it
      // navigate(`/quotations/${quotation.id}`);
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
        description: "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Customers"
            subtitle="Manage customer relationships and credit terms"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load customers</h3>
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
          title="Customers"
          subtitle="Manage customer relationships and credit terms"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-customers">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground" data-testid="button-add-customer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Customer</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter customer name" {...field} data-testid="input-customer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="customer@example.com" {...field} value={field.value || ''} data-testid="input-customer-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} data-testid="input-customer-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Tax identification number" {...field} value={field.value || ''} data-testid="input-customer-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Full address" {...field} value={field.value || ''} data-testid="textarea-customer-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                value={field.value ?? '0'}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                name={field.name}
                                data-testid="input-credit-limit" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentTerms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Terms (Days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="30" 
                                value={field.value ?? 30}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 30)}
                                onBlur={field.onBlur}
                                name={field.name}
                                data-testid="input-payment-terms" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCustomerMutation.isPending}
                        data-testid="button-submit-customer"
                      >
                        {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </Card>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow" data-testid={`card-customer-${customer.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg truncate" data-testid={`text-customer-name-${customer.id}`}>
                            {customer.name}
                          </CardTitle>
                          {(() => {
                            const sentiment = getSentimentIndicator(customer);
                            const SentimentIcon = sentiment.icon;
                            return (
                              <div className={`flex items-center space-x-1 ${sentiment.color}`} title={`Credit Health: ${sentiment.label}`}>
                                <SentimentIcon className="w-4 h-4" />
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center space-x-1 truncate">
                              <Mail className="w-4 h-4" />
                              <span className="truncate" data-testid={`text-email-${customer.id}`}>{customer.email}</span>
                            </div>
                          )}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center space-x-1 mt-1 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span data-testid={`text-phone-${customer.id}`}>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge 
                          variant={customer.isActive ? "default" : "secondary"}
                          data-testid={`badge-status-${customer.id}`}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {(() => {
                          const sentiment = getSentimentIndicator(customer);
                          return (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${sentiment.color} border-current`}
                              data-testid={`badge-sentiment-${customer.id}`}
                            >
                              {sentiment.label}
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {customer.address && (
                      <div className="flex items-start space-x-1 mb-3 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2" data-testid={`text-address-${customer.id}`}>{customer.address}</span>
                      </div>
                    )}
                    
                    {/* Credit Utilization Progress */}
                    {(() => {
                      const creditUtilization = getCreditUtilization(customer);
                      const creditInfo = creditInfoMap?.[customer.id];
                      
                      return (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Credit Utilization</span>
                            <span className="font-medium" data-testid={`text-credit-utilization-${customer.id}`}>
                              {creditUtilization.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={creditUtilization.percentage} 
                            className="h-2"
                            data-testid={`progress-credit-${customer.id}`}
                          />
                          {creditInfo && (
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Outstanding: {formatCurrency(creditInfo.outstandingAmount)}</span>
                              <span>Available: {formatCurrency(creditUtilization.available)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>Credit Limit</span>
                        </div>
                        <p className="font-medium" data-testid={`text-credit-limit-${customer.id}`}>
                          {formatCurrency(customer.creditLimit || 0)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Payment Terms</span>
                        </div>
                        <p className="font-medium" data-testid={`text-payment-terms-${customer.id}`}>
                          {customer.paymentTerms || 30} days
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => createQuotationMutation.mutate(customer.id)}
                        disabled={createQuotationMutation.isPending}
                        data-testid={`button-create-quotation-${customer.id}`}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {createQuotationMutation.isPending ? "Creating..." : "Quote"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const creditInfo = creditInfoMap?.[customer.id];
                          if (creditInfo) {
                            toast({
                              title: "Credit Check",
                              description: `Available Credit: ${formatCurrency(creditInfo.availableCredit)}`,
                            });
                          } else {
                            toast({
                              title: "Credit Check",
                              description: "Credit information not available",
                              variant: "destructive",
                            });
                          }
                        }}
                        data-testid={`button-credit-check-${customer.id}`}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Credit
                      </Button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        Created {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" data-testid={`button-edit-${customer.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Link href={`/customers/${customer.id}`}>
                          <Button size="sm" data-testid={`button-view-${customer.id}`}>
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? "No customers found" : "No customers yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? `No customers match "${searchTerm}". Try adjusting your search.`
                        : "Get started by adding your first customer."
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-customer">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Customer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
