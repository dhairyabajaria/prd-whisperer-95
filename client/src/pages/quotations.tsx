import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import QuotationForm from "@/components/quotation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, Plus, DollarSign, Calendar, User, Eye, Edit, ArrowRight, Package } from "lucide-react";
import { format } from "date-fns";
import { type Quotation, type Customer, type User as UserType, type Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuotationWithRelations extends Quotation {
  customer: Customer;
  salesRep?: UserType;
}

interface QuotationItemWithProduct {
  id: string;
  quotationId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  discount: string;
  tax: string;
  product: Product;
}

export default function Quotations() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showQuotationDetail, setShowQuotationDetail] = useState(false);
  const { toast } = useToast();

  const { data: quotations, isLoading, error } = useQuery<QuotationWithRelations[]>({
    queryKey: ["/api/crm/quotations"],
  });

  // Fetch quotation items when viewing quotation details
  const { data: quotationItems, isLoading: isLoadingItems, error: itemsError } = useQuery<QuotationItemWithProduct[]>({
    queryKey: [`/api/crm/quotations/${selectedQuotation?.id}/items`],
    enabled: !!selectedQuotation?.id && showQuotationDetail,
  });

  const convertToOrderMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      return apiRequest(`/api/crm/quotations/${quotationId}/convert`, "POST");
    },
    onSuccess: (data, quotationId) => {
      toast({
        title: "Success",
        description: "Quotation converted to sales order successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation to sales order",
        variant: "destructive",
      });
    },
  });

  const filteredQuotations = quotations?.filter(quotation => {
    const matchesSearch = 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    
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
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleConvertToOrder = (quotationId: string) => {
    convertToOrderMutation.mutate(quotationId);
  };

  const handleCreateQuotation = () => {
    setSelectedQuotation(null);
    setShowQuotationForm(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowQuotationForm(true);
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowQuotationDetail(true);
  };

  const handleCloseForm = () => {
    setShowQuotationForm(false);
    setSelectedQuotation(null);
  };

  const handleCloseDetail = () => {
    setShowQuotationDetail(false);
    setSelectedQuotation(null);
  };

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            title="Quotations"
            subtitle="Manage quotations and convert them to sales orders"
            onOpenAIChat={() => setIsChatOpen(true)}
          />
          <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load quotations</h3>
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
          title="Quotations"
          subtitle="Manage quotations and convert them to sales orders"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-quotations">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search quotations or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-quotations"
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
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="bg-primary text-primary-foreground" 
              onClick={handleCreateQuotation}
              data-testid="button-create-quotation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quotation
            </Button>
          </div>

          {/* Quotation Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Quotations</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-quotations">
                      {filteredQuotations.length}
                    </h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
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
                        filteredQuotations.reduce((sum, q) => sum + parseFloat(q.totalAmount || '0'), 0)
                      )}
                    </h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Pending</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-pending-quotations">
                      {filteredQuotations.filter(q => q.status && ['draft', 'sent'].includes(q.status)).length}
                    </h3>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Accepted</p>
                    <h3 className="text-2xl font-bold text-foreground" data-testid="text-accepted-quotations">
                      {filteredQuotations.filter(q => q.status === 'accepted').length}
                    </h3>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quotations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredQuotations.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No quotations found</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first quotation to get started"
                    }
                  </p>
                  <Button 
                    onClick={handleCreateQuotation}
                    data-testid="button-create-first-quotation"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quotation
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Quotation #</th>
                        <th className="text-left py-3 px-4 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Valid Until</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Sales Rep</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotations.map((quotation) => (
                        <tr key={quotation.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <span className="font-medium" data-testid={`text-quotation-number-${quotation.id}`}>
                              {quotation.quotationNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span data-testid={`text-customer-name-${quotation.id}`}>
                              {quotation.customer?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground" data-testid={`text-quotation-date-${quotation.id}`}>
                              {quotation.quotationDate ? format(new Date(quotation.quotationDate), 'MMM dd, yyyy') : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground" data-testid={`text-validity-date-${quotation.id}`}>
                              {quotation.validityDate ? format(new Date(quotation.validityDate), 'MMM dd, yyyy') : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium" data-testid={`text-total-amount-${quotation.id}`}>
                              {formatCurrency(quotation.totalAmount || 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              className={getStatusColor(quotation.status || 'draft')}
                              data-testid={`badge-status-${quotation.id}`}
                            >
                              {getStatusText(quotation.status || 'draft')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground" data-testid={`text-sales-rep-${quotation.id}`}>
                              {quotation.salesRep?.firstName && quotation.salesRep?.lastName
                                ? `${quotation.salesRep.firstName} ${quotation.salesRep.lastName}`
                                : quotation.salesRep?.email?.split('@')[0] || 'Unassigned'
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewQuotation(quotation)}
                                data-testid={`button-view-${quotation.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditQuotation(quotation)}
                                data-testid={`button-edit-${quotation.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {quotation.status === 'accepted' && !quotation.convertedToOrderId && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleConvertToOrder(quotation.id)}
                                  disabled={convertToOrderMutation.isPending}
                                  data-testid={`button-convert-${quotation.id}`}
                                >
                                  <ArrowRight className="w-4 h-4 mr-1" />
                                  Convert
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <AIChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
      />

      <QuotationForm
        quotation={selectedQuotation || undefined}
        isOpen={showQuotationForm}
        onClose={handleCloseForm}
        onSuccess={() => {
          // Refresh the quotations list
          queryClient.invalidateQueries({ queryKey: ["/api/crm/quotations"] });
        }}
      />

      {/* Quotation Detail Modal - to be implemented */}
      <Dialog open={showQuotationDetail} onOpenChange={setShowQuotationDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Quotation Details - {selectedQuotation?.quotationNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Customer Information</h4>
                  <p className="text-sm text-muted-foreground">
                    {(selectedQuotation as QuotationWithRelations)?.customer?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge className={getStatusColor(selectedQuotation.status || 'draft')}>
                    {getStatusText(selectedQuotation.status || 'draft')}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Quotation Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuotation.quotationDate ? format(new Date(selectedQuotation.quotationDate), 'PPP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Valid Until</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuotation.validityDate ? format(new Date(selectedQuotation.validityDate), 'PPP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Total Amount</h4>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedQuotation.totalAmount || 0)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Currency</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuotation.currency || 'USD'} (Rate: {selectedQuotation.fxRate || '1'})
                  </p>
                </div>
              </div>
              
              {selectedQuotation.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedQuotation.notes}
                  </p>
                </div>
              )}

              {/* Quotation Line Items */}
              <div>
                <h4 className="font-medium mb-4 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Line Items
                </h4>
                
                {isLoadingItems ? (
                  <div className="space-y-2" data-testid="loading-quotation-items">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 py-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : itemsError ? (
                  <div className="text-center py-6 text-muted-foreground" data-testid="error-quotation-items">
                    <p>Failed to load quotation items</p>
                  </div>
                ) : !quotationItems || quotationItems.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground" data-testid="empty-quotation-items">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items found in this quotation</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden" data-testid="table-quotation-items">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">Product</th>
                            <th className="text-right py-3 px-4 font-medium">Quantity</th>
                            <th className="text-right py-3 px-4 font-medium">Unit Price</th>
                            <th className="text-right py-3 px-4 font-medium">Discount</th>
                            <th className="text-right py-3 px-4 font-medium">Tax</th>
                            <th className="text-right py-3 px-4 font-medium">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotationItems.map((item, index) => (
                            <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/25">
                              <td className="py-3 px-4">
                                <div data-testid={`item-product-${index}`}>
                                  <p className="font-medium">{item.product.name}</p>
                                  <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`item-quantity-${index}`}>
                                {item.quantity.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`item-unit-price-${index}`}>
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`item-discount-${index}`}>
                                {parseFloat(item.discount || '0') > 0 ? `${item.discount}%` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right" data-testid={`item-tax-${index}`}>
                                {parseFloat(item.tax || '0') > 0 ? `${item.tax}%` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right font-medium" data-testid={`item-line-total-${index}`}>
                                {formatCurrency(item.lineTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/25">
                          <tr>
                            <td colSpan={4} className="py-3 px-4 font-medium">Subtotal</td>
                            <td className="py-3 px-4 text-right font-medium" data-testid="subtotal-amount">
                              {formatCurrency(selectedQuotation.subtotal || 0)}
                            </td>
                            <td className="py-3 px-4"></td>
                          </tr>
                          {parseFloat(selectedQuotation.discountAmount || '0') > 0 && (
                            <tr>
                              <td colSpan={4} className="py-2 px-4 text-muted-foreground">Discount</td>
                              <td className="py-2 px-4 text-right text-muted-foreground" data-testid="discount-amount">
                                -{formatCurrency(selectedQuotation.discountAmount || 0)}
                              </td>
                              <td className="py-2 px-4"></td>
                            </tr>
                          )}
                          {parseFloat(selectedQuotation.taxAmount || '0') > 0 && (
                            <tr>
                              <td colSpan={4} className="py-2 px-4 text-muted-foreground">Tax</td>
                              <td className="py-2 px-4 text-right text-muted-foreground" data-testid="tax-amount">
                                {formatCurrency(selectedQuotation.taxAmount || 0)}
                              </td>
                              <td className="py-2 px-4"></td>
                            </tr>
                          )}
                          <tr className="border-t">
                            <td colSpan={4} className="py-3 px-4 font-bold">Total Amount</td>
                            <td className="py-3 px-4 text-right font-bold text-lg" data-testid="total-amount">
                              {formatCurrency(selectedQuotation.totalAmount || 0)}
                            </td>
                            <td className="py-3 px-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowQuotationDetail(false);
                    handleEditQuotation(selectedQuotation);
                  }}
                  data-testid="button-edit-from-detail"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {selectedQuotation.status === 'accepted' && !selectedQuotation.convertedToOrderId && (
                  <Button 
                    onClick={() => {
                      handleConvertToOrder(selectedQuotation.id);
                      setShowQuotationDetail(false);
                    }}
                    disabled={convertToOrderMutation.isPending}
                    data-testid="button-convert-from-detail"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Convert to Sales Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}