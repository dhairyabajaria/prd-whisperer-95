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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DollarSign, Search, Plus, Calendar, User, Eye, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { type CommissionEntry, type Invoice, type User as UserType } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CommissionWithRelations extends CommissionEntry {
  invoice: Invoice & {
    customer: {
      name: string;
    };
  };
  salesRep: UserType;
  approvedByUser?: UserType;
}

interface CommissionSummary {
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  cancelledCommissions: number;
  currency: string;
}

export default function Commissions() {
  const { user } = useAuth() as { user: UserType | null };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: commissions, isLoading, error } = useQuery<CommissionWithRelations[]>({
    queryKey: ["/api/crm/commissions"],
  });

  // Calculate summary from commission entries
  const summary: CommissionSummary | undefined = commissions ? {
    totalCommissions: commissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0),
    pendingCommissions: commissions
      .filter(comm => comm.status === 'accrued')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0),
    approvedCommissions: commissions
      .filter(comm => comm.status === 'approved')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0),
    paidCommissions: commissions
      .filter(comm => comm.status === 'paid')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0),
    cancelledCommissions: commissions
      .filter(comm => comm.status === 'cancelled')
      .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0),
    currency: "USD"
  } : undefined;
  
  const summaryLoading = isLoading;

  const { data: salesReps, isLoading: salesRepsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "sales" }],
  });

  const approveMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      return apiRequest(`/api/crm/commissions/${commissionId}/approve`, "PATCH");
    },
    onSuccess: (data, commissionId) => {
      toast({
        title: "Success",
        description: "Commission approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve commission",
        variant: "destructive",
      });
    },
  });

  const filteredCommissions = commissions?.filter(commission => {
    const matchesSearch = 
      commission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${commission.salesRep.firstName} ${commission.salesRep.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    const matchesSalesRep = salesRepFilter === "all" || commission.salesRepId === salesRepFilter;
    
    return matchesSearch && matchesStatus && matchesSalesRep;
  }) || [];

  const formatCurrency = (amount: string | number, currency: string = "USD") => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(num);
  };

  const formatPercentage = (percentage: string | number) => {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    return `${num.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accrued': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accrued': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleApproveCommission = (commissionId: string) => {
    approveMutation.mutate(commissionId);
  };

  const canApproveCommission = (commission: CommissionWithRelations) => {
    return user?.role === 'finance' || user?.role === 'admin';
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Commissions"
            subtitle="Track and manage sales commission entries"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load commissions</h3>
                  <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
        {isChatOpen && <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Commissions"
          subtitle="Track and manage sales commission entries"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-commissions">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by commission ID, invoice, or sales rep..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-commissions"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="accrued">Accrued</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={salesRepFilter} onValueChange={setSalesRepFilter}>
                <SelectTrigger className="w-48" data-testid="select-salesrep-filter">
                  <SelectValue placeholder="All Sales Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales Reps</SelectItem>
                  {salesReps?.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.firstName} {rep.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid="text-total-commissions">
                      {formatCurrency(summary?.totalCommissions || 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All commission entries
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-pending-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending (Accrued)</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-commissions">
                      {formatCurrency(summary?.pendingCommissions || 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting approval
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-approved-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600" data-testid="text-approved-commissions">
                      {formatCurrency(summary?.approvedCommissions || 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for payment
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-paid-commissions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-paid-commissions">
                      {formatCurrency(summary?.paidCommissions || 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed payments
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commission Entries Table */}
          <Card data-testid="card-commissions-table">
            <CardHeader>
              <CardTitle>Commission Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredCommissions.length === 0 ? (
                <div className="text-center py-12" data-testid="empty-commissions">
                  <DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No commission entries found</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {searchTerm || statusFilter !== "all" || salesRepFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Commission entries will appear here when sales are invoiced"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-full space-y-4">
                    {filteredCommissions.map((commission) => (
                      <div 
                        key={commission.id} 
                        className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                        data-testid={`commission-entry-${commission.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium" data-testid={`text-commission-id-${commission.id}`}>
                                  {commission.id.slice(0, 8)}
                                </span>
                                <Badge className={getStatusColor(commission.status || 'draft')} data-testid={`badge-status-${commission.id}`}>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(commission.status || 'draft')}
                                    <span>{getStatusText(commission.status || 'draft')}</span>
                                  </div>
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <span>Invoice:</span>
                                  <span className="font-medium" data-testid={`text-invoice-${commission.id}`}>
                                    {commission.invoice?.invoiceNumber || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span data-testid={`text-salesrep-${commission.id}`}>
                                    {commission.salesRep?.firstName || ''} {commission.salesRep?.lastName || ''}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{commission.createdAt ? format(new Date(commission.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Basis:</span>
                                  <span className="ml-1 font-medium" data-testid={`text-basis-${commission.id}`}>
                                    {formatCurrency(commission.basisAmount, commission.currency || 'USD')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rate:</span>
                                  <span className="ml-1 font-medium" data-testid={`text-rate-${commission.id}`}>
                                    {formatPercentage(commission.commissionPercent)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Commission:</span>
                                  <span className="ml-1 font-semibold text-lg text-primary" data-testid={`text-amount-${commission.id}`}>
                                    {formatCurrency(commission.commissionAmount, commission.currency || 'USD')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {commission.status === 'accrued' && canApproveCommission(commission) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={approveMutation.isPending}
                                    data-testid={`button-approve-${commission.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Commission</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to approve this commission entry of {formatCurrency(commission.commissionAmount, commission.currency || 'USD')} for {commission.salesRep?.firstName || ''} {commission.salesRep?.lastName || ''}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApproveCommission(commission.id)}
                                      className="bg-primary text-primary-foreground"
                                    >
                                      Yes, Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              data-testid={`button-view-${commission.id}`}
                            >
                              <Link href={`/finance/invoices/${commission.invoiceId}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Invoice
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {commission.notes && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground" data-testid={`text-notes-${commission.id}`}>
                              <strong>Notes:</strong> {commission.notes}
                            </p>
                          </div>
                        )}

                        {commission.approvedByUser && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Approved by {commission.approvedByUser?.firstName || ''} {commission.approvedByUser?.lastName || ''} on {commission.approvedAt ? format(new Date(commission.approvedAt), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {isChatOpen && <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
    </div>
  );
}