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
import { TableSkeleton } from "@/components/ui/table";
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
  Settings,
  Clock,
  Users,
  Send,
  ArrowRight,
  Bell,
  Trash2,
  Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertPurchaseRequestSchema, 
  insertPurchaseRequestItemSchema,
  insertPurchaseOrderSchema,
  insertGoodsReceiptSchema,
  insertVendorBillSchema,
  insertCompetitorPriceSchema,
  type PurchaseRequest,
  type PurchaseRequestItem,
  type PurchaseRequestApproval,
  type ApprovalRule,
  type Notification,
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
  type InsertPurchaseRequestItem,
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

interface PendingApprovalWithDetails extends PurchaseRequestApproval {
  purchaseRequest: PurchaseRequest & {
    requester: User;
    items: Array<PurchaseRequestItem & { product: Product }>;
  };
  rule: ApprovalRule;
}

interface PRLineItem {
  productId: string;
  quantity: number;
  unitPrice?: string;
  notes?: string;
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
  const [isConvertToPOModalOpen, setIsConvertToPOModalOpen] = useState(false);
  const [selectedPRForConversion, setSelectedPRForConversion] = useState<string | null>(null);
  const [prLineItems, setPrLineItems] = useState<PRLineItem[]>([]);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedPRForApproval, setSelectedPRForApproval] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [isViewMatchModalOpen, setIsViewMatchModalOpen] = useState(false);
  const [isResolveMatchModalOpen, setIsResolveMatchModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [exceptionComment, setExceptionComment] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<any | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  // Enhanced workflow queries
  const { data: pendingApprovals, isLoading: isPendingApprovalsLoading } = useQuery<PendingApprovalWithDetails[]>({
    queryKey: ["/api/approvals/pending"],
  });

  const { data: notifications, isLoading: isNotificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadNotificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
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
  const createPRMutation = useMutation<any, Error, InsertPurchaseRequest>({
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

  const createPOMutation = useMutation<any, Error, InsertPurchaseOrder>({
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

  // Enhanced PR workflow mutations
  const submitPRMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${id}/submit`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({ title: "Success", description: "Purchase request submitted for approval" });
    },
    onError: handleMutationError,
  });

  const approvePRMutation = useMutation<any, Error, { id: string; level: number; comment?: string }>({
    mutationFn: async ({ id, level, comment }: { id: string; level: number; comment?: string }) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${id}/approve`, { level, comment });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setIsApprovalModalOpen(false);
      setApprovalComment("");
      toast({ title: "Success", description: "Purchase request approved successfully" });
    },
    onError: handleMutationError,
  });

  const rejectPRMutation = useMutation<any, Error, { id: string; level: number; comment: string }>({
    mutationFn: async ({ id, level, comment }: { id: string; level: number; comment: string }) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${id}/reject`, { level, comment });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setIsApprovalModalOpen(false);
      setApprovalComment("");
      toast({ title: "Success", description: "Purchase request rejected" });
    },
    onError: handleMutationError,
  });

  const convertPRToPOMutation = useMutation<any, Error, { prId: string; poData: any }>({
    mutationFn: async ({ prId, poData }: { prId: string; poData: any }) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${prId}/convert-to-po`, poData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setIsConvertToPOModalOpen(false);
      setSelectedPRForConversion(null);
      toast({ title: "Success", description: "Purchase request converted to purchase order successfully" });
    },
    onError: handleMutationError,
  });

  const addPRLineItemMutation = useMutation<any, Error, { prId: string; item: InsertPurchaseRequestItem }>({
    mutationFn: async ({ prId, item }: { prId: string; item: InsertPurchaseRequestItem }) => {
      const response = await apiRequest("POST", `/api/purchases/requests/${prId}/items`, item);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/requests"] });
      toast({ title: "Success", description: "Line item added successfully" });
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

  const resolveMatchExceptionMutation = useMutation<any, Error, { matchId: string; notes: string }>({
    mutationFn: async ({ matchId, notes }: { matchId: string; notes: string }) => {
      const response = await apiRequest("POST", `/api/purchases/match/${matchId}/resolve`, { notes });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      setIsResolveMatchModalOpen(false);
      setSelectedMatch(null);
      setExceptionComment("");
      toast({ title: "Success", description: "Match exception resolved successfully" });
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

  // Goods Receipt mutations
  const createGRMutation = useMutation<any, Error, InsertGoodsReceipt>({
    mutationFn: async (data: InsertGoodsReceipt) => {
      const response = await apiRequest("POST", "/api/purchases/receipts", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      setIsCreateGRModalOpen(false);
      grForm.reset();
      toast({ title: "Success", description: "Goods receipt created successfully" });
    },
    onError: handleMutationError,
  });

  const postGRMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/purchases/receipts/${id}/post`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Success", description: "Goods receipt posted to inventory" });
    },
    onError: handleMutationError,
  });

  // Vendor Bills mutations
  const createBillMutation = useMutation<any, Error, InsertVendorBill>({
    mutationFn: async (data: InsertVendorBill) => {
      const response = await apiRequest("POST", "/api/purchases/bills", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      setIsCreateBillModalOpen(false);
      billForm.reset();
      toast({ title: "Success", description: "Vendor bill created successfully" });
    },
    onError: handleMutationError,
  });

  const postBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/purchases/bills/${id}/post`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/dashboard"] });
      toast({ title: "Success", description: "Vendor bill posted to accounting" });
    },
    onError: handleMutationError,
  });

  const ocrBillMutation = useMutation({
    mutationFn: async ({ ocrRaw, billImageBase64 }: { ocrRaw?: string; billImageBase64?: string }) => {
      const response = await apiRequest("POST", `/api/purchases/bills/ocr-extract`, {
        ocrRaw,
        billImageBase64
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setOcrResults(data.extractedData);
      setOcrConfidence(data.confidence || 0);
      setShowOcrReview(true);
      setIsOcrProcessing(false);
      toast({ 
        title: "OCR Processing Complete", 
        description: `Data extracted with ${data.confidence || 0}% confidence. Please review the results.` 
      });
    },
    onError: (error) => {
      setIsOcrProcessing(false);
      handleMutationError(error);
    },
  });

  // Competitor Prices mutations
  const createCompPriceMutation = useMutation<any, Error, InsertCompetitorPrice>({
    mutationFn: async (data: InsertCompetitorPrice) => {
      const response = await apiRequest("POST", "/api/purchases/competitor-prices", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/competitor-prices"] });
      setIsCreateCompPriceModalOpen(false);
      compPriceForm.reset();
      toast({ title: "Success", description: "Competitor price added successfully" });
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
    
    console.error('Purchase operation error:', error);
    let errorMessage = "Operation failed. Please try again.";
    let errorTitle = "Operation Failed";
    
    if (error.message) {
      // Purchase Request specific errors
      if (error.message.includes('purchase_request') || error.message.includes('PR')) {
        errorTitle = "Purchase Request Failed";
        if (error.message.includes('pr_number') && error.message.includes('unique')) {
          errorMessage = "This PR number already exists. Please use a different PR number.";
        } else if (error.message.includes('supplier')) {
          errorMessage = "Selected supplier is invalid or inactive. Please choose a different supplier.";
        } else if (error.message.includes('requester')) {
          errorMessage = "Invalid requester. Please verify the requesting user.";
        } else if (error.message.includes('approval') && error.message.includes('rule')) {
          errorMessage = "No approval rules configured for this request amount. Please contact admin.";
        } else if (error.message.includes('product')) {
          errorMessage = "One or more selected products are invalid or inactive. Please review your product selection.";
        } else {
          errorMessage = `Error processing purchase request: ${error.message}`;
        }
      }
      // Purchase Order specific errors
      else if (error.message.includes('purchase_order') || error.message.includes('PO')) {
        errorTitle = "Purchase Order Failed";
        if (error.message.includes('order_number') && error.message.includes('unique')) {
          errorMessage = "This PO number already exists. Please use a different PO number.";
        } else if (error.message.includes('purchase_request')) {
          errorMessage = "Referenced purchase request is invalid or not approved. Please verify the PR status.";
        } else if (error.message.includes('supplier')) {
          errorMessage = "Selected supplier is invalid or inactive. Please choose a different supplier.";
        } else if (error.message.includes('currency')) {
          errorMessage = "Invalid currency or exchange rate. Please verify currency settings.";
        } else {
          errorMessage = `Error creating purchase order: ${error.message}`;
        }
      }
      // Goods Receipt specific errors
      else if (error.message.includes('goods_receipt') || error.message.includes('GR')) {
        errorTitle = "Goods Receipt Failed";
        if (error.message.includes('purchase_order')) {
          errorMessage = "Referenced purchase order is invalid or not found. Please verify the PO.";
        } else if (error.message.includes('warehouse')) {
          errorMessage = "Selected warehouse is invalid. Please choose a valid warehouse location.";
        } else if (error.message.includes('quantity')) {
          errorMessage = "Received quantity exceeds ordered quantity. Please verify the amounts.";
        } else if (error.message.includes('batch')) {
          errorMessage = "Invalid batch number format. Please enter a valid batch number.";
        } else {
          errorMessage = `Error processing goods receipt: ${error.message}`;
        }
      }
      // Vendor Bill specific errors
      else if (error.message.includes('vendor_bill') || error.message.includes('bill')) {
        errorTitle = "Vendor Bill Failed";
        if (error.message.includes('bill_number') && error.message.includes('unique')) {
          errorMessage = "This bill number already exists. Please use a different bill number.";
        } else if (error.message.includes('supplier')) {
          errorMessage = "Selected supplier is invalid. Please choose a valid supplier.";
        } else if (error.message.includes('purchase_order')) {
          errorMessage = "Referenced purchase order is invalid. Please verify the PO number.";
        } else if (error.message.includes('amount')) {
          errorMessage = "Bill amount validation failed. Please verify all amounts and totals.";
        } else {
          errorMessage = `Error processing vendor bill: ${error.message}`;
        }
      }
      // Generic operation-specific errors
      else if (error.message.includes('validation')) {
        errorMessage = "Please check all required fields and ensure data is in the correct format.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "Network error - please check your connection and try again.";
      } else if (error.message.includes('unauthorized')) {
        errorMessage = "You don't have permission for this operation. Please contact your administrator.";
      } else {
        errorMessage = `Operation error: ${error.message}`;
      }
    }
    
    toast({
      title: errorTitle,
      description: errorMessage,
      variant: "destructive",
    });
  }

  // OCR Processing Functions
  const processFileOCR = async (file: File) => {
    setIsOcrProcessing(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1]; // Remove data:image/...;base64, prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Process with OCR
      await ocrBillMutation.mutateAsync({ billImageBase64: base64 });
    } catch (error) {
      setIsOcrProcessing(false);
      console.error('OCR processing failed:', error);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file for bill processing. Supported formats: .jpg, .jpeg, .png, .pdf",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    processFileOCR(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const applyOcrResults = () => {
    if (!ocrResults) return;
    
    // Map OCR results to form fields
    if (ocrResults.billNumber) {
      billForm.setValue('billNumber', ocrResults.billNumber);
    }
    if (ocrResults.billDate) {
      billForm.setValue('billDate', ocrResults.billDate);
    }
    if (ocrResults.dueDate) {
      billForm.setValue('dueDate', ocrResults.dueDate);
    }
    if (ocrResults.totalAmount) {
      billForm.setValue('totalAmount', ocrResults.totalAmount.toString());
    }
    if (ocrResults.currency) {
      billForm.setValue('currency', ocrResults.currency);
    }
    if (ocrResults.paymentTerms) {
      // Store payment terms in ocrRaw field since there's no notes field in vendor bills
      const currentOcrRaw = billForm.getValues('ocrRaw') || '';
      const newOcrRaw = currentOcrRaw ? `${currentOcrRaw}\nPayment Terms: ${ocrResults.paymentTerms}` : `Payment Terms: ${ocrResults.paymentTerms}`;
      billForm.setValue('ocrRaw', newOcrRaw);
    }
    
    // Try to match supplier by name
    if (ocrResults.supplierName && suppliers) {
      const matchedSupplier = suppliers.find(s => 
        s.name.toLowerCase().includes(ocrResults.supplierName.toLowerCase()) ||
        ocrResults.supplierName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSupplier) {
        billForm.setValue('supplierId', matchedSupplier.id);
      }
    }

    setShowOcrReview(false);
    setOcrResults(null);
    toast({ 
      title: "OCR Data Applied", 
      description: "Please review and adjust the extracted data as needed." 
    });
  };

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
      case 'draft': return 'badge-order-light';
      case 'submitted': 
      case 'sent': return 'badge-info-light';
      case 'approved':
      case 'confirmed':
      case 'matched': return 'badge-success-light';
      case 'received':
      case 'posted': return 'badge-processing-light';
      case 'rejected':
      case 'cancelled': return 'badge-error-light';
      case 'quantity_mismatch':
      case 'price_mismatch': return 'badge-warning-light';
      case 'missing_receipt':
      case 'missing_bill': return 'badge-warning-light';
      default: return 'badge-order-light';
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
                <p className="text-body-small text-muted-foreground">Total Purchase Orders</p>
                <h3 className="text-metric-value" data-testid="text-total-purchase-orders">
                  {dashboardMetrics?.totalPurchaseOrders || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--order-bg-light)'}}>
                <ShoppingCart className="w-6 h-6" style={{color: 'var(--order-fg)'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-small text-muted-foreground">Pending Approvals</p>
                <h3 className="text-metric-value" data-testid="text-pending-approvals">
                  {dashboardMetrics?.pendingApprovals || 0}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: 'var(--status-warning-bg-light)'}}>
                <AlertTriangle className="w-6 h-6" style={{color: 'var(--status-warning-fg)'}} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-small text-muted-foreground">Total Purchase Value</p>
                <h3 className="text-metric-value" data-testid="text-total-purchase-value">
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
                <p className="text-body-small text-muted-foreground">Matching Exceptions</p>
                <h3 className="text-metric-value" data-testid="text-matching-exceptions">
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
                      <div className="text-body-small text-muted-foreground">{supplier.orderCount} orders</div>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                  <Button type="button" variant="outline" onClick={() => setIsCreatePRModalOpen(false)} data-testid="button-cancel-pr">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPRMutation.isPending} data-testid="button-submit-pr" className="flex items-center space-x-2">
                    {createPRMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Purchase Request"
                    )}
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
                        ((pr.requester.firstName && pr.requester.lastName ? `${pr.requester.firstName} ${pr.requester.lastName}` : pr.requester.email) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                                  onClick={() => approvePRMutation.mutate({ id: pr.id, level: 1 })}
                                  disabled={approvePRMutation.isPending}
                                  data-testid={`button-approve-pr-${pr.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => rejectPRMutation.mutate({ id: pr.id, level: 1, comment: "Rejected from list" })}
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
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
                  <Button type="button" variant="outline" onClick={() => setIsCreatePOModalOpen(false)} data-testid="button-cancel-po">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPOMutation.isPending} data-testid="button-submit-po" className="flex items-center space-x-2">
                    {createPOMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Purchase Order"
                    )}
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

  // Goods Receipt Tab Component
  const GoodsReceiptTab = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search goods receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
              data-testid="input-search-receipts"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter-gr">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateGRModalOpen} onOpenChange={setIsCreateGRModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goods-receipt">
              <Plus className="w-4 h-4 mr-2" />
              Create Goods Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Goods Receipt</DialogTitle>
            </DialogHeader>
            <Form {...grForm}>
              <form onSubmit={grForm.handleSubmit((data) => createGRMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={grForm.control}
                    name="poId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Order *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-purchase-order-gr">
                              <SelectValue placeholder="Select purchase order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {purchaseOrders?.filter(po => po.status === 'confirmed').map((po) => (
                              <SelectItem key={po.id} value={po.id}>
                                {po.orderNumber} - {po.supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={grForm.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-warehouse-gr">
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses?.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} - {warehouse.location}
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
                    control={grForm.control}
                    name="receivedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : new Date().toISOString().split('T')[0]} data-testid="input-receipt-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={grForm.control}
                    name="receivedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received By</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Current user" data-testid="input-received-by" readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={grForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} data-testid="textarea-gr-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateGRModalOpen(false)} data-testid="button-cancel-gr">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGRMutation.isPending} data-testid="button-submit-gr" className="flex items-center space-x-2">
                    {createGRMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Goods Receipt"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goods Receipts Table */}
      <Card data-testid="card-goods-receipts">
        <CardHeader>
          <CardTitle>Goods Receipts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Receipt Date</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isGRLoading ? (
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
                ) : goodsReceipts && goodsReceipts.length > 0 ? (
                  goodsReceipts
                    .filter(gr => {
                      const matchesSearch = (gr.purchaseOrder.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        gr.purchaseOrder.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || gr.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((gr) => (
                      <tr key={gr.id} data-testid={`row-goods-receipt-${gr.id}`}>
                        <td className="px-6 py-4">
                          <div>{gr.receivedAt ? format(new Date(gr.receivedAt), 'MMM dd, yyyy') : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">{gr.purchaseOrder.orderNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{gr.purchaseOrder.supplier.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{gr.warehouse.name}</div>
                          <div className="text-sm text-muted-foreground">{gr.warehouse.location}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(gr.status || 'draft')}>
                            {getStatusText(gr.status || 'draft')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {gr.status === 'draft' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => postGRMutation.mutate(gr.id)}
                                disabled={postGRMutation.isPending}
                                data-testid={`button-post-gr-${gr.id}`}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                {postGRMutation.isPending ? "Posting..." : "Post to Inventory"}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" data-testid={`button-view-gr-${gr.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {gr.status === 'draft' && (
                              <Button size="sm" variant="outline" data-testid={`button-edit-gr-${gr.id}`}>
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
                      No goods receipts found
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

  // Vendor Bills Tab Component
  const VendorBillsTab = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search vendor bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
              data-testid="input-search-bills"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter-bills">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateBillModalOpen} onOpenChange={setIsCreateBillModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-vendor-bill">
              <Plus className="w-4 h-4 mr-2" />
              Create Vendor Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Vendor Bill</DialogTitle>
            </DialogHeader>
            
            {/* OCR Upload Section */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 mb-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Upload Bill Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload an image or PDF of your vendor bill for automatic data extraction
                </p>
                
                <div 
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="ocr-upload-zone"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isOcrProcessing}
                    data-testid="input-bill-file"
                  />
                  
                  {isOcrProcessing ? (
                    <div className="text-center">
                      <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-sm font-medium">Processing document...</p>
                      <p className="text-xs text-muted-foreground">This may take a few moments</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="text-center">
                      <FileText className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <p className="text-sm font-medium text-green-600">File uploaded: {uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">Processing complete</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Drop your bill here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports JPEG, PNG, and PDF files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                
                {ocrConfidence > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>OCR Confidence:</span>
                      <span className={`font-medium ${
                        ocrConfidence >= 90 ? 'text-green-600' :
                        ocrConfidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {ocrConfidence}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Form {...billForm}>
              <form onSubmit={billForm.handleSubmit((data) => createBillMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={billForm.control}
                    name="billNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-bill-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={billForm.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-supplier-bill">
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
                    control={billForm.control}
                    name="billDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bill Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-bill-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={billForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} data-testid="input-bill-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={billForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "USD"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency-bill">
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
                    control={billForm.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-bill-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateBillModalOpen(false);
                    setUploadedFile(null);
                    setOcrResults(null);
                    setShowOcrReview(false);
                    setOcrConfidence(0);
                    setIsOcrProcessing(false);
                    billForm.reset();
                  }} data-testid="button-cancel-bill">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBillMutation.isPending} data-testid="button-submit-bill" className="flex items-center space-x-2">
                    {createBillMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Create Vendor Bill"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* OCR Review Modal */}
        <Dialog open={showOcrReview} onOpenChange={setShowOcrReview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Extracted Data</DialogTitle>
            </DialogHeader>
            
            {ocrResults && (
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">OCR Extraction Results</h4>
                    <Badge className={`${
                      ocrConfidence >= 90 ? 'bg-green-100 text-green-800' :
                      ocrConfidence >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {ocrConfidence}% Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please review the extracted data below and make any necessary corrections before applying to the form.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Document Details</h5>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Bill Number:</span>
                        <span className="text-sm" data-testid="ocr-bill-number">{ocrResults.billNumber || 'Not detected'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Supplier:</span>
                        <span className="text-sm" data-testid="ocr-supplier-name">{ocrResults.supplierName || 'Not detected'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Bill Date:</span>
                        <span className="text-sm" data-testid="ocr-bill-date">{ocrResults.billDate || 'Not detected'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Due Date:</span>
                        <span className="text-sm" data-testid="ocr-due-date">{ocrResults.dueDate || 'Not detected'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Financial Information</h5>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Total Amount:</span>
                        <span className="text-sm font-bold" data-testid="ocr-total-amount">
                          {ocrResults.totalAmount ? formatCurrency(ocrResults.totalAmount, ocrResults.currency) : 'Not detected'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Currency:</span>
                        <span className="text-sm" data-testid="ocr-currency">{ocrResults.currency || 'Not detected'}</span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Tax Amount:</span>
                        <span className="text-sm" data-testid="ocr-tax-amount">
                          {ocrResults.taxAmount ? formatCurrency(ocrResults.taxAmount, ocrResults.currency) : 'Not detected'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b border-muted">
                        <span className="text-sm font-medium">Payment Terms:</span>
                        <span className="text-sm" data-testid="ocr-payment-terms">{ocrResults.paymentTerms || 'Not detected'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {ocrResults.items && ocrResults.items.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Line Items</h5>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">Description</th>
                            <th className="text-right px-4 py-2 font-medium">Quantity</th>
                            <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                            <th className="text-right px-4 py-2 font-medium">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                          {ocrResults.items.map((item: any, index: number) => (
                            <tr key={index} data-testid={`ocr-line-item-${index}`}>
                              <td className="px-4 py-2">{item.description || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">{item.quantity || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">
                                {item.unitPrice ? formatCurrency(item.unitPrice, ocrResults.currency) : 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                {item.lineTotal ? formatCurrency(item.lineTotal, ocrResults.currency) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {ocrConfidence < 70 && (
                      <div className="flex items-center text-amber-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Low confidence - please verify all data carefully
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOcrReview(false)}
                      data-testid="button-cancel-ocr-review"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={applyOcrResults}
                      data-testid="button-apply-ocr-results"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply to Form
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor Bills Table */}
      <Card data-testid="card-vendor-bills">
        <CardHeader>
          <CardTitle>Vendor Bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Bill Number</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Bill Date</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isBillsLoading ? (
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
                ) : vendorBills && vendorBills.length > 0 ? (
                  vendorBills
                    .filter(bill => {
                      const matchesSearch = (bill.billNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        bill.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((bill) => (
                      <tr key={bill.id} data-testid={`row-vendor-bill-${bill.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm">{bill.billNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{bill.supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{bill.supplier.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{format(new Date(bill.billDate), 'MMM dd, yyyy')}</div>
                          {bill.dueDate && (
                            <div className="text-sm text-muted-foreground">
                              Due: {format(new Date(bill.dueDate), 'MMM dd')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatCurrency(bill.totalAmount || 0, bill.currency || 'USD')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(bill.status || 'draft')}>
                            {getStatusText(bill.status || 'draft')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {bill.status === 'draft' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => postBillMutation.mutate(bill.id)}
                                  disabled={postBillMutation.isPending}
                                  data-testid={`button-post-bill-${bill.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  {postBillMutation.isPending ? "Posting..." : "Post"}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => ocrBillMutation.mutate({ ocrRaw: bill.id })}
                                  disabled={ocrBillMutation.isPending}
                                  data-testid={`button-ocr-bill-${bill.id}`}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  OCR
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" data-testid={`button-view-bill-${bill.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {bill.status === 'draft' && (
                              <Button size="sm" variant="outline" data-testid={`button-edit-bill-${bill.id}`}>
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
                      No vendor bills found
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

  // Three-way Matching Tab Component
  const ThreeWayMatchingTab = () => {
    const { data: matchResults, isLoading: isMatchLoading } = useQuery<any[]>({
      queryKey: ["/api/purchases/match"],
    });

    return (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search matching results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
                data-testid="input-search-matching"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter-matching">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="quantity_mismatch">Quantity Mismatch</SelectItem>
                <SelectItem value="price_mismatch">Price Mismatch</SelectItem>
                <SelectItem value="missing_receipt">Missing Receipt</SelectItem>
                <SelectItem value="missing_bill">Missing Bill</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => performMatchingMutation.mutate('')}
            disabled={performMatchingMutation.isPending}
            data-testid="button-run-matching"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${performMatchingMutation.isPending ? 'animate-spin' : ''}`} />
            {performMatchingMutation.isPending ? "Running..." : "Run Matching"}
          </Button>
        </div>

        {/* Matching Results Table */}
        <Card data-testid="card-matching-results">
          <CardHeader>
            <CardTitle>Three-Way Matching Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Receipt</th>
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Bill</th>
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Match Status</th>
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Variances</th>
                    <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isMatchLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : matchResults && matchResults.length > 0 ? (
                    matchResults
                      .filter(match => {
                        const matchesSearch = (match.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesStatus = statusFilter === "all" || match.status === statusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((match) => (
                        <tr key={match.id} data-testid={`row-match-result-${match.id}`}>
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm">{match.poNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            {match.hasReceipt ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Received
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                <X className="w-3 h-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {match.hasBill ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Billed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                <X className="w-3 h-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(match.status)}>
                              {getStatusText(match.status)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {match.variances && match.variances.length > 0 ? (
                              <div className="text-sm">
                                {match.variances.slice(0, 2).map((variance: any, idx: number) => (
                                  <div key={idx} className="text-yellow-600">
                                    {variance.type}: {variance.description}
                                  </div>
                                ))}
                                {match.variances.length > 2 && (
                                  <div className="text-muted-foreground">+{match.variances.length - 2} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No variances</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setIsViewMatchModalOpen(true);
                                }}
                                data-testid={`button-view-match-${match.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {match.status !== 'matched' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedMatch(match);
                                    setIsResolveMatchModalOpen(true);
                                  }}
                                  data-testid={`button-resolve-match-${match.id}`}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No matching results found
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
  };

  // Competitor Prices Tab Component
  const CompetitorPricesTab = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search competitor prices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
              data-testid="input-search-competitor-prices"
            />
          </div>
          <Button 
            onClick={() => refreshFxRatesMutation.mutate(undefined)}
            disabled={refreshFxRatesMutation.isPending}
            variant="outline"
            data-testid="button-refresh-rates"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshFxRatesMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh FX Rates
          </Button>
        </div>
        
        <Dialog open={isCreateCompPriceModalOpen} onOpenChange={setIsCreateCompPriceModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-competitor-price">
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor Price
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Competitor Price</DialogTitle>
            </DialogHeader>
            <Form {...compPriceForm}>
              <form onSubmit={compPriceForm.handleSubmit((data) => createCompPriceMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={compPriceForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-comp-price">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={compPriceForm.control}
                    name="competitor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competitor Name *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-competitor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={compPriceForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-competitor-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={compPriceForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "USD"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency-comp-price">
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
                  control={compPriceForm.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g., https://example.com/product-page" data-testid="input-price-source-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateCompPriceModalOpen(false)} data-testid="button-cancel-comp-price">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCompPriceMutation.isPending} data-testid="button-submit-comp-price">
                    {createCompPriceMutation.isPending ? "Adding..." : "Add Price"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Competitor Prices Table */}
      <Card data-testid="card-competitor-prices">
        <CardHeader>
          <CardTitle>Competitor Price Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Competitor</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Their Price</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Our Price</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Difference</th>
                  <th className="px-6 py-3 text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isCompPricesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : competitorPrices && competitorPrices.length > 0 ? (
                  competitorPrices
                    .filter(cp => {
                      const matchesSearch = cp.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (cp.competitor || '').toLowerCase().includes(searchTerm.toLowerCase());
                      return matchesSearch;
                    })
                    .map((cp) => {
                      const ourPrice = parseFloat(cp.product.unitPrice || '0');
                      const theirPrice = parseFloat(cp.price);
                      const difference = ourPrice - theirPrice;
                      const diffPercent = ourPrice > 0 ? ((difference / ourPrice) * 100) : 0;
                      
                      return (
                        <tr key={cp.id} data-testid={`row-competitor-price-${cp.id}`}>
                          <td className="px-6 py-4">
                            <div className="font-medium">{cp.product.name}</div>
                            <div className="text-sm text-muted-foreground">{cp.product.sku}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{cp.competitor}</div>
                            <div className="text-sm text-muted-foreground">
                              {cp.collectedAt ? format(new Date(cp.collectedAt), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatCurrency(theirPrice, cp.currency || 'USD')}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {formatCurrency(ourPrice, 'USD')}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-medium ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {difference > 0 ? '+' : ''}{formatCurrency(difference, 'USD')}
                              <div className="text-sm">{diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-view-comp-price-${cp.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`button-edit-comp-price-${cp.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No competitor prices found
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
              <GoodsReceiptTab />
            </TabsContent>

            <TabsContent value="bills" className="mt-6">
              <VendorBillsTab />
            </TabsContent>

            <TabsContent value="matching" className="mt-6">
              <ThreeWayMatchingTab />
            </TabsContent>

            <TabsContent value="prices" className="mt-6">
              <CompetitorPricesTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* View Match Details Modal */}
      <Dialog open={isViewMatchModalOpen} onOpenChange={setIsViewMatchModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-view-match-details">
          <DialogHeader>
            <DialogTitle>Three-Way Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              {/* Match Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PO Number</label>
                    <div className="font-mono text-sm" data-testid="text-po-number">{selectedMatch.poNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Match Status</label>
                    <div>
                      <Badge className={getStatusColor(selectedMatch.status)} data-testid="status-match">
                        {getStatusText(selectedMatch.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Matched</label>
                    <div className="text-sm" data-testid="text-match-date">
                      {selectedMatch.matchedAt ? format(new Date(selectedMatch.matchedAt), 'PP p') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Comparison */}
              <div className="grid grid-cols-3 gap-4">
                {/* Purchase Order */}
                <Card data-testid="card-po-details">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Purchase Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Amount</label>
                      <div className="font-medium" data-testid="text-po-amount">
                        ${selectedMatch.matchDetails?.po?.amount || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Items</label>
                      <div data-testid="text-po-items">{selectedMatch.matchDetails?.po?.items || 0} items</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <div>
                        <Badge variant="outline" className="text-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Goods Receipt */}
                <Card data-testid="card-gr-details">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Goods Receipt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Received</label>
                      <div>
                        {selectedMatch.hasReceipt ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <X className="w-3 h-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Receipt Date</label>
                      <div data-testid="text-gr-date">
                        {selectedMatch.matchDetails?.gr?.receivedAt ? 
                          format(new Date(selectedMatch.matchDetails.gr.receivedAt), 'PP') : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vendor Bill */}
                <Card data-testid="card-bill-details">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Vendor Bill</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Amount</label>
                      <div className="font-medium" data-testid="text-bill-amount">
                        ${selectedMatch.matchDetails?.bill?.amount || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Bill Date</label>
                      <div data-testid="text-bill-date">
                        {selectedMatch.matchDetails?.bill?.billDate ? 
                          format(new Date(selectedMatch.matchDetails.bill.billDate), 'PP') : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <div>
                        {selectedMatch.hasBill ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <X className="w-3 h-3 mr-1" />
                            Missing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Variances */}
              {selectedMatch.variances && selectedMatch.variances.length > 0 && (
                <Card data-testid="card-variances">
                  <CardHeader>
                    <CardTitle className="text-base">Variances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedMatch.variances.map((variance: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div>
                            <div className="font-medium text-yellow-800" data-testid={`text-variance-type-${idx}`}>
                              {variance.type}
                            </div>
                            <div className="text-sm text-yellow-600" data-testid={`text-variance-desc-${idx}`}>
                              {variance.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-yellow-800" data-testid={`text-variance-amount-${idx}`}>
                              {variance.amount}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Exception Modal */}
      <Dialog open={isResolveMatchModalOpen} onOpenChange={setIsResolveMatchModalOpen}>
        <DialogContent className="max-w-md" data-testid="modal-resolve-exception">
          <DialogHeader>
            <DialogTitle>Resolve Match Exception</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm">
                  <label className="font-medium">PO Number:</label>
                  <span className="ml-2 font-mono" data-testid="text-resolve-po-number">{selectedMatch.poNumber}</span>
                </div>
                <div className="text-sm mt-1">
                  <label className="font-medium">Status:</label>
                  <span className="ml-2">
                    <Badge className={getStatusColor(selectedMatch.status)}>
                      {getStatusText(selectedMatch.status)}
                    </Badge>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="exception-comment" className="text-sm font-medium">
                  Resolution Notes *
                </label>
                <Textarea
                  id="exception-comment"
                  placeholder="Enter notes explaining the resolution of this match exception..."
                  value={exceptionComment}
                  onChange={(e) => setExceptionComment(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="textarea-exception-comment"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsResolveMatchModalOpen(false);
                    setSelectedMatch(null);
                    setExceptionComment("");
                  }}
                  data-testid="button-cancel-resolve"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (exceptionComment.trim()) {
                      resolveMatchExceptionMutation.mutate({
                        matchId: selectedMatch.id,
                        notes: exceptionComment
                      });
                    } else {
                      toast({ 
                        title: "Error", 
                        description: "Please enter resolution notes",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={resolveMatchExceptionMutation.isPending || !exceptionComment.trim()}
                  data-testid="button-confirm-resolve"
                >
                  {resolveMatchExceptionMutation.isPending ? "Resolving..." : "Resolve Exception"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}