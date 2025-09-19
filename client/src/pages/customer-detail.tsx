import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Users, Mail, Phone, MapPin, DollarSign, Calendar, 
  TrendingUp, TrendingDown, CheckCircle, XCircle, Minus, Brain, 
  RefreshCw, Plus, FileText, CreditCard, AlertTriangle, Clock,
  MessageSquare, Target, BarChart3, Edit, Send, Building2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCommunicationSchema, type Customer, type SalesOrder, type Communication, type CommissionEntry, type Invoice, type Quotation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Communication form schema
const communicationFormSchema = z.object({
  customerId: z.string(),
  communicationType: z.enum(['email', 'phone', 'sms', 'meeting', 'letter', 'visit']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  followUpDate: z.string().optional(),
  status: z.enum(['draft', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed']).optional(),
});

type CommunicationFormData = z.infer<typeof communicationFormSchema>;

export default function CustomerDetail() {
  const { id } = useParams();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const { toast } = useToast();

  // Get current user info
  const { data: users } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Main customer data query
  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery<Customer>({
    queryKey: ["/api/customers", id],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        throw new Error('Customer not found');
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Credit information query
  const { data: creditInfo } = useQuery({
    queryKey: ["/api/customers", id, "credit-check"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${id}/credit-check?orderAmount=0`);
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    enabled: !!id,
  });

  // Sentiment summary query
  const { data: sentimentSummary, isLoading: sentimentLoading } = useQuery({
    queryKey: ["/api/ai/sentiment/customers", id, "summary"],
    queryFn: async () => {
      const response = await fetch(`/api/ai/sentiment/customers/${id}/summary`);
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    enabled: !!id,
  });

  // Communications query
  const { data: communications, isLoading: communicationsLoading } = useQuery<Communication[]>({
    queryKey: ["/api/crm/customers", id, "communications"],
    queryFn: async () => {
      const response = await fetch(`/api/crm/customers/${id}/communications`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!id,
  });

  // Sales orders query
  const { data: salesOrders, isLoading: salesOrdersLoading } = useQuery<SalesOrder[]>({
    queryKey: ["/api/sales-orders", "customer", id],
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders?customerId=${id}&limit=50`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!id,
  });

  // Commissions query (for the assigned sales rep)
  const { data: commissions, isLoading: commissionsLoading } = useQuery<CommissionEntry[]>({
    queryKey: ["/api/crm/commissions", "customer", id],
    queryFn: async () => {
      if (!customer?.assignedSalesRep) return [];
      const response = await fetch(`/api/crm/commissions?salesRepId=${customer.assignedSalesRep}&limit=50`);
      if (response.ok) {
        const allCommissions = await response.json();
        // Filter to only commissions related to this customer (via sales orders/invoices)
        return allCommissions.filter((commission: any) => 
          commission.invoice?.customerId === id || 
          commission.salesOrder?.customerId === id
        );
      }
      return [];
    },
    enabled: !!id && !!customer?.assignedSalesRep,
  });

  // Quotations query
  const { data: quotations, isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/crm/quotations", "customer", id],
    queryFn: async () => {
      const response = await fetch(`/api/crm/quotations?customerId=${id}&limit=20`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: !!id,
  });

  // Communication form
  const commForm = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      customerId: id || '',
      communicationType: 'email' as const,
      direction: 'outbound' as const,
      subject: '',
      content: '',
      followUpDate: '',
      status: 'sent' as const,
    },
  });

  // Mutations
  const sentimentRefreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/ai/sentiment/customers/${id}/batch`, {});
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sentiment/customers", id, "summary"] });
      toast({
        title: "Success",
        description: `Sentiment analysis updated for ${result.processed} communications`,
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
        description: "Failed to refresh sentiment analysis",
        variant: "destructive",
      });
    },
  });

  const createCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const response = await apiRequest("POST", "/api/crm/communications", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", id, "communications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sentiment/customers", id, "summary"] });
      setIsCommModalOpen(false);
      commForm.reset();
      toast({
        title: "Success",
        description: "Communication logged successfully",
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
        description: "Failed to log communication",
        variant: "destructive",
      });
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: async () => {
      const quotationData = {
        quotationNumber: `QT-${Date.now()}`,
        customerId: id,
        status: 'draft',
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotations", "customer", id] });
      toast({
        title: "Success",
        description: `Quotation ${quotation.quotationNumber} created successfully`,
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
        description: "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getSentimentIndicator = () => {
    if (!sentimentSummary?.summary || sentimentSummary.summary.totalCommunications === 0) {
      return { icon: Minus, color: "text-muted-foreground", label: "No Data", score: null };
    }

    const avgScore = sentimentSummary.summary.averageScore;
    
    if (avgScore >= 0.3) {
      return { icon: CheckCircle, color: "text-green-600", label: "Positive", score: avgScore };
    } else if (avgScore >= -0.3) {
      return { icon: TrendingUp, color: "text-blue-600", label: "Neutral", score: avgScore };
    } else {
      return { icon: XCircle, color: "text-red-600", label: "Negative", score: avgScore };
    }
  };

  const getCreditUtilization = () => {
    if (!creditInfo || creditInfo.creditLimit <= 0) return { percentage: 0, available: 0 };

    const percentage = (creditInfo.outstandingAmount / creditInfo.creditLimit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      available: creditInfo.availableCredit,
      outstanding: creditInfo.outstandingAmount
    };
  };

  const onSubmitCommunication = (data: CommunicationFormData) => {
    createCommunicationMutation.mutate(data);
  };

  // Calculate revenue metrics
  const revenueMetrics = () => {
    if (!salesOrders?.length) return { total: 0, average: 0, lastOrder: null };
    
    const total = salesOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);
    const average = total / salesOrders.length;
    const lastOrder = salesOrders.reduce((latest, order) => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
      const latestDate = latest?.createdAt ? new Date(latest.createdAt) : new Date(0);
      return orderDate > latestDate ? order : latest;
    }, salesOrders[0]);

    return { total, average, lastOrder };
  };

  if (customerError) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Customer Details"
            subtitle="Customer information not found"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-heading-5 mb-2">Customer Not Found</h3>
                  <p className="text-muted-foreground text-body-small mb-4">The customer you're looking for doesn't exist or has been removed.</p>
                  <Link href="/customers">
                    <Button variant="outline" className="mt-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Customers
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (customerLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Customer Details"
            subtitle="Loading customer information..."
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const sentiment = getSentimentIndicator();
  const creditUtil = getCreditUtilization();
  const revenue = revenueMetrics();
  const SentimentIcon = sentiment.icon;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title={customer?.name || "Customer Details"}
          subtitle="Comprehensive customer relationship management"
          onOpenAIChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-body-small text-muted-foreground">
              <Link href="/customers" data-testid="link-customers-breadcrumb">
                <Button variant="ghost" size="sm" className="h-auto p-0 font-normal">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Customers
                </Button>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium" data-testid="text-customer-name-breadcrumb">{customer?.name}</span>
            </div>

            {/* Customer Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h1 className="text-heading-4 font-bold text-foreground mb-2" data-testid="text-customer-name">
                        {customer?.name}
                      </h1>
                      <div className="flex items-center space-x-4 text-body-small text-muted-foreground">
                        {customer?.email && (
                          <div className="flex items-center" data-testid="text-customer-email">
                            <Mail className="h-4 w-4 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        {customer?.phone && (
                          <div className="flex items-center" data-testid="text-customer-phone">
                            <Phone className="h-4 w-4 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {customer?.address && (
                          <div className="flex items-center" data-testid="text-customer-address">
                            <MapPin className="h-4 w-4 mr-1" />
                            {customer.address}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-3">
                        {/* Sentiment Indicator */}
                        <div className="flex items-center space-x-2">
                          <SentimentIcon className={`h-4 w-4 ${sentiment.color}`} />
                          <span className="text-body-small" data-testid={`text-sentiment-${sentiment.label.toLowerCase()}`}>
                            {sentiment.label}
                            {sentiment.score && (
                              <span className="ml-1 text-muted-foreground">
                                ({sentiment.score.toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {/* Credit Status */}
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-body-small" data-testid="text-credit-status">
                            {creditInfo ? formatCurrency(creditInfo.availableCredit) : 'N/A'} available
                          </span>
                        </div>

                        {/* Active Status */}
                        <Badge variant={customer?.isActive ? "default" : "secondary"} data-testid={`badge-status-${customer?.isActive ? 'active' : 'inactive'}`}>
                          {customer?.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sentimentRefreshMutation.mutate()}
                      disabled={sentimentRefreshMutation.isPending}
                      data-testid="button-refresh-sentiment"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${sentimentRefreshMutation.isPending ? 'animate-spin' : ''}`} />
                      Refresh Sentiment
                    </Button>
                    
                    <Dialog open={isCommModalOpen} onOpenChange={setIsCommModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-log-communication">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Log Communication
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Log Communication</DialogTitle>
                        </DialogHeader>
                        <Form {...commForm}>
                          <form onSubmit={commForm.handleSubmit(onSubmitCommunication)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={commForm.control}
                                name="communicationType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-communication-type">
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="letter">Letter</SelectItem>
                                        <SelectItem value="visit">Visit</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={commForm.control}
                                name="direction"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Direction</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-communication-direction">
                                          <SelectValue placeholder="Select direction" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="inbound">Inbound</SelectItem>
                                        <SelectItem value="outbound">Outbound</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={commForm.control}
                              name="subject"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Subject</FormLabel>
                                  <FormControl>
                                    <input
                                      {...field}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      placeholder="Communication subject"
                                      data-testid="input-communication-subject"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={commForm.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Communication content or notes"
                                      rows={4}
                                      data-testid="textarea-communication-content"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCommModalOpen(false)}
                                data-testid="button-cancel-communication"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={createCommunicationMutation.isPending}
                                data-testid="button-save-communication"
                              >
                                {createCommunicationMutation.isPending ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Log Communication
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      onClick={() => createQuotationMutation.mutate()}
                      disabled={createQuotationMutation.isPending}
                      data-testid="button-create-quotation"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quotation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5" data-testid="tabs-customer-sections">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="sales" data-testid="tab-sales">Sales History</TabsTrigger>
                <TabsTrigger value="communications" data-testid="tab-communications">Communications</TabsTrigger>
                <TabsTrigger value="commissions" data-testid="tab-commissions">Commissions</TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-form-label text-muted-foreground">Tax ID</label>
                        <p className="text-body-small" data-testid="text-customer-tax-id">{customer?.taxId || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Payment Terms</label>
                        <p className="text-body-small" data-testid="text-customer-payment-terms">{customer?.paymentTerms || 30} days</p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Created Date</label>
                        <p className="text-body-small" data-testid="text-customer-created-date">{formatDate(customer?.createdAt || '')}</p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Last Updated</label>
                        <p className="text-body-small" data-testid="text-customer-updated-date">{formatDate(customer?.updatedAt || '')}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credit Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Credit Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-form-label text-muted-foreground">Credit Limit</label>
                        <p className="text-metric-value" data-testid="text-credit-limit">
                          {formatCurrency(customer?.creditLimit || '0')}
                        </p>
                      </div>
                      {creditInfo && (
                        <>
                          <div>
                            <label className="text-form-label text-muted-foreground mb-2 block">Credit Utilization</label>
                            <div className="space-y-2">
                              <Progress value={creditUtil.percentage} className="h-2" data-testid="progress-credit-utilization" />
                              <div className="flex justify-between text-body-small">
                                <span data-testid="text-credit-used">{formatCurrency(creditInfo.outstandingAmount)} used</span>
                                <span data-testid="text-credit-available">{formatCurrency(creditInfo.availableCredit)} available</span>
                              </div>
                            </div>
                          </div>
                          <div className="pt-2">
                            <Badge
                              variant={creditInfo.canProceed ? "default" : "destructive"}
                              data-testid={`badge-credit-status-${creditInfo.canProceed ? 'good' : 'bad'}`}
                            >
                              {creditInfo.canProceed ? "Credit Good" : "Credit Risk"}
                            </Badge>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Revenue Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-form-label text-muted-foreground">Total Revenue</label>
                        <p className="text-metric-value text-green-600" data-testid="text-total-revenue">
                          {formatCurrency(revenue.total)}
                        </p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Average Order Value</label>
                        <p className="text-metric-value" data-testid="text-average-order-value">
                          {formatCurrency(revenue.average)}
                        </p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Total Orders</label>
                        <p className="text-metric-value" data-testid="text-total-orders">{salesOrders?.length || 0}</p>
                      </div>
                      <div>
                        <label className="text-form-label text-muted-foreground">Last Order</label>
                        <p className="text-body-small" data-testid="text-last-order-date">
                          {revenue.lastOrder ? formatDate(revenue.lastOrder.createdAt) : 'No orders'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sentiment Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Customer Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sentimentLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : sentimentSummary?.summary ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-metric-value font-bold text-green-600" data-testid="text-positive-communications">
                            {sentimentSummary.summary.positiveCommunications}
                          </p>
                          <p className="text-metric-label text-muted-foreground">Positive</p>
                        </div>
                        <div className="text-center">
                          <p className="text-metric-value font-bold text-blue-600" data-testid="text-neutral-communications">
                            {sentimentSummary.summary.neutralCommunications}
                          </p>
                          <p className="text-metric-label text-muted-foreground">Neutral</p>
                        </div>
                        <div className="text-center">
                          <p className="text-metric-value font-bold text-red-600" data-testid="text-negative-communications">
                            {sentimentSummary.summary.negativeCommunications}
                          </p>
                          <p className="text-metric-label text-muted-foreground">Negative</p>
                        </div>
                        <div className="text-center">
                          <p className="text-metric-value font-bold" data-testid="text-total-communications-sentiment">
                            {sentimentSummary.summary.totalCommunications}
                          </p>
                          <p className="text-metric-label text-muted-foreground">Total</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4" data-testid="text-no-sentiment-data">
                        No communication data available for sentiment analysis
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales History Tab */}
              <TabsContent value="sales" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Sales Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {salesOrdersLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : salesOrders?.length ? (
                      <div className="space-y-3">
                        {salesOrders.map((order, index) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-sales-order-${index}`}>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium" data-testid={`text-order-number-${index}`}>{order.orderNumber}</p>
                                  <p className="text-sm text-muted-foreground" data-testid={`text-order-date-${index}`}>
                                    {formatDate(order.createdAt)}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    order.status === 'delivered' ? 'badge-completed' :
                                    order.status === 'shipped' ? 'badge-active' :
                                    order.status === 'confirmed' ? 'badge-approved' :
                                    order.status === 'draft' ? 'badge-draft' :
                                    order.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
                                  }
                                  data-testid={`badge-order-status-${index}`}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold" data-testid={`text-order-amount-${index}`}>
                                {formatCurrency(order.totalAmount || '0')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-sales-orders">
                        No sales orders found for this customer
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quotations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Quotations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quotationsLoading ? (
                      <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : quotations?.length ? (
                      <div className="space-y-3">
                        {quotations.map((quotation, index) => (
                          <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-quotation-${index}`}>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium" data-testid={`text-quotation-number-${index}`}>{quotation.quotationNumber}</p>
                                  <p className="text-sm text-muted-foreground" data-testid={`text-quotation-date-${index}`}>
                                    Valid until {formatDate(quotation.validityDate)}
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    quotation.status === 'accepted' ? 'badge-approved' :
                                    quotation.status === 'sent' ? 'badge-active' :
                                    quotation.status === 'draft' ? 'badge-draft' :
                                    quotation.status === 'expired' ? 'badge-expired' :
                                    quotation.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
                                  }
                                  data-testid={`badge-quotation-status-${index}`}
                                >
                                  {quotation.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold" data-testid={`text-quotation-amount-${index}`}>
                                {formatCurrency(quotation.totalAmount || '0')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-quotations">
                        No quotations found for this customer
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent value="communications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Communication History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {communicationsLoading ? (
                      <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : communications?.length ? (
                      <div className="space-y-4">
                        {communications.map((comm, index) => (
                          <div key={comm.id} className="p-4 border rounded-lg" data-testid={`card-communication-${index}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" data-testid={`badge-comm-type-${index}`}>
                                  {comm.communicationType}
                                </Badge>
                                <Badge 
                                  variant={comm.direction === 'inbound' ? 'secondary' : 'outline'}
                                  data-testid={`badge-comm-direction-${index}`}
                                >
                                  {comm.direction}
                                </Badge>
                                {comm.status && (
                                  <Badge variant="default" data-testid={`badge-comm-status-${index}`}>
                                    {comm.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid={`text-comm-date-${index}`}>
                                {formatDateTime(comm.createdAt)}
                              </p>
                            </div>
                            {comm.subject && (
                              <h4 className="font-medium mb-2" data-testid={`text-comm-subject-${index}`}>{comm.subject}</h4>
                            )}
                            {comm.content && (
                              <p className="text-sm text-muted-foreground" data-testid={`text-comm-content-${index}`}>
                                {comm.content}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-communications">
                        No communications logged for this customer
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Commissions Tab */}
              <TabsContent value="commissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Related Commissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commissionsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : commissions?.length ? (
                      <div className="space-y-3">
                        {commissions.map((commission, index) => (
                          <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-commission-${index}`}>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium" data-testid={`text-commission-ref-${index}`}>
                                    {commission.invoiceId ? 'Invoice' : 'Other'} Commission
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-testid={`text-commission-date-${index}`}>
                                    {formatDate(commission.createdAt)}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    commission.status === 'paid' ? 'default' :
                                    commission.status === 'approved' ? 'secondary' :
                                    commission.status === 'cancelled' ? 'destructive' : 'outline'
                                  }
                                  data-testid={`badge-commission-status-${index}`}
                                >
                                  {commission.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600" data-testid={`text-commission-amount-${index}`}>
                                {formatCurrency(commission.commissionAmount)}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid={`text-commission-rate-${index}`}>
                                {commission.commissionPercent}% rate
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8" data-testid="text-no-commissions">
                        No commission records found for this customer
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Combine and sort all activities */}
                      {[
                        ...(salesOrders || []).map(order => ({
                          type: 'order',
                          title: `Sales Order ${order.orderNumber}`,
                          description: `${order.status} - ${formatCurrency(order.totalAmount || '0')}`,
                          date: order.createdAt,
                          icon: TrendingUp,
                          color: 'text-green-600'
                        })),
                        ...(quotations || []).map(quote => ({
                          type: 'quotation',
                          title: `Quotation ${quote.quotationNumber}`,
                          description: `${quote.status} - ${formatCurrency(quote.totalAmount || '0')}`,
                          date: quote.createdAt,
                          icon: FileText,
                          color: 'text-blue-600'
                        })),
                        ...(communications || []).map(comm => ({
                          type: 'communication',
                          title: `${comm.communicationType.toUpperCase()} ${comm.direction}`,
                          description: comm.subject || 'Communication logged',
                          date: comm.createdAt,
                          icon: MessageSquare,
                          color: 'text-purple-600'
                        }))
                      ]
                        .sort((a, b) => {
                          const bDate = b.date ? new Date(b.date) : new Date(0);
                          const aDate = a.date ? new Date(a.date) : new Date(0);
                          return bDate.getTime() - aDate.getTime();
                        })
                        .slice(0, 20) // Show last 20 activities
                        .map((activity, index) => {
                          const ActivityIcon = activity.icon;
                          return (
                            <div key={`${activity.type}-${index}`} className="flex items-start space-x-3" data-testid={`timeline-item-${index}`}>
                              <div className="flex-shrink-0 mt-1">
                                <ActivityIcon className={`h-4 w-4 ${activity.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" data-testid={`timeline-title-${index}`}>{activity.title}</p>
                                <p className="text-sm text-muted-foreground" data-testid={`timeline-description-${index}`}>{activity.description}</p>
                              </div>
                              <div className="flex-shrink-0">
                                <p className="text-xs text-muted-foreground" data-testid={`timeline-date-${index}`}>
                                  {formatDateTime(activity.date)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      
                      {/* Show empty state if no activities */}
                      {(!salesOrders?.length && !quotations?.length && !communications?.length) && (
                        <p className="text-muted-foreground text-center py-8" data-testid="text-no-timeline-activities">
                          No recent activities found for this customer
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <AIChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}