import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  DollarSign, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit3,
  Download,
  Building2,
  Receipt,
  Percent,
  CreditCard,
  Eye
} from "lucide-react";
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
  approver?: UserType;
}

interface CommissionDetailDrawerProps {
  commissionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommissionDetailDrawer({ commissionId, isOpen, onClose }: CommissionDetailDrawerProps) {
  const { user } = useAuth() as { user: UserType | null };
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const { toast } = useToast();

  const { data: commission, isLoading, error } = useQuery<CommissionWithRelations>({
    queryKey: ["/api/crm/commissions", commissionId],
    enabled: !!commissionId && isOpen,
  });

  // Initialize notes when commission data loads
  React.useEffect(() => {
    if (commission?.notes) {
      setNotesValue(commission.notes);
    }
  }, [commission?.notes]);

  const approveMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      return apiRequest(`/api/crm/commissions/${commissionId}/approve`, "PATCH");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions", commissionId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve commission",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      return apiRequest(`/api/crm/commissions/${commissionId}/mark-paid`, "PATCH");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission marked as paid successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions", commissionId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark commission as paid",
        variant: "destructive",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ commissionId, notes }: { commissionId: string; notes: string }) => {
      return apiRequest(`/api/crm/commissions/${commissionId}/notes`, "PATCH", { notes });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/commissions", commissionId] });
      setIsEditingNotes(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive",
      });
    },
  });

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

  const canApproveCommission = (commission?: CommissionWithRelations) => {
    return (user?.role === 'finance' || user?.role === 'admin') && commission?.status === 'accrued';
  };

  const canMarkAsPaid = (commission?: CommissionWithRelations) => {
    return (user?.role === 'finance' || user?.role === 'admin') && commission?.status === 'approved';
  };

  const canEditNotes = () => {
    return user?.role === 'finance' || user?.role === 'admin';
  };

  const handleSaveNotes = () => {
    if (commissionId) {
      updateNotesMutation.mutate({ commissionId, notes: notesValue });
    }
  };

  const handleCancelNotes = () => {
    setNotesValue(commission?.notes || "");
    setIsEditingNotes(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[600px] overflow-y-auto" data-testid="commission-detail-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Commission Details</span>
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-6 mt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load commission</h3>
              <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
            </div>
          </div>
        ) : !commission ? (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Commission not found</h3>
              <p className="text-muted-foreground text-sm">This commission entry may have been deleted</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Commission Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" data-testid="commission-id">
                    {commission.id.slice(0, 8)}
                  </h2>
                  <p className="text-muted-foreground">Commission Entry</p>
                </div>
                <Badge className={getStatusColor(commission.status || 'draft')} data-testid="commission-status">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(commission.status || 'draft')}
                    <span>{commission.status?.charAt(0).toUpperCase() + commission.status?.slice(1) || 'Draft'}</span>
                  </div>
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Commission Rate</span>
                  </div>
                  <p className="text-lg font-semibold" data-testid="commission-rate">
                    {formatPercentage(commission.commissionPercent)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Commission Amount</span>
                  </div>
                  <p className="text-lg font-semibold text-primary" data-testid="commission-amount">
                    {formatCurrency(commission.commissionAmount, commission.currency || 'USD')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sales Representative */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Sales Representative</span>
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="font-medium" data-testid="salesrep-name">
                  {commission.salesRep?.firstName || ''} {commission.salesRep?.lastName || ''}
                </p>
                {commission.salesRep?.email && (
                  <p className="text-sm text-muted-foreground" data-testid="salesrep-email">
                    {commission.salesRep.email}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Invoice Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>Related Invoice</span>
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                    <p className="font-medium" data-testid="invoice-number">
                      {commission.invoice?.invoiceNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <p className="font-medium" data-testid="customer-name">
                      {commission.invoice?.customer?.name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Basis Amount</Label>
                    <p className="font-medium" data-testid="basis-amount">
                      {formatCurrency(commission.basisAmount, commission.currency || 'USD')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Currency</Label>
                    <p className="font-medium" data-testid="commission-currency">
                      {commission.currency || 'USD'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  data-testid="view-invoice-button"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Invoice Details
                </Button>
              </div>
            </div>

            <Separator />

            {/* Commission Calculation */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Calculation Breakdown</span>
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Basis Amount:</span>
                  <span className="font-medium" data-testid="calc-basis">
                    {formatCurrency(commission.basisAmount, commission.currency || 'USD')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Commission Rate:</span>
                  <span className="font-medium" data-testid="calc-rate">
                    {formatPercentage(commission.commissionPercent)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Commission Amount:</span>
                  <span className="font-bold text-primary" data-testid="calc-total">
                    {formatCurrency(commission.commissionAmount, commission.currency || 'USD')}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline & Approvals */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Timeline</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Commission Created</p>
                    <p className="text-xs text-muted-foreground" data-testid="created-date">
                      {commission.createdAt ? format(new Date(commission.createdAt), 'PPp') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {commission.approvedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground" data-testid="approved-date">
                        {format(new Date(commission.approvedAt), 'PPp')}
                        {commission.approver && (
                          <span className="ml-2">
                            by {commission.approver.firstName} {commission.approver.lastName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {commission.paidAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Paid</p>
                      <p className="text-xs text-muted-foreground" data-testid="paid-date">
                        {format(new Date(commission.paidAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Notes</span>
                </h3>
                {canEditNotes() && !isEditingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                    data-testid="edit-notes-button"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this commission..."
                    className="min-h-[100px]"
                    data-testid="notes-textarea"
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending}
                      data-testid="save-notes-button"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelNotes}
                      disabled={updateNotesMutation.isPending}
                      data-testid="cancel-notes-button"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 min-h-[60px]">
                  {commission.notes ? (
                    <p className="text-sm whitespace-pre-wrap" data-testid="commission-notes">
                      {commission.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="flex flex-col space-y-2">
                {commission && canApproveCommission(commission) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={approveMutation.isPending}
                        data-testid="approve-commission-button"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Commission
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
                          onClick={() => approveMutation.mutate(commission.id)}
                          className="bg-primary text-primary-foreground"
                        >
                          Yes, Approve
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {commission && canMarkAsPaid(commission) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={markPaidMutation.isPending}
                        data-testid="mark-paid-button"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark Commission as Paid</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to mark this commission of {formatCurrency(commission.commissionAmount, commission.currency || 'USD')} as paid?
                          This will update the status and record the payment date.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => markPaidMutation.mutate(commission.id)}
                          className="bg-green-600 text-white"
                        >
                          Yes, Mark as Paid
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="export-single-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Commission Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}