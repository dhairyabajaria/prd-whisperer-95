import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import CommissionDetailDrawer from "@/components/commission-detail-drawer";
import SalesRepAnalytics from "@/components/sales-rep-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, Search, Plus, Calendar as CalendarIcon, User, Eye, CheckCircle, Clock, XCircle, TrendingUp, Download, MoreHorizontal, Filter, X } from "lucide-react";
import { format, subDays, addDays } from "date-fns";
import { type CommissionEntry, type Invoice, type User as UserType } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
  isMultiCurrency?: boolean;
  currencies?: string[];
}

export default function Commissions() {
  const { user } = useAuth() as { user: UserType | null };
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  const { data: commissions, isLoading, error } = useQuery<CommissionWithRelations[]>({
    queryKey: [
      "/api/crm/commissions", 
      { 
        salesRepId: salesRepFilter !== "all" ? salesRepFilter : undefined, 
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined
      }
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (salesRepFilter !== "all") params.append("salesRepId", salesRepFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/crm/commissions?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch commissions");
      }
      return response.json();
    },
  });

  // Calculate currency-grouped summaries from commission entries
  const currencyGroupedSummary = commissions ? commissions.reduce((acc, comm) => {
    const currency = comm.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = {
        totalCommissions: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        paidCommissions: 0,
        cancelledCommissions: 0,
      };
    }
    
    const amount = parseFloat(comm.commissionAmount);
    acc[currency].totalCommissions += amount;
    
    switch (comm.status) {
      case 'accrued':
        acc[currency].pendingCommissions += amount;
        break;
      case 'approved':
        acc[currency].approvedCommissions += amount;
        break;
      case 'paid':
        acc[currency].paidCommissions += amount;
        break;
      case 'cancelled':
        acc[currency].cancelledCommissions += amount;
        break;
    }
    
    return acc;
  }, {} as Record<string, Omit<CommissionSummary, 'currency'>>) : {};

  // Get primary currency (most common) or default to USD
  const currencies = Object.keys(currencyGroupedSummary);
  const primaryCurrency = currencies.length > 0 
    ? currencies.reduce((a, b) => 
        currencyGroupedSummary[a].totalCommissions > currencyGroupedSummary[b].totalCommissions ? a : b
      ) 
    : 'USD';

  // Create summary for primary currency with indication of multi-currency
  const summary: CommissionSummary | undefined = commissions && currencies.length > 0 ? {
    ...currencyGroupedSummary[primaryCurrency],
    currency: primaryCurrency,
    isMultiCurrency: currencies.length > 1,
    currencies: currencies
  } : undefined;
  
  const summaryLoading = isLoading;

  const { data: salesReps, isLoading: salesRepsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users?role=sales"],
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

  const bulkActionMutation = useMutation({
    mutationFn: async (data: { commissionIds: string[]; action: string; notes?: string }) => {
      return apiRequest(`/api/crm/commissions/bulk-actions`, "POST", data);
    },
    onSuccess: (response) => {
      const data = response as unknown as { success: string[]; failed: { id: string; error: string }[] };
      const { success, failed } = data;
      if (success.length > 0) {
        toast({
          title: "Success",
          description: `${success.length} commission(s) updated successfully`,
        });
      }
      if (failed.length > 0) {
        toast({
          title: "Partial Success",
          description: `${failed.length} commission(s) failed to update`,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      setSelectedCommissions(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (params: { format?: string; salesRepId?: string; status?: string; startDate?: string; endDate?: string }) => {
      const queryParams = new URLSearchParams();
      if (params.salesRepId && params.salesRepId !== 'all') queryParams.append('salesRepId', params.salesRepId);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.format) queryParams.append('format', params.format);
      
      const response = await fetch(`/api/crm/commissions/export?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commissions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission report exported successfully",
      });
      setIsExporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export commissions",
        variant: "destructive",
      });
      setIsExporting(false);
    },
  });

  const filteredCommissions = commissions?.filter(commission => {
    const matchesSearch = 
      commission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commission.invoice?.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${commission.salesRep?.firstName || ''} ${commission.salesRep?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  // Helper functions for bulk actions and selection
  const handleSelectCommission = (commissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedCommissions);
    if (checked) {
      newSelected.add(commissionId);
    } else {
      newSelected.delete(commissionId);
    }
    setSelectedCommissions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredCommissions.map(c => c.id);
      setSelectedCommissions(new Set(allIds));
    } else {
      setSelectedCommissions(new Set());
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedCommissions.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select commissions to perform bulk actions",
        variant: "destructive",
      });
      return;
    }
    
    bulkActionMutation.mutate({
      commissionIds: Array.from(selectedCommissions),
      action,
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    exportMutation.mutate({
      salesRepId: salesRepFilter,
      status: statusFilter,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      format: 'csv'
    });
  };

  // Date range preset functions
  const setDateRangePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'last7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(startOfMonth);
        setEndDate(today);
        break;
      case 'clear':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };

  const handleCommissionClick = (commissionId: string) => {
    setSelectedCommissionId(commissionId);
    setIsDetailDrawerOpen(true);
  };

  const areAllSelected = filteredCommissions.length > 0 && selectedCommissions.size === filteredCommissions.length;
  const areSomeSelected = selectedCommissions.size > 0;

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
          {/* Sales Rep Analytics Panel */}
          {salesRepFilter !== "all" && (
            <div className="mb-6">
              <SalesRepAnalytics
                salesRepId={salesRepFilter}
                salesRep={salesReps?.find(rep => rep.id === salesRepFilter)}
                startDate={startDate}
                endDate={endDate}
                onCommissionClick={handleCommissionClick}
              />
            </div>
          )}
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
                    <SelectItem key={rep.id} value={rep.id} data-testid={`option-salesrep-${rep.id}`}>
                      {rep.firstName} {rep.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-56 justify-start text-left font-normal",
                        (!startDate && !endDate) && "text-muted-foreground"
                      )}
                      data-testid="button-date-range-filter"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate ? (
                        `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`
                      ) : startDate ? (
                        `${format(startDate, "MMM dd, yyyy")} - No end date`
                      ) : endDate ? (
                        `No start date - ${format(endDate, "MMM dd, yyyy")}`
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date Range Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('today')}
                            data-testid="preset-today"
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('yesterday')}
                            data-testid="preset-yesterday"
                          >
                            Yesterday
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('last7days')}
                            data-testid="preset-last7days"
                          >
                            Last 7 days
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('last30days')}
                            data-testid="preset-last30days"
                          >
                            Last 30 days
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('thisMonth')}
                            data-testid="preset-thismonth"
                          >
                            This month
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangePreset('clear')}
                            data-testid="preset-clear"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground"
                                )}
                                data-testid="button-start-date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : "Pick start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                disabled={(date) => endDate ? date > endDate : false}
                                initialFocus
                                data-testid="calendar-start-date"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                                data-testid="button-end-date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : "Pick end date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                disabled={(date) => startDate ? date < startDate : false}
                                initialFocus
                                data-testid="calendar-end-date"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {(startDate || endDate) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRangePreset('clear')}
                    data-testid="button-clear-date-filter"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || exportMutation.isPending}
                data-testid="button-export-commissions"
              >
                <Download className="w-4 h-4 mr-1" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {areSomeSelected && (
            <div className="bg-muted/50 border rounded-lg p-4 mb-6" data-testid="bulk-actions-bar">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">
                    {selectedCommissions.size} commission{selectedCommissions.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCommissions(new Set())}
                    data-testid="button-clear-selection"
                  >
                    Clear Selection
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {canApproveCommission({ status: 'accrued' } as any) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          disabled={bulkActionMutation.isPending}
                          data-testid="button-bulk-approve"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bulk Approve Commissions</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to approve {selectedCommissions.size} commission entries?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBulkAction('approve')}
                            className="bg-primary text-primary-foreground"
                          >
                            Yes, Approve All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {canApproveCommission({ status: 'approved' } as any) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={bulkActionMutation.isPending}
                          data-testid="button-bulk-mark-paid"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Mark as Paid
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bulk Mark as Paid</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to mark {selectedCommissions.size} commission entries as paid?
                            This will update their status and record the payment date.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleBulkAction('mark-paid')}
                            className="bg-green-600 text-white"
                          >
                            Yes, Mark as Paid
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          )}

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
                      {summary?.isMultiCurrency 
                        ? `All commissions (${summary.currencies?.length} currencies)` 
                        : 'All commission entries'}
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
                      {summary?.isMultiCurrency && <span className="text-xs ml-1">*</span>}
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
                      {summary?.isMultiCurrency && <span className="text-xs ml-1">*</span>}
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
                      {summary?.isMultiCurrency && <span className="text-xs ml-1">*</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary?.isMultiCurrency 
                        ? 'Completed payments (* mixed currencies)' 
                        : 'Completed payments'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Commission Entries Table */}
          <Card data-testid="card-commissions-table">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Commission Entries</CardTitle>
                {filteredCommissions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={areAllSelected}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <label className="text-sm text-muted-foreground">
                      Select All ({filteredCommissions.length})
                    </label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-5 w-5" />
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
                        className={`bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                          selectedCommissions.has(commission.id) ? 'ring-2 ring-primary ring-opacity-50 bg-accent/30' : ''
                        }`}
                        data-testid={`commission-entry-${commission.id}`}
                        onClick={() => handleCommissionClick(commission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              checked={selectedCommissions.has(commission.id)}
                              onCheckedChange={(checked) => handleSelectCommission(commission.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`checkbox-commission-${commission.id}`}
                            />
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
                                    onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommissionClick(commission.id);
                              }}
                              data-testid={`button-details-${commission.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
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
      
      <CommissionDetailDrawer
        commissionId={selectedCommissionId}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedCommissionId(null);
        }}
      />
    </div>
  );
}