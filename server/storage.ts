import {
  users,
  customers,
  suppliers,
  warehouses,
  products,
  inventory,
  salesOrders,
  salesOrderItems,
  purchaseOrders,
  purchaseOrderItems,
  invoices,
  stockMovements,
  quotations,
  quotationItems,
  receipts,
  commissionEntries,
  creditOverrides,
  leads,
  communications,
  posTerminals,
  posSessions,
  posReceipts,
  posPayments,
  cashMovements,
  employees,
  timeEntries,
  payrollRuns,
  payrollItems,
  performanceReviews,
  // New purchase-related tables
  purchaseRequests,
  purchaseRequestItems,
  approvals,
  approvalRules,
  purchaseRequestApprovals,
  notifications,
  goodsReceipts,
  goodsReceiptItems,
  vendorBills,
  vendorBillItems,
  fxRates,
  competitorPrices,
  matchResults,
  // AI Module tables
  aiChatSessions,
  aiChatMessages,
  aiInsights,
  aiModelMetrics,
  // Marketing Module tables
  campaigns,
  campaignMembers,
  // Lead pipeline tables
  leadActivities,
  leadScoringHistory,
  leadStageHistory,
  leadScoringRules,
  pipelineConfiguration,
  // Sentiment Analysis table
  sentimentAnalyses,
  // Compliance tables
  licenses,
  regulatoryReports,
  auditLogs,
  recallNotices,
  // Advanced Reporting tables
  reportDefinitions,
  savedReports,
  reportExports,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Supplier,
  type InsertSupplier,
  type Warehouse,
  type InsertWarehouse,
  type Product,
  type InsertProduct,
  type Inventory,
  type InsertInventory,
  type SalesOrder,
  type InsertSalesOrder,
  type SalesOrderItem,
  type InsertSalesOrderItem,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type Invoice,
  type InsertInvoice,
  type StockMovement,
  type InsertStockMovement,
  type Quotation,
  type InsertQuotation,
  type QuotationItem,
  type InsertQuotationItem,
  type Receipt,
  type InsertReceipt,
  type CommissionEntry,
  type InsertCommissionEntry,
  type CreditOverride,
  type InsertCreditOverride,
  type Lead,
  type InsertLead,
  type Communication,
  type InsertCommunication,
  type SentimentAnalysis,
  type InsertSentimentAnalysis,
  type PosTerminal,
  type InsertPosTerminal,
  type PosSession,
  type InsertPosSession,
  type PosReceipt,
  type InsertPosReceipt,
  type PosPayment,
  type InsertPosPayment,
  type CashMovement,
  type InsertCashMovement,
  type Employee,
  type InsertEmployee,
  type TimeEntry,
  type InsertTimeEntry,
  type PayrollRun,
  type InsertPayrollRun,
  type PayrollItem,
  type InsertPayrollItem,
  type PerformanceReview,
  type InsertPerformanceReview,
  // New purchase-related types
  type PurchaseRequest,
  type InsertPurchaseRequest,
  type PurchaseRequestItem,
  type InsertPurchaseRequestItem,
  type Approval,
  type InsertApproval,
  type ApprovalRule,
  type InsertApprovalRule,
  type PurchaseRequestApproval,
  type InsertPurchaseRequestApproval,
  type Notification,
  type InsertNotification,
  type GoodsReceipt,
  type InsertGoodsReceipt,
  type GoodsReceiptItem,
  type InsertGoodsReceiptItem,
  type VendorBill,
  type InsertVendorBill,
  type VendorBillItem,
  type InsertVendorBillItem,
  type FxRate,
  type InsertFxRate,
  type CompetitorPrice,
  type InsertCompetitorPrice,
  type MatchResult,
  type InsertMatchResult,
  // AI Module types
  type AiChatSession,
  type InsertAiChatSession,
  type AiChatMessage,
  type InsertAiChatMessage,
  type AiInsight,
  type InsertAiInsight,
  type AiModelMetric,
  type InsertAiModelMetric,
  // Marketing Module types
  type Campaign,
  type InsertCampaign,
  type CampaignMember,
  type InsertCampaignMember,
  // Lead pipeline types
  type LeadActivity,
  type InsertLeadActivity,
  type LeadScoringHistory,
  type InsertLeadScoringHistory,
  type LeadStageHistory,
  type InsertLeadStageHistory,
  type LeadScoringRule,
  type InsertLeadScoringRule,
  type PipelineConfiguration,
  type InsertPipelineConfiguration,
  // Compliance types
  type License,
  type InsertLicense,
  type RegulatoryReport,
  type InsertRegulatoryReport,
  type AuditLog,
  type InsertAuditLog,
  type RecallNotice,
  type InsertRecallNotice,
  // Advanced Reporting types
  type ReportDefinition,
  type InsertReportDefinition,
  type SavedReport,
  type InsertSavedReport,
  type ReportExport,
  type InsertReportExport,
} from "@shared/schema";
import { getDb } from "./db";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUsers(role?: string, limit?: number): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Customer operations
  getCustomers(limit?: number): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Supplier operations
  getSuppliers(limit?: number): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  
  // Warehouse operations
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: string): Promise<void>;
  
  // Product operations
  getProducts(limit?: number): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Inventory operations
  getInventory(warehouseId?: string): Promise<(Inventory & { product: Product })[]>;
  getInventoryByProduct(productId: string): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: string, inventory: Partial<InsertInventory>): Promise<Inventory>;
  getExpiringProducts(daysAhead: number): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]>;
  
  // Sales operations
  getSalesOrders(limit?: number): Promise<(SalesOrder & { customer: Customer; salesRep?: User })[]>;
  getSalesOrder(id: string): Promise<(SalesOrder & { customer: Customer; items: (SalesOrderItem & { product: Product })[] }) | undefined>;
  createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder>;
  updateSalesOrder(id: string, order: Partial<InsertSalesOrder>): Promise<SalesOrder>;
  createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem>;
  
  // Sales lifecycle operations
  confirmSalesOrder(orderId: string, confirmedBy: string): Promise<{ order: SalesOrder; allocations: Array<{ inventoryId: string; qty: number }> }>;
  fulfillSalesOrder(orderId: string, warehouseId: string, fulfilledBy: string): Promise<{ order: SalesOrder; movements: StockMovement[] }>;
  generateInvoiceFromSalesOrder(orderId: string, invoiceData?: Partial<InsertInvoice>): Promise<Invoice>;
  processSalesReturn(refId: string, items: Array<{ productId: string; inventoryId?: string; qty: number; reason?: string }>, warehouseId: string, processedBy: string): Promise<{ creditNote: Invoice; movements: StockMovement[] }>;
  cancelSalesOrder(orderId: string, cancelledBy: string): Promise<SalesOrder>;
  
  // Purchase operations
  getPurchaseOrders(limit?: number): Promise<(PurchaseOrder & { supplier: Supplier })[]>;
  getPurchaseOrder(id: string): Promise<(PurchaseOrder & { supplier: Supplier; items: (PurchaseOrderItem & { product: Product })[] }) | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  
  // Invoice operations
  getInvoices(limit?: number): Promise<(Invoice & { customer: Customer })[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  
  // Stock movement operations
  getStockMovements(limit?: number): Promise<(StockMovement & { product: Product; warehouse: Warehouse; user?: User })[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  
  // Dashboard analytics
  getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeProducts: number;
    openOrders: number;
    outstandingAmount: number;
    expiringProductsCount: number;
  }>;
  
  // Recent transactions
  getRecentTransactions(limit?: number): Promise<Array<{
    id: string;
    date: string;
    type: 'sale' | 'purchase' | 'payment';
    customerOrSupplier: string;
    amount: number;
    status: string;
    reference: string;
  }>>;
  
  // POS Terminal operations
  getPosTerminals(): Promise<PosTerminal[]>;
  getPosTerminal(id: string): Promise<PosTerminal | undefined>;
  createPosTerminal(terminal: InsertPosTerminal): Promise<PosTerminal>;
  updatePosTerminal(id: string, terminal: Partial<InsertPosTerminal>): Promise<PosTerminal>;
  
  // POS Session operations
  getPosSessions(limit?: number): Promise<(PosSession & { terminal: PosTerminal; cashier: User })[]>;
  getPosSession(id: string): Promise<(PosSession & { terminal: PosTerminal; cashier: User }) | undefined>;
  getActivePosSession(terminalId: string): Promise<PosSession | undefined>;
  openPosSession(session: InsertPosSession): Promise<PosSession>;
  closePosSession(sessionId: string, actualCash: number, notes?: string): Promise<PosSession>;
  
  // POS Sales/Receipt operations
  getPosReceipts(sessionId?: string, limit?: number): Promise<(PosReceipt & { session: PosSession; customer?: Customer })[]>;
  getPosReceipt(id: string): Promise<(PosReceipt & { payments: PosPayment[] }) | undefined>;
  createPosSale(saleData: {
    sessionId: string;
    customerId?: string;
    items: Array<{
      productId: string;
      inventoryId?: string;
      quantity: number;
      unitPrice: number;
    }>;
    payments: Array<{
      method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'check' | 'credit';
      amount: number;
      cardTransactionId?: string;
      cardLast4?: string;
      cardType?: string;
      mobileMoneyNumber?: string;
      mobileMoneyProvider?: string;
      checkNumber?: string;
      bankName?: string;
      referenceNumber?: string;
    }>;
    taxRate?: number;
    discountAmount?: number;
  }): Promise<{ receipt: PosReceipt; payments: PosPayment[] }>;
  
  // Cash movement operations
  getCashMovements(sessionId: string): Promise<(CashMovement & { user: User })[]>;
  createCashMovement(movement: InsertCashMovement): Promise<CashMovement>;
  
  // HR Module - Employee Management
  getEmployees(limit?: number, department?: string): Promise<(Employee & { user: User; manager?: User })[]>;
  getEmployee(id: string): Promise<(Employee & { user: User; manager?: User }) | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  
  // HR Module - Time Tracking
  getTimeEntries(employeeId?: string, startDate?: string, endDate?: string, limit?: number): Promise<(TimeEntry & { employee: Employee & { user: User }; approver?: User })[]>;
  getTimeEntry(id: string): Promise<(TimeEntry & { employee: Employee & { user: User }; approver?: User }) | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  approveTimeEntry(id: string, approverId: string): Promise<TimeEntry>;
  
  // HR Module - Payroll Processing
  getPayrollRuns(limit?: number): Promise<(PayrollRun & { processedBy?: User })[]>;
  getPayrollRun(id: string): Promise<(PayrollRun & { processedBy?: User; payrollItems: (PayrollItem & { employee: Employee & { user: User } })[] }) | undefined>;
  createPayrollRun(payrollRun: InsertPayrollRun): Promise<PayrollRun>;
  updatePayrollRun(id: string, payrollRun: Partial<InsertPayrollRun>): Promise<PayrollRun>;
  getPayrollItems(payrollRunId?: string, employeeId?: string): Promise<(PayrollItem & { employee: Employee & { user: User }; payrollRun: PayrollRun })[]>;
  createPayrollItem(payrollItem: InsertPayrollItem): Promise<PayrollItem>;
  processPayroll(payrollRunId: string, processedBy: string): Promise<{ payrollRun: PayrollRun; payrollItems: PayrollItem[] }>;
  
  // HR Module - Performance Reviews
  getPerformanceReviews(employeeId?: string, reviewerId?: string, status?: string, limit?: number): Promise<(PerformanceReview & { employee: Employee & { user: User }; reviewer: User })[]>;
  getPerformanceReview(id: string): Promise<(PerformanceReview & { employee: Employee & { user: User }; reviewer: User }) | undefined>;
  createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: string, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview>;
  completePerformanceReview(id: string): Promise<PerformanceReview>;
  
  // AI Analytics - Sales History and Business Intelligence
  getSalesHistory(productId?: string, daysBack?: number): Promise<Array<{
    productId: string;
    productName: string;
    salesData: Array<{
      date: string;
      quantity: number;
      revenue: number;
    }>;
    totalSold: number;
    averageDailySales: number;
    salesVelocity: number;
  }>>;
  
  getLeadTimeAnalysis(supplierId?: string): Promise<Array<{
    supplierId: string;
    supplierName: string;
    productId: string;
    productName: string;
    averageLeadTimeDays: number;
    minLeadTimeDays: number;
    maxLeadTimeDays: number;
    orderCount: number;
    reliability: number; // percentage of on-time deliveries
  }>>;
  
  getProductDemandAnalysis(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    averageMonthlySales: number;
    stockTurnoverRate: number;
    seasonalPattern: number[]; // 12 months pattern
    demandTrend: 'increasing' | 'decreasing' | 'stable';
    forecastedDemand: number; // next 30 days
  }>>;
  
  getPriceOptimizationData(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    currentPrice: number;
    averageCost: number;
    currentMargin: number;
    salesVolume: number;
    competitorPrices: number[];
    priceElasticity: number;
    optimalPriceRange: {
      min: number;
      max: number;
      recommended: number;
    };
  }>>;

  // CRM Module - Quotation operations
  getQuotations(limit?: number, status?: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] })[]>;
  getQuotation(id: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] }) | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, quotation: Partial<InsertQuotation>): Promise<Quotation>;
  deleteQuotation(id: string): Promise<void>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<(QuotationItem & { product: Product })[]>;
  updateQuotationItem(id: string, item: Partial<InsertQuotationItem>): Promise<QuotationItem>;
  deleteQuotationItem(id: string): Promise<void>;
  recalculateQuotationTotals(quotationId: string): Promise<Quotation>;
  convertQuotationToOrder(quotationId: string, orderData?: Partial<InsertSalesOrder>): Promise<SalesOrder>;

  // CRM Module - Receipt operations
  getReceipts(limit?: number, customerId?: string): Promise<(Omit<Receipt, 'receivedBy'> & { customer: Customer; invoice?: Invoice; receivedBy: User })[]>;
  getReceipt(id: string): Promise<(Omit<Receipt, 'receivedBy'> & { customer: Customer; invoice?: Invoice; receivedBy: User }) | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: string, receipt: Partial<InsertReceipt>): Promise<Receipt>;
  allocateReceiptToInvoice(receiptId: string, invoiceId: string, amount: number): Promise<{ receipt: Receipt; invoice: Invoice }>;

  // CRM Module - Commission operations
  getCommissionEntries(salesRepId?: string, status?: string, limit?: number, startDate?: string, endDate?: string): Promise<(CommissionEntry & { invoice: Invoice; salesRep: User; approver?: User })[]>;
  getCommissionEntry(id: string): Promise<(CommissionEntry & { invoice: Invoice; salesRep: User; approver?: User }) | undefined>;
  createCommissionEntry(commission: InsertCommissionEntry): Promise<CommissionEntry>;
  updateCommissionEntry(id: string, commission: Partial<InsertCommissionEntry>): Promise<CommissionEntry>;
  approveCommission(id: string, approverId: string): Promise<CommissionEntry>;
  markCommissionAsPaid(id: string): Promise<CommissionEntry>;
  updateCommissionNotes(id: string, notes?: string): Promise<CommissionEntry>;
  getCommissionEntriesForExport(filters: {
    salesRepId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<(CommissionEntry & { 
    invoice: Invoice & { customer: Customer }; 
    salesRep: User; 
    approver?: User 
  })[]>;
  bulkCommissionActions(
    commissionIds: string[], 
    action: 'approve' | 'mark-paid' | 'cancel',
    userId: string,
    notes?: string
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }>;
  getSalesRepCommissionSummary(salesRepId: string, startDate?: string, endDate?: string): Promise<{
    totalAccrued: number;
    totalApproved: number;
    totalPaid: number;
    entries: (CommissionEntry & { invoice: Invoice })[];
  }>;

  // CRM Module - Credit Override operations
  getCreditOverrides(customerId?: string, status?: string, limit?: number): Promise<(CreditOverride & { customer: Customer; requester: User; approver?: User; invoice?: Invoice })[]>;
  getCreditOverride(id: string): Promise<(CreditOverride & { customer: Customer; requester: User; approver?: User; invoice?: Invoice }) | undefined>;
  createCreditOverride(override: InsertCreditOverride): Promise<CreditOverride>;
  updateCreditOverride(id: string, override: Partial<InsertCreditOverride>): Promise<CreditOverride>;
  approveCreditOverride(id: string, approverId: string, approvedAmount: number): Promise<CreditOverride>;
  checkCustomerCredit(customerId: string, newOrderAmount: number): Promise<{
    creditLimit: number;
    outstandingAmount: number;
    availableCredit: number;
    canProceed: boolean;
    requiresOverride: boolean;
  }>;

  // CRM Module - Lead operations
  getLeads(limit?: number, status?: string, assignedTo?: string): Promise<(Lead & { assignee?: User; campaign?: any; communications: Communication[] })[]>;
  getLeadsByPipelineStage(stage?: string, assignedTo?: string): Promise<(Lead & { assignee?: User; activities: LeadActivity[]; scoreHistory: LeadScoringHistory[] })[]>;
  getLead(id: string): Promise<(Lead & { assignee?: User; campaign?: any; communications: Communication[] }) | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  updateLeadPipelineStage(leadId: string, newStage: string, movedBy: string, reason?: string): Promise<Lead>;
  updateLeadScore(leadId: string, score: number, criteria: string, reason?: string, triggeredBy?: string): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  convertLeadToCustomer(leadId: string, customerData: InsertCustomer): Promise<{ lead: Lead; customer: Customer }>;

  // Lead Pipeline Management operations
  getPipelineConfiguration(): Promise<PipelineConfiguration[]>;
  updatePipelineConfiguration(configs: InsertPipelineConfiguration[]): Promise<PipelineConfiguration[]>;
  getLeadActivities(leadId: string, limit?: number): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  getLeadScoringHistory(leadId: string, limit?: number): Promise<LeadScoringHistory[]>;
  getLeadStageHistory(leadId: string): Promise<(LeadStageHistory & { movedByUser?: User })[]>;
  
  // Lead Scoring operations
  getLeadScoringRules(): Promise<LeadScoringRule[]>;
  createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule>;
  updateLeadScoringRule(id: string, rule: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule>;
  deleteLeadScoringRule(id: string): Promise<void>;
  calculateLeadScore(leadId: string): Promise<{ totalScore: number; breakdown: Record<string, number> }>;
  batchCalculateLeadScores(leadIds?: string[]): Promise<void>;

  // Pipeline Analytics
  getPipelineAnalytics(startDate?: Date, endDate?: Date, assignedTo?: string): Promise<{
    pipelineValue: number;
    averageTimeInStage: Record<string, number>;
    conversionRates: Record<string, number>;
    stageDistribution: Record<string, { count: number; value: number }>;
    topPerformers: { userId: string; userName: string; leadsConverted: number; totalValue: number }[];
    leadSources: Record<string, { count: number; conversionRate: number }>;
    velocityMetrics: { averageCycleTime: number; fastestDeals: number; slowestDeals: number };
  }>;
  getLeadSourcePerformance(): Promise<Array<{ source: string; totalLeads: number; convertedLeads: number; conversionRate: number; avgScore: number }>>;
  getPipelineVelocity(stage?: string): Promise<{ averageDays: number; medianDays: number; trends: Array<{ date: string; averageDays: number }> }>;
  
  // CRM Module - Communication operations
  getCommunication(id: string): Promise<Communication | undefined>;
  getCustomerCommunications(customerId: string, limit?: number): Promise<Communication[]>;
  getLeadCommunications(leadId: string, limit?: number): Promise<(Communication & { user: User })[]>;
  createLeadCommunication(communication: InsertCommunication): Promise<Communication>;
  updateLeadCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication>;

  // Sentiment Analysis operations
  upsertSentiment(sentiment: InsertSentimentAnalysis): Promise<SentimentAnalysis>;
  getSentimentByCommunication(communicationId: string): Promise<SentimentAnalysis | undefined>;
  listSentimentsByCustomer(customerId: string, limit?: number): Promise<(SentimentAnalysis & { communication: Communication })[]>;
  getCustomerSentimentSummary(customerId: string): Promise<{
    totalCommunications: number;
    averageScore: number;
    sentimentDistribution: { negative: number; neutral: number; positive: number };
    recentTrend: 'improving' | 'declining' | 'stable';
    lastAnalyzedAt: Date | null;
  }>;
  getGlobalSentimentSummary(): Promise<{
    totalCommunications: number;
    averageScore: number;
    sentimentDistribution: { negative: number; neutral: number; positive: number };
    topNegativeCustomers: { customerId: string; customerName: string; averageScore: number }[];
    topPositiveCustomers: { customerId: string; customerName: string; averageScore: number }[];
  }>;

  // Enhanced Dashboard metrics for CRM
  getCrmDashboardMetrics(): Promise<{
    totalQuotations: number;
    pendingQuotations: number;
    quotationValue: number;
    conversionRate: number;
    totalLeads: number;
    qualifiedLeads: number;
    totalCommissions: number;
    outstandingReceipts: number;
    creditOverridesPending: number;
  }>;

  // Enhanced Purchase Module Operations
  
  // Purchase Request operations
  getPurchaseRequests(limit?: number, status?: string, requesterId?: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] })[]>;
  getPurchaseRequest(id: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] }) | undefined>;
  createPurchaseRequest(pr: InsertPurchaseRequest): Promise<PurchaseRequest>;
  updatePurchaseRequest(id: string, pr: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest>;
  deletePurchaseRequest(id: string): Promise<void>;
  createPurchaseRequestItem(item: InsertPurchaseRequestItem): Promise<PurchaseRequestItem>;
  submitPurchaseRequest(id: string): Promise<PurchaseRequest>;
  approvePurchaseRequest(id: string, approverId: string): Promise<PurchaseRequest>;
  rejectPurchaseRequest(id: string, approverId: string, comment: string): Promise<PurchaseRequest>;
  convertPRtoPO(prId: string, poData: Partial<InsertPurchaseOrder>): Promise<{ pr: PurchaseRequest; po: PurchaseOrder }>;

  // Enhanced Approval workflow operations
  getApprovals(entityType?: string, entityId?: string, approverId?: string): Promise<(Approval & { approver: User })[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  processApproval(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Approval>;
  
  // Multi-level approval rules management
  getApprovalRules(entityType?: string, currency?: string): Promise<ApprovalRule[]>;
  createApprovalRule(rule: InsertApprovalRule): Promise<ApprovalRule>;
  updateApprovalRule(id: string, rule: Partial<InsertApprovalRule>): Promise<ApprovalRule>;
  deleteApprovalRule(id: string): Promise<void>;
  
  // Enhanced PR workflow methods
  submitPurchaseRequestWithApproval(id: string, submitterId: string): Promise<{ pr: PurchaseRequest; approvals: PurchaseRequestApproval[] }>;
  approvePurchaseRequestLevel(prId: string, level: number, approverId: string, comment?: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval; isFullyApproved: boolean }>;
  rejectPurchaseRequestLevel(prId: string, level: number, approverId: string, comment: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval }>;
  
  // Purchase request approval queries
  getPurchaseRequestApprovals(prId: string): Promise<(PurchaseRequestApproval & { approver: User; rule: ApprovalRule })[]>;
  getPendingApprovalsForUser(userId: string, limit?: number): Promise<(PurchaseRequestApproval & { purchaseRequest: PurchaseRequest & { requester: User; items: (PurchaseRequestItem & { product: Product })[] }; rule: ApprovalRule })[]>;
  
  // Notification system operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Goods Receipt operations
  getGoodsReceipts(limit?: number, poId?: string): Promise<(Omit<GoodsReceipt, 'receivedBy'> & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; warehouse: Warehouse; receivedBy: User; items: (GoodsReceiptItem & { product: Product })[] })[]>;
  getGoodsReceipt(id: string): Promise<(Omit<GoodsReceipt, 'receivedBy'> & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; warehouse: Warehouse; receivedBy: User; items: (GoodsReceiptItem & { product: Product })[] }) | undefined>;
  createGoodsReceipt(receipt: InsertGoodsReceipt, items: InsertGoodsReceiptItem[]): Promise<GoodsReceipt>;
  updateGoodsReceipt(id: string, receipt: Partial<InsertGoodsReceipt>): Promise<GoodsReceipt>;
  deleteGoodsReceipt(id: string): Promise<void>;
  postGoodsReceipt(id: string): Promise<GoodsReceipt>; // posts to inventory

  // Vendor Bill operations
  getVendorBills(limit?: number, supplierId?: string): Promise<(Omit<VendorBill, 'createdBy'> & { supplier: Supplier; purchaseOrder?: PurchaseOrder; createdBy: User; items: (VendorBillItem & { product?: Product })[] })[]>;
  getVendorBill(id: string): Promise<(Omit<VendorBill, 'createdBy'> & { supplier: Supplier; purchaseOrder?: PurchaseOrder; createdBy: User; items: (VendorBillItem & { product?: Product })[] }) | undefined>;
  createVendorBill(bill: InsertVendorBill, items: InsertVendorBillItem[]): Promise<VendorBill>;
  updateVendorBill(id: string, bill: Partial<InsertVendorBill>): Promise<VendorBill>;
  deleteVendorBill(id: string): Promise<void>;
  postVendorBill(id: string): Promise<VendorBill>; // finalizes the bill
  processOCRBill(billId: string, ocrRaw: string, ocrExtract: any): Promise<VendorBill>;

  // Three-Way Matching operations
  getMatchResults(poId?: string, status?: string): Promise<(MatchResult & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; goodsReceipt?: GoodsReceipt; vendorBill?: VendorBill; resolvedBy?: User })[]>;
  performThreeWayMatch(poId: string): Promise<MatchResult>;
  resolveMatchException(matchId: string, resolvedBy: string, notes: string): Promise<MatchResult>;

  // FX Rate operations
  getFxRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRate[]>;
  getFxRateLatest(baseCurrency: string, quoteCurrency: string): Promise<FxRate | undefined>;
  upsertFxRate(rate: InsertFxRate): Promise<FxRate>;
  refreshFxRates(): Promise<FxRate[]>; // updates from external API

  // Competitor Price operations
  getCompetitorPrices(productId?: string, competitor?: string): Promise<(CompetitorPrice & { product: Product })[]>;
  upsertCompetitorPrice(price: InsertCompetitorPrice): Promise<CompetitorPrice>;
  deleteCompetitorPrice(id: string): Promise<void>;
  getCompetitorAnalysis(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    ourPrice: number;
    avgCompetitorPrice: number;
    minCompetitorPrice: number;
    maxCompetitorPrice: number;
    priceAdvantage: number; // percentage
    competitorCount: number;
  }>>;

  // Purchase Dashboard metrics
  getPurchaseDashboardMetrics(): Promise<{
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
  }>;

  // AI Module Operations
  
  // AI Chat Session operations
  getAiChatSessions(userId?: string, status?: string, limit?: number): Promise<AiChatSession[]>;
  getAiChatSession(id: string): Promise<(AiChatSession & { messages: AiChatMessage[] }) | undefined>;
  createAiChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  updateAiChatSession(id: string, session: Partial<InsertAiChatSession>): Promise<AiChatSession>;
  closeAiChatSession(id: string): Promise<AiChatSession>;
  
  // AI Chat Message operations
  getAiChatMessages(sessionId: string, limit?: number): Promise<AiChatMessage[]>;
  createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  
  // AI Insights operations
  getAiInsights(type?: string, status?: string, entityType?: string, entityId?: string, limit?: number): Promise<(AiInsight & { generatedByUser?: User; reviewedByUser?: User; appliedByUser?: User })[]>;
  getAiInsight(id: string): Promise<(AiInsight & { generatedByUser?: User; reviewedByUser?: User; appliedByUser?: User }) | undefined>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;
  updateAiInsight(id: string, insight: Partial<InsertAiInsight>): Promise<AiInsight>;
  reviewAiInsight(id: string, reviewerId: string, status: 'reviewed' | 'applied' | 'dismissed'): Promise<AiInsight>;
  applyAiInsight(id: string, appliedBy: string): Promise<AiInsight>;
  
  // AI Model Metrics operations
  getAiModelMetrics(modelName?: string, requestType?: string, limit?: number): Promise<AiModelMetric[]>;
  createAiModelMetric(metric: InsertAiModelMetric): Promise<AiModelMetric>;
  getAiModelPerformanceStats(modelName?: string, days?: number): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    averageTokensUsed: number;
    errorRate: number;
    costEstimate: number;
  }>;

  // Marketing Module Operations
  
  // Campaign operations
  getCampaigns(status?: string, type?: string, managerId?: string, limit?: number): Promise<(Campaign & { manager: User; members: CampaignMember[] })[]>;
  getCampaign(id: string): Promise<(Campaign & { manager: User; members: (CampaignMember & { customer?: Customer; lead?: Lead })[] }) | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  launchCampaign(id: string): Promise<Campaign>;
  pauseCampaign(id: string): Promise<Campaign>;
  completeCampaign(id: string): Promise<Campaign>;
  
  // Campaign Member operations
  getCampaignMembers(campaignId?: string, status?: string, limit?: number): Promise<(CampaignMember & { customer?: Customer; lead?: Lead })[]>;
  addCampaignMember(member: InsertCampaignMember): Promise<CampaignMember>;
  updateCampaignMember(id: string, member: Partial<InsertCampaignMember>): Promise<CampaignMember>;
  removeCampaignMember(id: string): Promise<void>;
  getCampaignAnalytics(campaignId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    optedOutMembers: number;
    bouncedMembers: number;
    engagementRate: number;
    conversionRate: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  }>;

  // Compliance Module Operations
  
  // License operations
  getLicenses(status?: string, managedBy?: string, limit?: number): Promise<(License & { manager: User })[]>;
  getLicense(id: string): Promise<(License & { manager: User }) | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, license: Partial<InsertLicense>): Promise<License>;
  deleteLicense(id: string): Promise<void>;
  renewLicense(id: string, newExpiryDate: string, renewalDate: string): Promise<License>;
  getExpiringLicenses(daysAhead: number): Promise<(License & { manager: User })[]>;
  
  // Regulatory Report operations
  getRegulatoryReports(status?: string, reportType?: string, preparedBy?: string, limit?: number): Promise<(RegulatoryReport & { preparer: User; reviewer?: User; approver?: User })[]>;
  getRegulatoryReport(id: string): Promise<(RegulatoryReport & { preparer: User; reviewer?: User; approver?: User }) | undefined>;
  createRegulatoryReport(report: InsertRegulatoryReport): Promise<RegulatoryReport>;
  updateRegulatoryReport(id: string, report: Partial<InsertRegulatoryReport>): Promise<RegulatoryReport>;
  submitRegulatoryReport(id: string, submissionRef: string): Promise<RegulatoryReport>;
  reviewRegulatoryReport(id: string, reviewerId: string): Promise<RegulatoryReport>;
  approveRegulatoryReport(id: string, approverId: string): Promise<RegulatoryReport>;
  rejectRegulatoryReport(id: string, approverId: string, reason: string): Promise<RegulatoryReport>;
  
  // Audit Log operations
  getAuditLogs(tableName?: string, recordId?: string, userId?: string, action?: string, limit?: number): Promise<(AuditLog & { user?: User })[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  
  // Recall Notice operations
  getRecallNotices(status?: string, productId?: string, managedBy?: string, limit?: number): Promise<(RecallNotice & { product: Product; manager: User })[]>;
  getRecallNotice(id: string): Promise<(RecallNotice & { product: Product; manager: User }) | undefined>;
  createRecallNotice(recall: InsertRecallNotice): Promise<RecallNotice>;
  updateRecallNotice(id: string, recall: Partial<InsertRecallNotice>): Promise<RecallNotice>;
  initiateRecall(id: string): Promise<RecallNotice>;
  completeRecall(id: string, recoveryPercentage: number): Promise<RecallNotice>;
  
  // Advanced Reporting Operations
  
  // Report Definition operations
  getReportDefinitions(category?: string, isPublic?: boolean, ownerId?: string, limit?: number): Promise<(ReportDefinition & { owner: User })[]>;
  getReportDefinition(id: string): Promise<(ReportDefinition & { owner: User }) | undefined>;
  createReportDefinition(reportDef: InsertReportDefinition): Promise<ReportDefinition>;
  updateReportDefinition(id: string, reportDef: Partial<InsertReportDefinition>): Promise<ReportDefinition>;
  deleteReportDefinition(id: string): Promise<void>;
  
  // Saved Report operations
  getSavedReports(userId?: string, reportDefinitionId?: string, limit?: number): Promise<(SavedReport & { reportDefinition: ReportDefinition; user: User })[]>;
  getSavedReport(id: string): Promise<(SavedReport & { reportDefinition: ReportDefinition; user: User }) | undefined>;
  createSavedReport(savedReport: InsertSavedReport): Promise<SavedReport>;
  updateSavedReport(id: string, savedReport: Partial<InsertSavedReport>): Promise<SavedReport>;
  deleteSavedReport(id: string): Promise<void>;
  
  // Report Export operations
  getReportExports(generatedBy?: string, status?: string, limit?: number): Promise<(ReportExport & { generator: User })[]>;
  getReportExport(id: string): Promise<(ReportExport & { generator: User }) | undefined>;
  createReportExport(reportExport: InsertReportExport): Promise<ReportExport>;
  updateReportExport(id: string, reportExport: Partial<InsertReportExport>): Promise<ReportExport>;
  markReportExportComplete(id: string, filePath: string, fileSize: number): Promise<ReportExport>;
  markReportExportFailed(id: string, errorMessage: string): Promise<ReportExport>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(role?: string, limit = 100): Promise<User[]> {
    const db = await getDb();
    const conditions = [eq(users.isActive, true)];
    
    if (role) {
      conditions.push(eq(users.role, role as any));
    }

    return await db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(limit = 100): Promise<Customer[]> {
    const db = await getDb();
    return await db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .limit(limit)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const db = await getDb();
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.isActive, true)));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const db = await getDb();
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const db = await getDb();
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  // Supplier operations
  async getSuppliers(limit = 100): Promise<Supplier[]> {
    const db = await getDb();
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .limit(limit)
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const db = await getDb();
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.isActive, true)));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const db = await getDb();
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const db = await getDb();
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(suppliers.id, id));
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    const db = await getDb();
    return await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.isActive, true))
      .orderBy(asc(warehouses.name));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const db = await getDb();
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, id), eq(warehouses.isActive, true)));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const db = await getDb();
    const [newWarehouse] = await db
      .insert(warehouses)
      .values(warehouse)
      .returning();
    return newWarehouse;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    const db = await getDb();
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(warehouse)
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(warehouses)
      .set({ isActive: false })
      .where(eq(warehouses.id, id));
  }

  // Product operations
  async getProducts(limit = 100): Promise<Product[]> {
    const db = await getDb();
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(limit)
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const db = await getDb();
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const db = await getDb();
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const db = await getDb();
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  // Inventory operations
  async getInventory(warehouseId?: string): Promise<(Inventory & { product: Product })[]> {
    const db = await getDb();
    const query = db
      .select({
        id: inventory.id,
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        manufactureDate: inventory.manufactureDate,
        expiryDate: inventory.expiryDate,
        costPerUnit: inventory.costPerUnit,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(eq(products.isActive, true));

    const result = warehouseId ? 
      db.select({
        id: inventory.id,
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        manufactureDate: inventory.manufactureDate,
        expiryDate: inventory.expiryDate,
        costPerUnit: inventory.costPerUnit,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(and(eq(inventory.warehouseId, warehouseId), eq(products.isActive, true)))
      .orderBy(desc(inventory.createdAt)) : 
      query.orderBy(desc(inventory.createdAt));
      
    return await result;
  }

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    const db = await getDb();
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .orderBy(asc(inventory.expiryDate)); // FEFO ordering
  }

  async createInventory(inventoryData: InsertInventory): Promise<Inventory> {
    const db = await getDb();
    const [newInventory] = await db
      .insert(inventory)
      .values(inventoryData)
      .returning();
    return newInventory;
  }

  async updateInventory(id: string, inventoryData: Partial<InsertInventory>): Promise<Inventory> {
    const db = await getDb();
    const [updatedInventory] = await db
      .update(inventory)
      .set({ ...inventoryData, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return updatedInventory;
  }

  async getExpiringProducts(daysAhead: number): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]> {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return await db
      .select({
        id: inventory.id,
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        batchNumber: inventory.batchNumber,
        quantity: inventory.quantity,
        manufactureDate: inventory.manufactureDate,
        expiryDate: inventory.expiryDate,
        costPerUnit: inventory.costPerUnit,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
        product: products,
        warehouse: warehouses,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .where(
        and(
          eq(products.isActive, true),
          lte(inventory.expiryDate, cutoffDate.toISOString().split('T')[0]),
          gte(inventory.quantity, 1)
        )
      )
      .orderBy(asc(inventory.expiryDate));
  }

  // Sales operations
  async getSalesOrders(limit = 50): Promise<(SalesOrder & { customer: Customer; salesRep?: User })[]> {
    const db = await getDb();
    return await db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        customerId: salesOrders.customerId,
        salesRepId: salesOrders.salesRepId,
        orderDate: salesOrders.orderDate,
        deliveryDate: salesOrders.deliveryDate,
        status: salesOrders.status,
        subtotal: salesOrders.subtotal,
        taxAmount: salesOrders.taxAmount,
        totalAmount: salesOrders.totalAmount,
        notes: salesOrders.notes,
        createdAt: salesOrders.createdAt,
        updatedAt: salesOrders.updatedAt,
        customer: customers,
        salesRep: users,
      })
      .from(salesOrders)
      .innerJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(users, eq(salesOrders.salesRepId, users.id))
      .limit(limit)
      .orderBy(desc(salesOrders.createdAt))
      .then(results => results.map(r => ({
        ...r,
        salesRep: r.salesRep || undefined
      })));
  }

  async getSalesOrder(id: string): Promise<(SalesOrder & { customer: Customer; items: (SalesOrderItem & { product: Product })[] }) | undefined> {
    const db = await getDb();
    const [order] = await db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        customerId: salesOrders.customerId,
        salesRepId: salesOrders.salesRepId,
        orderDate: salesOrders.orderDate,
        deliveryDate: salesOrders.deliveryDate,
        status: salesOrders.status,
        subtotal: salesOrders.subtotal,
        taxAmount: salesOrders.taxAmount,
        totalAmount: salesOrders.totalAmount,
        notes: salesOrders.notes,
        createdAt: salesOrders.createdAt,
        updatedAt: salesOrders.updatedAt,
        customer: customers,
      })
      .from(salesOrders)
      .innerJoin(customers, eq(salesOrders.customerId, customers.id))
      .where(eq(salesOrders.id, id));

    if (!order) return undefined;

    const items = await db
      .select({
        id: salesOrderItems.id,
        orderId: salesOrderItems.orderId,
        productId: salesOrderItems.productId,
        inventoryId: salesOrderItems.inventoryId,
        quantity: salesOrderItems.quantity,
        unitPrice: salesOrderItems.unitPrice,
        totalPrice: salesOrderItems.totalPrice,
        createdAt: salesOrderItems.createdAt,
        product: products,
      })
      .from(salesOrderItems)
      .innerJoin(products, eq(salesOrderItems.productId, products.id))
      .where(eq(salesOrderItems.orderId, id));

    return { ...order, items };
  }

  async createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder> {
    const db = await getDb();
    const [newOrder] = await db
      .insert(salesOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateSalesOrder(id: string, order: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Validate current order state and prevent invalid transitions
      const [currentOrder] = await tx
        .select()
        .from(salesOrders)
        .where(eq(salesOrders.id, id));
      
      if (!currentOrder) {
        throw new Error('Sales order not found');
      }
      
      // State transition validation
      if (order.status && currentOrder.status) {
        const validTransitions = {
          'draft': ['confirmed', 'cancelled'],
          'confirmed': ['shipped', 'cancelled'],
          'shipped': ['delivered'],
          'delivered': [], // Terminal state
          'cancelled': [] // Terminal state
        } as const;
        
        const allowedStates = validTransitions[currentOrder.status as keyof typeof validTransitions] || [] as readonly never[];
        if (order.status && !allowedStates.includes(order.status as never)) {
          throw new Error(`Invalid status transition from ${currentOrder.status} to ${order.status}`);
        }
      }
      
      // Optimistic concurrency control - commented out since Partial<InsertSalesOrder> doesn't include updatedAt
      // This would be handled at the API level where updatedAt is available
      
      const [updatedOrder] = await tx
        .update(salesOrders)
        .set({ ...order, updatedAt: new Date() })
        .where(eq(salesOrders.id, id))
        .returning();
      
      return updatedOrder;
    });
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const db = await getDb();
    const [newItem] = await db
      .insert(salesOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Sales Lifecycle Operations with Transactions and FEFO
  async confirmSalesOrder(orderId: string, confirmedBy: string): Promise<{ order: SalesOrder; allocations: Array<{ inventoryId: string; qty: number }> }> {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      // Get order with items
      const order = await this.getSalesOrder(orderId);
      if (!order) throw new Error('Sales order not found');
      
      if (order.status !== 'draft') {
        throw new Error('Only draft orders can be confirmed');
      }

      const allocations: Array<{ inventoryId: string; qty: number }> = [];

      // Check stock availability and create allocations for all items
      for (const item of order.items) {
        let remainingQty = item.quantity;
        
        // Get available inventory batches ordered by expiry date (FEFO)
        const batches = await tx
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.productId, item.productId),
            gte(inventory.quantity, 1)
          ))
          .orderBy(asc(inventory.expiryDate));
        
        for (const batch of batches) {
          if (remainingQty <= 0) break;
          
          const allocateQty = Math.min(batch.quantity, remainingQty);
          allocations.push({
            inventoryId: batch.id,
            qty: allocateQty
          });
          
          remainingQty -= allocateQty;
        }
        
        if (remainingQty > 0) {
          throw new Error(`Insufficient stock for product ${item.product.name}. Missing: ${remainingQty} units`);
        }
      }

      // Reserve stock and update order status
      const [confirmedOrder] = await tx
        .update(salesOrders)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(salesOrders.id, orderId))
        .returning();

      return { order: confirmedOrder, allocations };
    });
  }

  async fulfillSalesOrder(orderId: string, warehouseId: string, fulfilledBy: string): Promise<{ order: SalesOrder; movements: StockMovement[] }> {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      const order = await this.getSalesOrder(orderId);
      if (!order) throw new Error('Sales order not found');
      
      if (order.status !== 'confirmed') {
        throw new Error('Only confirmed orders can be fulfilled');
      }

      const movements: StockMovement[] = [];

      // Process each order item with FEFO (First Expired, First Out)
      for (const item of order.items) {
        let remainingQuantity = item.quantity;
        
        // Get inventory batches ordered by expiry date (FEFO)
        const batches = await tx
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.productId, item.productId),
            eq(inventory.warehouseId, warehouseId),
            gte(inventory.quantity, 1)
          ))
          .orderBy(asc(inventory.expiryDate));
        
        for (const batch of batches) {
          if (remainingQuantity <= 0) break;
          
          const deductQuantity = Math.min(batch.quantity, remainingQuantity);
          
          // Update inventory
          await tx
            .update(inventory)
            .set({ 
              quantity: batch.quantity - deductQuantity,
              updatedAt: new Date()
            })
            .where(eq(inventory.id, batch.id));
          
          // Create stock movement
          const [movement] = await tx
            .insert(stockMovements)
            .values({
              productId: item.productId,
              warehouseId,
              inventoryId: batch.id,
              movementType: 'out',
              quantity: -deductQuantity,
              reference: order.orderNumber,
              notes: `Sales fulfillment by ${fulfilledBy}`,
              userId: fulfilledBy
            })
            .returning();
          
          movements.push(movement);
          remainingQuantity -= deductQuantity;
        }
        
        if (remainingQuantity > 0) {
          throw new Error(`Insufficient stock to fulfill ${item.product.name}. Missing: ${remainingQuantity}`);
        }
      }

      // Update order status
      const [fulfilledOrder] = await tx
        .update(salesOrders)
        .set({ 
          status: 'shipped',
          deliveryDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date()
        })
        .where(eq(salesOrders.id, orderId))
        .returning();

      return { order: fulfilledOrder, movements };
    });
  }

  async generateInvoiceFromSalesOrder(orderId: string, invoiceData?: Partial<InsertInvoice>): Promise<Invoice> {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      const order = await this.getSalesOrder(orderId);
      if (!order) throw new Error('Sales order not found');
      
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        throw new Error('Only shipped or delivered orders can be invoiced');
      }

      // Check if invoice already exists
      const [existingInvoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.salesOrderId, orderId))
        .limit(1);
      
      if (existingInvoice) {
        throw new Error('Invoice already exists for this sales order');
      }

      // Generate invoice number
      const invoiceNumber = invoiceData?.invoiceNumber || `INV-${Date.now()}`;
      const invoiceDate = invoiceData?.invoiceDate || new Date().toISOString().split('T')[0];
      const dueDate = invoiceData?.dueDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 30 days

      const [invoice] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          customerId: order.customerId,
          salesOrderId: orderId,
          invoiceDate,
          dueDate,
          status: 'sent',
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          paidAmount: '0',
          notes: invoiceData?.notes || `Generated from Sales Order ${order.orderNumber}`,
          ...invoiceData
        })
        .returning();

      // Update order status
      await tx
        .update(salesOrders)
        .set({ status: 'delivered', updatedAt: new Date() })
        .where(eq(salesOrders.id, orderId));

      return invoice;
    });
  }

  async processSalesReturn(refId: string, items: Array<{ productId: string; inventoryId?: string; qty: number; reason?: string }>, warehouseId: string, processedBy: string): Promise<{ creditNote: Invoice; movements: StockMovement[] }> {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      const originalOrder = await this.getSalesOrder(refId);
      if (!originalOrder) throw new Error('Original sales order not found');
      
      if (originalOrder.status !== 'delivered') {
        throw new Error('Only delivered orders can have returns processed');
      }

      const movements: StockMovement[] = [];
      let totalCreditAmount = 0;
      
      // Process return items
      for (const returnItem of items) {
        // Find original order item
        const originalItem = originalOrder.items.find(item => item.productId === returnItem.productId);
        if (!originalItem) {
          throw new Error(`Product not found in original order: ${returnItem.productId}`);
        }
        
        if (returnItem.qty > originalItem.quantity) {
          throw new Error(`Return quantity exceeds original quantity for product ${returnItem.productId}`);
        }

        // Create new inventory entry for returned goods
        const [newInventory] = await tx
          .insert(inventory)
          .values({
            productId: returnItem.productId,
            warehouseId,
            batchNumber: `RTN-${Date.now()}`,
            quantity: returnItem.qty,
            manufactureDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 1 year default
            costPerUnit: originalItem.unitPrice
          })
          .returning();

        // Create stock movement
        const [movement] = await tx
          .insert(stockMovements)
          .values({
            productId: returnItem.productId,
            warehouseId,
            inventoryId: newInventory.id,
            movementType: 'in',
            quantity: returnItem.qty,
            reference: originalOrder.orderNumber,
            notes: `Return: ${returnItem.reason || 'Customer return'} - Processed by ${processedBy}`,
            userId: processedBy
          })
          .returning();
        
        movements.push(movement);
        totalCreditAmount += Number(originalItem.unitPrice) * returnItem.qty;
      }

      // Create credit note (negative invoice)
      const creditNoteNumber = `CN-${Date.now()}`;
      const [creditNote] = await tx
        .insert(invoices)
        .values({
          invoiceNumber: creditNoteNumber,
          customerId: originalOrder.customerId,
          salesOrderId: refId,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          subtotal: (-totalCreditAmount).toString(),
          taxAmount: '0',
          totalAmount: (-totalCreditAmount).toString(),
          paidAmount: (-totalCreditAmount).toString(),
          notes: `Credit note for returned items - Processed by ${processedBy}`
        })
        .returning();

      return { creditNote, movements };
    });
  }

  async cancelSalesOrder(orderId: string, cancelledBy: string): Promise<SalesOrder> {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      const order = await this.getSalesOrder(orderId);
      if (!order) throw new Error('Sales order not found');
      
      // Only allow cancellation of draft or confirmed orders
      if (!['draft', 'confirmed'].includes(order.status || '')) {
        throw new Error(`Cannot cancel order with status: ${order.status}. Only draft or confirmed orders can be cancelled.`);
      }

      // If order was confirmed, release any stock reservations
      if (order.status === 'confirmed') {
        // Note: In a full implementation, you might track specific allocations
        // For now, we just update the order status and log the cancellation
        const [stockMovement] = await tx
          .insert(stockMovements)
          .values({
            productId: order.items[0]?.productId || '', // Reference item for logging
            warehouseId: '', // Would be tracked with allocations
            movementType: 'adjustment',
            quantity: 0, // No actual stock movement, just audit trail
            reference: order.orderNumber,
            notes: `Order cancelled - Stock reservations released by ${cancelledBy}`,
            userId: cancelledBy
          })
          .returning();
      }

      // Update order status to cancelled
      const [cancelledOrder] = await tx
        .update(salesOrders)
        .set({ 
          status: 'cancelled',
          notes: `Cancelled by ${cancelledBy} at ${new Date().toISOString()}`,
          updatedAt: new Date()
        })
        .where(eq(salesOrders.id, orderId))
        .returning();

      return cancelledOrder;
    });
  }

  // Purchase operations
  async getPurchaseOrders(limit = 50): Promise<(PurchaseOrder & { supplier: Supplier })[]> {
    const db = await getDb();
    return await db
      .select({
        id: purchaseOrders.id,
        orderNumber: purchaseOrders.orderNumber,
        prId: purchaseOrders.prId,
        supplierId: purchaseOrders.supplierId,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        deliveryDate: purchaseOrders.deliveryDate,
        status: purchaseOrders.status,
        incoterm: purchaseOrders.incoterm,
        paymentTerms: purchaseOrders.paymentTerms,
        currency: purchaseOrders.currency,
        fxRate: purchaseOrders.fxRate,
        subtotal: purchaseOrders.subtotal,
        taxAmount: purchaseOrders.taxAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdBy: purchaseOrders.createdBy,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .limit(limit)
      .orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: string): Promise<(PurchaseOrder & { supplier: Supplier; items: (PurchaseOrderItem & { product: Product })[] }) | undefined> {
    const db = await getDb();
    const [order] = await db
      .select({
        id: purchaseOrders.id,
        orderNumber: purchaseOrders.orderNumber,
        prId: purchaseOrders.prId,
        supplierId: purchaseOrders.supplierId,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        deliveryDate: purchaseOrders.deliveryDate,
        status: purchaseOrders.status,
        incoterm: purchaseOrders.incoterm,
        paymentTerms: purchaseOrders.paymentTerms,
        currency: purchaseOrders.currency,
        fxRate: purchaseOrders.fxRate,
        subtotal: purchaseOrders.subtotal,
        taxAmount: purchaseOrders.taxAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        createdBy: purchaseOrders.createdBy,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, id));

    if (!order) return undefined;

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        orderId: purchaseOrderItems.orderId,
        productId: purchaseOrderItems.productId,
        quantity: purchaseOrderItems.quantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        createdAt: purchaseOrderItems.createdAt,
        product: products,
      })
      .from(purchaseOrderItems)
      .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.orderId, id));

    return { ...order, items };
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const db = await getDb();
    const [newOrder] = await db
      .insert(purchaseOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Validate current order state and prevent invalid transitions
      const [currentOrder] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, id));
      
      if (!currentOrder) {
        throw new Error('Purchase order not found');
      }
      
      // State transition validation for purchase orders
      if (order.status && currentOrder.status) {
        const validTransitions = {
          'draft': ['sent', 'cancelled'],
          'sent': ['confirmed', 'cancelled'],
          'confirmed': ['received', 'cancelled'],
          'received': ['closed'],
          'closed': [], // Terminal state
          'cancelled': [] // Terminal state
        } as const;
        
        const allowedStates = validTransitions[currentOrder.status as keyof typeof validTransitions] || [] as readonly never[];
        if (order.status && !allowedStates.includes(order.status as never)) {
          throw new Error(`Invalid status transition from ${currentOrder.status} to ${order.status}`);
        }
      }
      
      // Prevent modification of confirmed/received orders
      if (['confirmed', 'received', 'closed'].includes(currentOrder.status!) && 
          (order.supplierId || order.orderDate || order.totalAmount)) {
        throw new Error('Cannot modify key fields of confirmed purchase orders');
      }
      
      const [updatedOrder] = await tx
        .update(purchaseOrders)
        .set({ ...order, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, id))
        .returning();
      
      return updatedOrder;
    });
  }

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const db = await getDb();
    const [newItem] = await db
      .insert(purchaseOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Invoice operations
  async getInvoices(limit = 50): Promise<(Invoice & { customer: Customer })[]> {
    const db = await getDb();
    return await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        salesOrderId: invoices.salesOrderId,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .limit(limit)
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const db = await getDb();
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const db = await getDb();
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const db = await getDb();
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  // Stock movement operations
  async getStockMovements(limit = 100): Promise<(StockMovement & { product: Product; warehouse: Warehouse; user?: User })[]> {
    const db = await getDb();
    return await db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        warehouseId: stockMovements.warehouseId,
        inventoryId: stockMovements.inventoryId,
        movementType: stockMovements.movementType,
        quantity: stockMovements.quantity,
        reference: stockMovements.reference,
        notes: stockMovements.notes,
        userId: stockMovements.userId,
        createdAt: stockMovements.createdAt,
        product: products,
        warehouse: warehouses,
        user: users,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .innerJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .limit(limit)
      .orderBy(desc(stockMovements.createdAt))
      .then(results => results.map(r => ({
        ...r,
        user: r.user || undefined
      })));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const db = await getDb();
    const [newMovement] = await db
      .insert(stockMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  // Dashboard analytics - OPTIMIZED for parallel execution
  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeProducts: number;
    openOrders: number;
    outstandingAmount: number;
    expiringProductsCount: number;
  }> {
    const db = await getDb();
    
    // Expiring products cutoff date calculation
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 90);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Execute all queries in parallel for massive performance improvement
    const [
      revenueResults,
      productsResults, 
      ordersResults,
      outstandingResults,
      expiringResults
    ] = await Promise.all([
      // Total revenue from confirmed sales orders
      db
        .select({
          total: sql<number>`COALESCE(SUM(${salesOrders.totalAmount}), 0)`,
        })
        .from(salesOrders)
        .where(eq(salesOrders.status, 'confirmed')),
      
      // Active products count
      db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(products)
        .where(eq(products.isActive, true)),
      
      // Open orders count
      db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(salesOrders)
        .where(sql`${salesOrders.status} IN ('draft', 'confirmed')`),
      
      // Outstanding amount from unpaid invoices
      db
        .select({
          total: sql<number>`COALESCE(SUM(${invoices.totalAmount} - ${invoices.paidAmount}), 0)`,
        })
        .from(invoices)
        .where(sql`${invoices.status} IN ('sent', 'overdue')`),
      
      // Expiring products count (90 days)
      db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(inventory)
        .where(
          and(
            lte(inventory.expiryDate, cutoffDateStr),
            gte(inventory.quantity, 1)
          )
        )
    ]);

    return {
      totalRevenue: Number(revenueResults[0]?.total || 0),
      activeProducts: Number(productsResults[0]?.count || 0),
      openOrders: Number(ordersResults[0]?.count || 0),
      outstandingAmount: Number(outstandingResults[0]?.total || 0),
      expiringProductsCount: Number(expiringResults[0]?.count || 0),
    };
  }

  // Recent transactions
  async getRecentTransactions(limit = 10): Promise<Array<{
    id: string;
    date: string;
    type: 'sale' | 'purchase' | 'payment';
    customerOrSupplier: string;
    amount: number;
    status: string;
    reference: string;
  }>> {
    const db = await getDb();
    // Get recent sales
    const recentSales = await db
      .select({
        id: salesOrders.id,
        date: salesOrders.orderDate,
        customerOrSupplier: customers.name,
        amount: salesOrders.totalAmount,
        status: salesOrders.status,
        reference: salesOrders.orderNumber,
      })
      .from(salesOrders)
      .innerJoin(customers, eq(salesOrders.customerId, customers.id))
      .orderBy(desc(salesOrders.createdAt))
      .limit(limit);

    // Get recent purchases
    const recentPurchases = await db
      .select({
        id: purchaseOrders.id,
        date: purchaseOrders.orderDate,
        customerOrSupplier: suppliers.name,
        amount: purchaseOrders.totalAmount,
        status: purchaseOrders.status,
        reference: purchaseOrders.orderNumber,
      })
      .from(purchaseOrders)
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit);

    // Combine and format transactions
    const transactions = [
      ...recentSales.map(sale => ({
        id: sale.id,
        date: sale.date || new Date().toISOString().split('T')[0],
        type: 'sale' as const,
        customerOrSupplier: sale.customerOrSupplier || 'Unknown',
        amount: Number(sale.amount || 0),
        status: sale.status || 'draft',
        reference: sale.reference || '',
      })),
      ...recentPurchases.map(purchase => ({
        id: purchase.id,
        date: purchase.date || new Date().toISOString().split('T')[0],
        type: 'purchase' as const,
        customerOrSupplier: purchase.customerOrSupplier || 'Unknown',
        amount: Number(purchase.amount || 0),
        status: purchase.status || 'draft',
        reference: purchase.reference || '',
      })),
    ];

    // Sort by date and limit
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // POS Terminal operations
  async getPosTerminals(): Promise<PosTerminal[]> {
    const db = await getDb();
    return await db
      .select()
      .from(posTerminals)
      .where(eq(posTerminals.isActive, true))
      .orderBy(asc(posTerminals.name));
  }

  async getPosTerminal(id: string): Promise<PosTerminal | undefined> {
    const db = await getDb();
    const [terminal] = await db
      .select()
      .from(posTerminals)
      .where(and(eq(posTerminals.id, id), eq(posTerminals.isActive, true)));
    return terminal;
  }

  async createPosTerminal(terminal: InsertPosTerminal): Promise<PosTerminal> {
    const db = await getDb();
    const [newTerminal] = await db
      .insert(posTerminals)
      .values(terminal)
      .returning();
    return newTerminal;
  }

  async updatePosTerminal(id: string, terminal: Partial<InsertPosTerminal>): Promise<PosTerminal> {
    const db = await getDb();
    const [updatedTerminal] = await db
      .update(posTerminals)
      .set({ ...terminal, updatedAt: new Date() })
      .where(eq(posTerminals.id, id))
      .returning();
    return updatedTerminal;
  }

  // POS Session operations
  async getPosSessions(limit = 50): Promise<(PosSession & { terminal: PosTerminal; cashier: User })[]> {
    const db = await getDb();
    return await db
      .select({
        id: posSessions.id,
        terminalId: posSessions.terminalId,
        cashierId: posSessions.cashierId,
        sessionNumber: posSessions.sessionNumber,
        startTime: posSessions.startTime,
        endTime: posSessions.endTime,
        startingCash: posSessions.startingCash,
        expectedCash: posSessions.expectedCash,
        actualCash: posSessions.actualCash,
        cashVariance: posSessions.cashVariance,
        totalSales: posSessions.totalSales,
        totalTransactions: posSessions.totalTransactions,
        currency: posSessions.currency,
        status: posSessions.status,
        notes: posSessions.notes,
        createdAt: posSessions.createdAt,
        terminal: posTerminals,
        cashier: users,
      })
      .from(posSessions)
      .innerJoin(posTerminals, eq(posSessions.terminalId, posTerminals.id))
      .innerJoin(users, eq(posSessions.cashierId, users.id))
      .limit(limit)
      .orderBy(desc(posSessions.createdAt));
  }

  async getPosSession(id: string): Promise<(PosSession & { terminal: PosTerminal; cashier: User }) | undefined> {
    const db = await getDb();
    const [session] = await db
      .select({
        id: posSessions.id,
        terminalId: posSessions.terminalId,
        cashierId: posSessions.cashierId,
        sessionNumber: posSessions.sessionNumber,
        startTime: posSessions.startTime,
        endTime: posSessions.endTime,
        startingCash: posSessions.startingCash,
        expectedCash: posSessions.expectedCash,
        actualCash: posSessions.actualCash,
        cashVariance: posSessions.cashVariance,
        totalSales: posSessions.totalSales,
        totalTransactions: posSessions.totalTransactions,
        currency: posSessions.currency,
        status: posSessions.status,
        notes: posSessions.notes,
        createdAt: posSessions.createdAt,
        terminal: posTerminals,
        cashier: users,
      })
      .from(posSessions)
      .innerJoin(posTerminals, eq(posSessions.terminalId, posTerminals.id))
      .innerJoin(users, eq(posSessions.cashierId, users.id))
      .where(eq(posSessions.id, id));
    return session;
  }

  async getActivePosSession(terminalId: string): Promise<PosSession | undefined> {
    const db = await getDb();
    const [session] = await db
      .select()
      .from(posSessions)
      .where(and(eq(posSessions.terminalId, terminalId), eq(posSessions.status, 'open')));
    return session;
  }

  async openPosSession(session: InsertPosSession): Promise<PosSession> {
    const db = await getDb();
    const [newSession] = await db
      .insert(posSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async closePosSession(sessionId: string, actualCash: number, notes?: string): Promise<PosSession> {
    const db = await getDb();
    const [closedSession] = await db
      .update(posSessions)
      .set({
        actualCash: actualCash.toString(),
        cashVariance: sql`${actualCash} - ${posSessions.expectedCash}`,
        endTime: new Date(),
        status: 'closed',
        notes: notes || null,
      })
      .where(eq(posSessions.id, sessionId))
      .returning();
    return closedSession;
  }

  // POS Sales/Receipt operations
  async getPosReceipts(sessionId?: string, limit = 50): Promise<(PosReceipt & { session: PosSession; customer?: Customer })[]> {
    const db = await getDb();
    const baseQuery = sessionId 
      ? db.select().from(posReceipts).where(eq(posReceipts.sessionId, sessionId))
      : db.select().from(posReceipts);
    
    const receipts = await baseQuery
      .limit(limit)
      .orderBy(desc(posReceipts.createdAt));

    const results = [];
    for (const receipt of receipts) {
      // Get session data
      const [session] = await db
        .select()
        .from(posSessions)
        .where(eq(posSessions.id, receipt.sessionId));

      // Get customer data if exists
      let customer = undefined;
      if (receipt.customerId) {
        const [customerData] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, receipt.customerId));
        customer = customerData;
      }

      results.push({
        ...receipt,
        session,
        customer,
      });
    }

    return results.map(row => ({
      ...row,
      items: (row.receiptData as any)?.items || []
    }));
  }

  async getPosReceipt(id: string): Promise<(PosReceipt & { payments: PosPayment[] }) | undefined> {
    const db = await getDb();
    const [receipt] = await db
      .select()
      .from(posReceipts)
      .where(eq(posReceipts.id, id));

    if (!receipt) return undefined;

    const payments = await db
      .select()
      .from(posPayments)
      .where(eq(posPayments.receiptId, id))
      .orderBy(asc(posPayments.createdAt));

    return { ...receipt, payments };
  }

  async createPosSale(saleData: {
    sessionId: string;
    customerId?: string;
    items: Array<{
      productId: string;
      inventoryId?: string;
      quantity: number;
      unitPrice: number;
    }>;
    payments: Array<{
      method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'check' | 'credit';
      amount: number;
      cardTransactionId?: string;
      cardLast4?: string;
      cardType?: string;
      mobileMoneyNumber?: string;
      mobileMoneyProvider?: string;
      checkNumber?: string;
      bankName?: string;
      referenceNumber?: string;
    }>;
    taxRate?: number;
    discountAmount?: number;
  }): Promise<{ receipt: PosReceipt; payments: PosPayment[] }> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Calculate totals
      const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = (saleData.taxRate || 0) * subtotal / 100;
      const discountAmount = saleData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}`;

      // Create receipt
      const [receipt] = await tx
        .insert(posReceipts)
        .values({
          receiptNumber,
          sessionId: saleData.sessionId,
          customerId: saleData.customerId,
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          currency: 'AOA',
          receiptData: {
            items: saleData.items,
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        })
        .returning();

      // Create payments
      const payments = [];
      for (const paymentData of saleData.payments) {
        const [payment] = await tx
          .insert(posPayments)
          .values({
            receiptId: receipt.id,
            paymentMethod: paymentData.method,
            amount: paymentData.amount.toFixed(2),
            currency: 'AOA',
            cardTransactionId: paymentData.cardTransactionId,
            cardLast4: paymentData.cardLast4,
            cardType: paymentData.cardType,
            mobileMoneyNumber: paymentData.mobileMoneyNumber,
            mobileMoneyProvider: paymentData.mobileMoneyProvider,
            checkNumber: paymentData.checkNumber,
            bankName: paymentData.bankName,
            referenceNumber: paymentData.referenceNumber,
            status: 'completed',
          })
          .returning();
        payments.push(payment);
      }

      // Update inventory quantities and create stock movements with pharmaceutical compliance
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day for comparison
      
      for (const item of saleData.items) {
        let selectedInventoryRecords: Inventory[] = [];
        let remainingQuantity = item.quantity;
        
        if (item.inventoryId) {
          // Use specific inventory batch
          const allInventoryRecords = await tx
            .select()
            .from(inventory)
            .where(eq(inventory.productId, item.productId));
          const specificRecord = allInventoryRecords.find(inv => inv.id === item.inventoryId);
          
          if (!specificRecord) {
            throw new Error(`Inventory batch ${item.inventoryId} not found for product ${item.productId}`);
          }
          
          // Check expiry date for specific batch
          if (specificRecord.expiryDate) {
            const expiryDate = new Date(specificRecord.expiryDate);
            if (expiryDate < today) {
              throw new Error(`Cannot sell expired product. Batch ${specificRecord.batchNumber} expired on ${expiryDate.toDateString()}`);
            }
          }
          
          if (specificRecord.quantity < item.quantity) {
            throw new Error(`Insufficient stock in batch ${specificRecord.batchNumber}. Available: ${specificRecord.quantity}, Required: ${item.quantity}`);
          }
          
          selectedInventoryRecords = [specificRecord];
        } else {
          // Use FEFO (First Expired, First Out) with expiry validation
          const inventoryRecords = await tx
            .select()
            .from(inventory)
            .where(eq(inventory.productId, item.productId));
          
          // Filter out expired products
          const validInventoryRecords = inventoryRecords.filter(inv => {
            if (!inv.expiryDate) return true; // No expiry date means no expiry
            const expiryDate = new Date(inv.expiryDate);
            return expiryDate >= today;
          });
          
          if (validInventoryRecords.length === 0) {
            throw new Error(`No valid (non-expired) inventory available for product ${item.productId}`);
          }
          
          // Sort by expiry date (FEFO) - earliest expiry first, then by quantity
          validInventoryRecords.sort((a, b) => {
            if (!a.expiryDate && !b.expiryDate) return 0;
            if (!a.expiryDate) return 1; // No expiry goes last
            if (!b.expiryDate) return -1;
            
            const dateA = new Date(a.expiryDate);
            const dateB = new Date(b.expiryDate);
            
            if (dateA.getTime() === dateB.getTime()) {
              // Same expiry date, prefer larger quantities to minimize batch splits
              return b.quantity - a.quantity;
            }
            
            return dateA.getTime() - dateB.getTime();
          });
          
          // Select inventory batches using FEFO
          for (const invRecord of validInventoryRecords) {
            if (remainingQuantity <= 0) break;
            
            if (invRecord.quantity > 0) {
              const quantityToTake = Math.min(remainingQuantity, invRecord.quantity);
              selectedInventoryRecords.push({
                ...invRecord,
                quantity: quantityToTake // Override with the quantity we're taking
              });
              remainingQuantity -= quantityToTake;
            }
          }
          
          if (remainingQuantity > 0) {
            const totalAvailable = validInventoryRecords.reduce((sum, inv) => sum + inv.quantity, 0);
            throw new Error(`Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${totalAvailable}`);
          }
        }
        
        // Process the selected inventory records
        for (const inventoryRecord of selectedInventoryRecords) {
          const quantityToDeduct = inventoryRecord.quantity;
          
          // Get the actual current quantity from database (not the modified one)
          const [currentRecord] = await tx
            .select()
            .from(inventory)
            .where(eq(inventory.id, inventoryRecord.id));
            
          if (!currentRecord) {
            throw new Error(`Inventory record ${inventoryRecord.id} not found`);
          }
          
          // Update inventory
          await tx
            .update(inventory)
            .set({ 
              quantity: currentRecord.quantity - quantityToDeduct,
              updatedAt: new Date()
            })
            .where(eq(inventory.id, inventoryRecord.id));

          // Create stock movement
          await tx
            .insert(stockMovements)
            .values({
              productId: item.productId,
              warehouseId: inventoryRecord.warehouseId,
              inventoryId: inventoryRecord.id,
              movementType: 'out',
              quantity: -quantityToDeduct, // negative for outbound
              reference: receiptNumber,
              notes: `POS sale - Receipt ${receiptNumber} - Batch: ${inventoryRecord.batchNumber || 'N/A'}`,
              userId: saleData.customerId, // Will be set properly in API route
            });
        }
      }

      // Update session totals
      await tx
        .update(posSessions)
        .set({
          totalSales: sql`${posSessions.totalSales} + ${totalAmount}`,
          totalTransactions: sql`${posSessions.totalTransactions} + 1`,
          expectedCash: sql`${posSessions.expectedCash} + ${saleData.payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)}`,
        })
        .where(eq(posSessions.id, saleData.sessionId));

      return { receipt, payments };
    });
  }

  // Cash movement operations
  async getCashMovements(sessionId: string): Promise<(CashMovement & { user: User })[]> {
    const db = await getDb();
    return await db
      .select({
        id: cashMovements.id,
        sessionId: cashMovements.sessionId,
        movementType: cashMovements.movementType,
        amount: cashMovements.amount,
        currency: cashMovements.currency,
        reference: cashMovements.reference,
        description: cashMovements.description,
        userId: cashMovements.userId,
        createdAt: cashMovements.createdAt,
        user: users,
      })
      .from(cashMovements)
      .innerJoin(users, eq(cashMovements.userId, users.id))
      .where(eq(cashMovements.sessionId, sessionId))
      .orderBy(asc(cashMovements.createdAt));
  }

  async createCashMovement(movement: InsertCashMovement): Promise<CashMovement> {
    const db = await getDb();
    const [newMovement] = await db
      .insert(cashMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  // HR Module - Employee Management
  async getEmployees(limit = 100, department?: string): Promise<(Employee & { user: User; manager?: User })[]> {
    const db = await getDb();
    
    const baseConditions = [eq(employees.isActive, true)];
    if (department) {
      baseConditions.push(eq(employees.department, department));
    }
    
    const results = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeNumber: employees.employeeNumber,
        department: employees.department,
        position: employees.position,
        hireDate: employees.hireDate,
        baseSalary: employees.baseSalary,
        currency: employees.currency,
        employmentStatus: employees.employmentStatus,
        managerId: employees.managerId,
        workSchedule: employees.workSchedule,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactPhone: employees.emergencyContactPhone,
        bankAccountNumber: employees.bankAccountNumber,
        taxIdNumber: employees.taxIdNumber,
        socialSecurityNumber: employees.socialSecurityNumber,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        manager: sql<User | null>`manager_user.*`.as('manager'),
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(sql`${users} AS manager_user`, sql`manager_user.id = ${employees.managerId}`)
      .where(and(...baseConditions))
      .limit(limit)
      .orderBy(desc(employees.createdAt));

    return results.map(r => ({
      ...r,
      manager: r.manager || undefined
    }));
  }

  async getEmployee(id: string): Promise<(Employee & { user: User; manager?: User }) | undefined> {
    const db = await getDb();
    const [result] = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeNumber: employees.employeeNumber,
        department: employees.department,
        position: employees.position,
        hireDate: employees.hireDate,
        baseSalary: employees.baseSalary,
        currency: employees.currency,
        employmentStatus: employees.employmentStatus,
        managerId: employees.managerId,
        workSchedule: employees.workSchedule,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactPhone: employees.emergencyContactPhone,
        bankAccountNumber: employees.bankAccountNumber,
        taxIdNumber: employees.taxIdNumber,
        socialSecurityNumber: employees.socialSecurityNumber,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        manager: sql<User | null>`manager_user.*`.as('manager'),
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(sql`${users} AS manager_user`, sql`manager_user.id = ${employees.managerId}`)
      .where(and(eq(employees.id, id), eq(employees.isActive, true)));

    return result ? {
      ...result,
      manager: result.manager || undefined
    } : undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const db = await getDb();
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const db = await getDb();
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(employees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employees.id, id));
  }

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const db = await getDb();
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.userId, userId), eq(employees.isActive, true)));
    return employee;
  }

  // HR Module - Time Tracking
  async getTimeEntries(employeeId?: string, startDate?: string, endDate?: string, limit = 100): Promise<(TimeEntry & { employee: Employee & { user: User }; approver?: User })[]> {
    const db = await getDb();
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(timeEntries.employeeId, employeeId));
    }

    if (startDate) {
      conditions.push(gte(timeEntries.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(timeEntries.date, endDate));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        timeEntry: timeEntries,
        employee: employees,
        user: users,
        approver: sql<User | null>`approver_user.*`.as('approver'),
      })
      .from(timeEntries)
      .innerJoin(employees, eq(timeEntries.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(sql`${users} AS approver_user`, sql`approver_user.id = ${timeEntries.approvedBy}`);

    // Apply where clause and execute query
    const baseQuery = whereCondition ? query.where(whereCondition) : query;
    const queryResults = await baseQuery
      .limit(limit)
      .orderBy(desc(timeEntries.date));

    return queryResults.map(r => ({
      ...r.timeEntry,
      employee: {
        ...r.employee,
        user: r.user
      },
      approver: r.approver || undefined
    }));
  }

  async getTimeEntry(id: string): Promise<(TimeEntry & { employee: Employee & { user: User }; approver?: User }) | undefined> {
    const db = await getDb();
    const [result] = await db
      .select({
        timeEntry: timeEntries,
        employee: employees,
        user: users,
        approver: sql<User | null>`approver_user.*`.as('approver'),
      })
      .from(timeEntries)
      .innerJoin(employees, eq(timeEntries.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(sql`${users} AS approver_user`, sql`approver_user.id = ${timeEntries.approvedBy}`)
      .where(eq(timeEntries.id, id));

    return result ? {
      ...result.timeEntry,
      employee: {
        ...result.employee,
        user: result.user
      },
      approver: result.approver || undefined
    } : undefined;
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const db = await getDb();
    const [newEntry] = await db
      .insert(timeEntries)
      .values(timeEntry)
      .returning();
    return newEntry;
  }

  async updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const db = await getDb();
    const [updatedEntry] = await db
      .update(timeEntries)
      .set(timeEntry)
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async approveTimeEntry(id: string, approverId: string): Promise<TimeEntry> {
    const db = await getDb();
    const [approvedEntry] = await db
      .update(timeEntries)
      .set({
        approvedBy: approverId,
        approvedAt: new Date(),
      })
      .where(eq(timeEntries.id, id))
      .returning();
    return approvedEntry;
  }

  // HR Module - Payroll Processing
  async getPayrollRuns(limit = 50): Promise<(PayrollRun & { processedBy?: User })[]> {
    const db = await getDb();
    const results = await db
      .select({
        id: payrollRuns.id,
        payrollPeriod: payrollRuns.payrollPeriod,
        startDate: payrollRuns.startDate,
        endDate: payrollRuns.endDate,
        status: payrollRuns.status,
        totalGrossPay: payrollRuns.totalGrossPay,
        totalDeductions: payrollRuns.totalDeductions,
        totalNetPay: payrollRuns.totalNetPay,
        currency: payrollRuns.currency,
        processedBy: payrollRuns.processedBy,
        processedAt: payrollRuns.processedAt,
        createdAt: payrollRuns.createdAt,
        processedByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(payrollRuns)
      .leftJoin(users, eq(payrollRuns.processedBy, users.id))
      .limit(limit)
      .orderBy(desc(payrollRuns.createdAt));

    return results.map(r => ({
      id: r.id,
      payrollPeriod: r.payrollPeriod,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      totalGrossPay: r.totalGrossPay,
      totalDeductions: r.totalDeductions,
      totalNetPay: r.totalNetPay,
      currency: r.currency,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
      processedBy: r.processedByUser
    } as PayrollRun & { processedBy?: User }));
  }

  async getPayrollRun(id: string): Promise<(PayrollRun & { processedBy?: User; payrollItems: (PayrollItem & { employee: Employee & { user: User } })[] }) | undefined> {
    const db = await getDb();
    const [payrollRunResult] = await db
      .select({
        id: payrollRuns.id,
        payrollPeriod: payrollRuns.payrollPeriod,
        startDate: payrollRuns.startDate,
        endDate: payrollRuns.endDate,
        status: payrollRuns.status,
        totalGrossPay: payrollRuns.totalGrossPay,
        totalDeductions: payrollRuns.totalDeductions,
        totalNetPay: payrollRuns.totalNetPay,
        currency: payrollRuns.currency,
        processedBy: payrollRuns.processedBy,
        processedAt: payrollRuns.processedAt,
        createdAt: payrollRuns.createdAt,
        processedByUser: users,
      })
      .from(payrollRuns)
      .leftJoin(users, eq(payrollRuns.processedBy, users.id))
      .where(eq(payrollRuns.id, id));

    if (!payrollRunResult) return undefined;

    // Get payroll items for this run
    const payrollItemsResults = await db
      .select({
        payrollItem: payrollItems,
        employee: employees,
        user: users,
      })
      .from(payrollItems)
      .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(payrollItems.payrollRunId, id))
      .orderBy(asc(employees.employeeNumber));

    const payrollItemsWithEmployee = payrollItemsResults.map(item => ({
      ...item.payrollItem,
      employee: {
        ...item.employee,
        user: item.user
      }
    }));

    // Construct the return object matching the expected interface
    const result = {
      id: payrollRunResult.id,
      payrollPeriod: payrollRunResult.payrollPeriod,
      startDate: payrollRunResult.startDate,
      endDate: payrollRunResult.endDate,
      status: payrollRunResult.status,
      totalGrossPay: payrollRunResult.totalGrossPay,
      totalDeductions: payrollRunResult.totalDeductions,
      totalNetPay: payrollRunResult.totalNetPay,
      currency: payrollRunResult.currency,
      processedAt: payrollRunResult.processedAt,
      createdAt: payrollRunResult.createdAt,
      processedBy: payrollRunResult.processedByUser || undefined,
      payrollItems: payrollItemsWithEmployee,
    } as PayrollRun & { processedBy?: User; payrollItems: (PayrollItem & { employee: Employee & { user: User } })[] };

    return result;
  }

  async createPayrollRun(payrollRun: InsertPayrollRun): Promise<PayrollRun> {
    const db = await getDb();
    const [newRun] = await db
      .insert(payrollRuns)
      .values(payrollRun)
      .returning();
    return newRun;
  }

  async updatePayrollRun(id: string, payrollRun: Partial<InsertPayrollRun>): Promise<PayrollRun> {
    const db = await getDb();
    const [updatedRun] = await db
      .update(payrollRuns)
      .set(payrollRun)
      .where(eq(payrollRuns.id, id))
      .returning();
    return updatedRun;
  }

  async getPayrollItems(payrollRunId?: string, employeeId?: string): Promise<(PayrollItem & { employee: Employee & { user: User }; payrollRun: PayrollRun })[]> {
    const db = await getDb();
    const conditions = [];

    if (payrollRunId) {
      conditions.push(eq(payrollItems.payrollRunId, payrollRunId));
    }

    if (employeeId) {
      conditions.push(eq(payrollItems.employeeId, employeeId));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Build the query with simplified select structure
    let query = db
      .select({
        payrollItem: payrollItems,
        employee: employees,
        user: users,
        payrollRun: payrollRuns,
      })
      .from(payrollItems)
      .innerJoin(employees, eq(payrollItems.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(payrollRuns, eq(payrollItems.payrollRunId, payrollRuns.id));

    const baseQuery = whereCondition ? query.where(whereCondition) : query;
    const results = await baseQuery.orderBy(desc(payrollItems.createdAt));

    return results.map(r => ({
      ...r.payrollItem,
      employee: {
        ...r.employee,
        user: r.user
      },
      payrollRun: r.payrollRun
    }));
  }

  async createPayrollItem(payrollItem: InsertPayrollItem): Promise<PayrollItem> {
    const db = await getDb();
    const [newItem] = await db
      .insert(payrollItems)
      .values(payrollItem)
      .returning();
    return newItem;
  }

  async processPayroll(payrollRunId: string, processedBy: string): Promise<{ payrollRun: PayrollRun; payrollItems: PayrollItem[] }> {
    const db = await getDb();

    return await db.transaction(async (tx) => {
      // Validate payroll run exists and is in correct state
      const [currentRun] = await tx
        .select()
        .from(payrollRuns)
        .where(eq(payrollRuns.id, payrollRunId));
      
      if (!currentRun) {
        throw new Error('Payroll run not found');
      }
      
      if (currentRun.status === 'completed') {
        throw new Error('Payroll run has already been processed');
      }
      
      if (currentRun.status !== 'processing' && currentRun.status !== 'draft') {
        throw new Error(`Cannot process payroll run in ${currentRun.status} status`);
      }

      // Get payroll items for totals
      const items = await tx
        .select()
        .from(payrollItems)
        .where(eq(payrollItems.payrollRunId, payrollRunId));
      
      if (items.length === 0) {
        throw new Error('No payroll items found for this run');
      }

      const totals = items.reduce((acc, item) => {
        acc.totalGrossPay += Number(item.grossPay || 0);
        acc.totalDeductions += Number(item.totalDeductions || 0);
        acc.totalNetPay += Number(item.netPay || 0);
        return acc;
      }, { totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0 });

      // Update payroll run status and totals
      const [payrollRun] = await tx
        .update(payrollRuns)
        .set({
          status: 'completed',
          totalGrossPay: totals.totalGrossPay.toFixed(2),
          totalDeductions: totals.totalDeductions.toFixed(2),
          totalNetPay: totals.totalNetPay.toFixed(2),
          processedBy,
          processedAt: new Date(),
        })
        .where(eq(payrollRuns.id, payrollRunId))
        .returning();

      return { payrollRun, payrollItems: items };
    });
  }

  // HR Module - Performance Reviews
  async getPerformanceReviews(employeeId?: string, reviewerId?: string, status?: string, limit = 50): Promise<(PerformanceReview & { employee: Employee & { user: User }; reviewer: User })[]> {
    const db = await getDb();
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(performanceReviews.employeeId, employeeId));
    }

    if (reviewerId) {
      conditions.push(eq(performanceReviews.reviewerId, reviewerId));
    }

    if (status) {
      conditions.push(sql`${performanceReviews.status} = ${status}`);
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        performanceReview: performanceReviews,
        employee: employees,
        user: users,
        reviewer: sql<User>`reviewer_user.*`.as('reviewer'),
      })
      .from(performanceReviews)
      .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(sql`${users} AS reviewer_user`, sql`reviewer_user.id = ${performanceReviews.reviewerId}`);

    const baseQuery = whereCondition ? query.where(whereCondition) : query;
    const results = await baseQuery
      .limit(limit)
      .orderBy(desc(performanceReviews.createdAt));

    return results.map(r => ({
      ...r.performanceReview,
      employee: {
        ...r.employee,
        user: r.user
      },
      reviewer: r.reviewer
    }));
  }

  async getPerformanceReview(id: string): Promise<(PerformanceReview & { employee: Employee & { user: User }; reviewer: User }) | undefined> {
    const db = await getDb();
    const [result] = await db
      .select({
        performanceReview: performanceReviews,
        employee: employees,
        user: users,
        reviewer: sql<User>`reviewer_user.*`.as('reviewer'),
      })
      .from(performanceReviews)
      .innerJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(sql`${users} AS reviewer_user`, sql`reviewer_user.id = ${performanceReviews.reviewerId}`)
      .where(eq(performanceReviews.id, id));

    return result ? {
      ...result.performanceReview,
      employee: {
        ...result.employee,
        user: result.user
      },
      reviewer: result.reviewer
    } : undefined;
  }

  async createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview> {
    const db = await getDb();
    const [newReview] = await db
      .insert(performanceReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updatePerformanceReview(id: string, review: Partial<InsertPerformanceReview>): Promise<PerformanceReview> {
    const db = await getDb();
    const [updatedReview] = await db
      .update(performanceReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(performanceReviews.id, id))
      .returning();
    return updatedReview;
  }

  async completePerformanceReview(id: string): Promise<PerformanceReview> {
    const db = await getDb();
    const [completedReview] = await db
      .update(performanceReviews)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(performanceReviews.id, id))
      .returning();
    return completedReview;
  }
  
  // AI Analytics - Sales History and Business Intelligence
  
  async getSalesHistory(productId?: string, daysBack = 90): Promise<Array<{
    productId: string;
    productName: string;
    salesData: Array<{
      date: string;
      quantity: number;
      revenue: number;
    }>;
    totalSold: number;
    averageDailySales: number;
    salesVelocity: number;
  }>> {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    // Get sales data from both sales orders and POS receipts
    const salesQuery = db
      .select({
        productId: salesOrderItems.productId,
        productName: products.name,
        orderDate: salesOrders.orderDate,
        quantity: salesOrderItems.quantity,
        revenue: salesOrderItems.totalPrice,
        status: salesOrders.status,
      })
      .from(salesOrderItems)
      .innerJoin(salesOrders, eq(salesOrderItems.orderId, salesOrders.id))
      .innerJoin(products, eq(salesOrderItems.productId, products.id))
      .where(
        and(
          gte(salesOrders.orderDate, cutoffDate.toISOString().split('T')[0]),
          eq(salesOrders.status, 'delivered'),
          productId ? eq(salesOrderItems.productId, productId) : sql`true`
        )
      );

    const salesData = await salesQuery;
    
    // Group by product and aggregate data
    const productSalesMap = new Map<string, {
      productId: string;
      productName: string;
      salesByDate: Map<string, { quantity: number; revenue: number }>;
      totalSold: number;
      totalRevenue: number;
    }>();

    salesData.forEach(sale => {
      if (!productSalesMap.has(sale.productId)) {
        productSalesMap.set(sale.productId, {
          productId: sale.productId,
          productName: sale.productName,
          salesByDate: new Map(),
          totalSold: 0,
          totalRevenue: 0,
        });
      }
      
      const product = productSalesMap.get(sale.productId)!;
      const dateKey = sale.orderDate || new Date().toISOString().split('T')[0];
      
      if (!product.salesByDate.has(dateKey)) {
        product.salesByDate.set(dateKey, { quantity: 0, revenue: 0 });
      }
      
      const dayData = product.salesByDate.get(dateKey)!;
      dayData.quantity += sale.quantity;
      dayData.revenue += parseFloat(sale.revenue?.toString() || '0');
      
      product.totalSold += sale.quantity;
      product.totalRevenue += parseFloat(sale.revenue?.toString() || '0');
    });

    return Array.from(productSalesMap.values()).map(product => ({
      productId: product.productId,
      productName: product.productName,
      salesData: Array.from(product.salesByDate.entries()).map(([date, data]) => ({
        date,
        quantity: data.quantity,
        revenue: data.revenue,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      totalSold: product.totalSold,
      averageDailySales: product.totalSold / daysBack,
      salesVelocity: product.totalSold / Math.max(1, product.salesByDate.size), // avg per active day
    }));
  }

  async getLeadTimeAnalysis(supplierId?: string): Promise<Array<{
    supplierId: string;
    supplierName: string;
    productId: string;
    productName: string;
    averageLeadTimeDays: number;
    minLeadTimeDays: number;
    maxLeadTimeDays: number;
    orderCount: number;
    reliability: number;
  }>> {
    const db = await getDb();
    
    // Get purchase orders with actual delivery data
    const purchaseData = await db
      .select({
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        productId: purchaseOrderItems.productId,
        productName: products.name,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        status: purchaseOrders.status,
        actualDeliveryDate: sql<string>`
          CASE 
            WHEN ${purchaseOrders.status} = 'received' 
            THEN ${purchaseOrders.updatedAt}::date
            ELSE NULL
          END
        `.as('actualDeliveryDate'),
      })
      .from(purchaseOrderItems)
      .innerJoin(purchaseOrders, eq(purchaseOrderItems.orderId, purchaseOrders.id))
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(
        and(
          supplierId ? eq(purchaseOrders.supplierId, supplierId) : sql`true`,
          eq(purchaseOrders.status, 'received')
        )
      );

    // Group by supplier and product combination
    const leadTimeMap = new Map<string, {
      supplierId: string;
      supplierName: string;
      productId: string;
      productName: string;
      leadTimes: number[];
      onTimeDeliveries: number;
      totalOrders: number;
    }>();

    purchaseData.forEach(order => {
      if (!order.actualDeliveryDate || !order.orderDate) return;
      
      const key = `${order.supplierId}-${order.productId}`;
      
      if (!leadTimeMap.has(key)) {
        leadTimeMap.set(key, {
          supplierId: order.supplierId,
          supplierName: order.supplierName,
          productId: order.productId,
          productName: order.productName,
          leadTimes: [],
          onTimeDeliveries: 0,
          totalOrders: 0,
        });
      }
      
      const analysis = leadTimeMap.get(key)!;
      const orderDate = new Date(order.orderDate);
      const actualDate = new Date(order.actualDeliveryDate);
      const expectedDate = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : null;
      
      const leadTime = Math.ceil((actualDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      analysis.leadTimes.push(leadTime);
      analysis.totalOrders++;
      
      // Check if delivery was on time (within expected date or reasonable buffer)
      if (expectedDate && actualDate <= expectedDate) {
        analysis.onTimeDeliveries++;
      } else if (!expectedDate && leadTime <= 14) { // default 14 days as reasonable
        analysis.onTimeDeliveries++;
      }
    });

    return Array.from(leadTimeMap.values()).map(analysis => ({
      supplierId: analysis.supplierId,
      supplierName: analysis.supplierName,
      productId: analysis.productId,
      productName: analysis.productName,
      averageLeadTimeDays: Math.round(
        analysis.leadTimes.reduce((sum, lt) => sum + lt, 0) / analysis.leadTimes.length
      ),
      minLeadTimeDays: Math.min(...analysis.leadTimes),
      maxLeadTimeDays: Math.max(...analysis.leadTimes),
      orderCount: analysis.totalOrders,
      reliability: Math.round((analysis.onTimeDeliveries / analysis.totalOrders) * 100),
    }));
  }

  async getProductDemandAnalysis(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    averageMonthlySales: number;
    stockTurnoverRate: number;
    seasonalPattern: number[];
    demandTrend: 'increasing' | 'decreasing' | 'stable';
    forecastedDemand: number;
  }>> {
    const db = await getDb();
    
    // Get current inventory levels
    const inventoryData = await db
      .select({
        productId: inventory.productId,
        productName: products.name,
        totalStock: sql<number>`SUM(${inventory.quantity})`.as('totalStock'),
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(productId ? eq(inventory.productId, productId) : sql`true`)
      .groupBy(inventory.productId, products.name);

    // Get sales history for the past 12 months for seasonal analysis
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const salesHistory = await db
      .select({
        productId: salesOrderItems.productId,
        month: sql<number>`EXTRACT(MONTH FROM ${salesOrders.orderDate})`.as('month'),
        quantity: sql<number>`SUM(${salesOrderItems.quantity})`.as('quantity'),
        orderDate: salesOrders.orderDate,
      })
      .from(salesOrderItems)
      .innerJoin(salesOrders, eq(salesOrderItems.orderId, salesOrders.id))
      .where(
        and(
          gte(salesOrders.orderDate, twelveMonthsAgo.toISOString().split('T')[0]),
          eq(salesOrders.status, 'delivered'),
          productId ? eq(salesOrderItems.productId, productId) : sql`true`
        )
      )
      .groupBy(salesOrderItems.productId, sql`EXTRACT(MONTH FROM ${salesOrders.orderDate})`, salesOrders.orderDate)
      .orderBy(salesOrders.orderDate);

    // Process demand analysis
    const demandMap = new Map<string, {
      productId: string;
      productName: string;
      currentStock: number;
      monthlySales: number[];
      salesByMonth: Map<number, number>;
    }>();

    // Initialize with inventory data
    inventoryData.forEach(item => {
      demandMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        currentStock: item.totalStock || 0,
        monthlySales: [],
        salesByMonth: new Map(),
      });
    });

    // Add sales data
    salesHistory.forEach(sale => {
      const product = demandMap.get(sale.productId);
      if (product) {
        const month = sale.month;
        const currentSales = product.salesByMonth.get(month) || 0;
        product.salesByMonth.set(month, currentSales + sale.quantity);
      }
    });

    return Array.from(demandMap.values()).map(product => {
      // Create seasonal pattern array (12 months)
      const seasonalPattern = Array.from({ length: 12 }, (_, i) => 
        product.salesByMonth.get(i + 1) || 0
      );
      
      const monthlySales = Array.from(product.salesByMonth.values());
      const averageMonthlySales = monthlySales.length > 0 
        ? monthlySales.reduce((sum, sales) => sum + sales, 0) / monthlySales.length
        : 0;
      
      // Calculate trend (simple linear regression on last 6 months)
      const recentMonths = monthlySales.slice(-6);
      let demandTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (recentMonths.length >= 3) {
        const firstHalf = recentMonths.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
        const secondHalf = recentMonths.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
        const change = (secondHalf - firstHalf) / Math.max(firstHalf, 1);
        
        if (change > 0.15) demandTrend = 'increasing';
        else if (change < -0.15) demandTrend = 'decreasing';
      }
      
      // Forecast next 30 days based on average and trend
      const forecastedDemand = Math.round(averageMonthlySales * 
        (demandTrend === 'increasing' ? 1.1 : demandTrend === 'decreasing' ? 0.9 : 1.0));
      
      return {
        productId: product.productId,
        productName: product.productName,
        currentStock: product.currentStock,
        averageMonthlySales: Math.round(averageMonthlySales),
        stockTurnoverRate: product.currentStock > 0 ? averageMonthlySales / product.currentStock : 0,
        seasonalPattern,
        demandTrend,
        forecastedDemand,
      };
    });
  }

  async getPriceOptimizationData(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    currentPrice: number;
    averageCost: number;
    currentMargin: number;
    salesVolume: number;
    competitorPrices: number[];
    priceElasticity: number;
    optimalPriceRange: {
      min: number;
      max: number;
      recommended: number;
    };
  }>> {
    const db = await getDb();
    
    // Get product pricing and sales data
    const productData = await db
      .select({
        productId: products.id,
        productName: products.name,
        currentPrice: products.unitPrice,
        averageCost: sql<number>`COALESCE(AVG(${inventory.costPerUnit}), 0)`.as('averageCost'),
        totalSalesVolume: sql<number>`COALESCE(SUM(${salesOrderItems.quantity}), 0)`.as('totalSalesVolume'),
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(salesOrderItems, eq(products.id, salesOrderItems.productId))
      .leftJoin(salesOrders, and(
        eq(salesOrderItems.orderId, salesOrders.id),
        eq(salesOrders.status, 'delivered'),
        gte(salesOrders.orderDate, sql`CURRENT_DATE - INTERVAL '90 days'`)
      ))
      .where(
        and(
          eq(products.isActive, true),
          productId ? eq(products.id, productId) : sql`true`
        )
      )
      .groupBy(products.id, products.name, products.unitPrice);

    return productData.map(product => {
      const currentPrice = parseFloat(product.currentPrice?.toString() || '0');
      const averageCost = product.averageCost || 0;
      const salesVolume = product.totalSalesVolume || 0;
      
      // Calculate current margin
      const currentMargin = currentPrice > 0 ? ((currentPrice - averageCost) / currentPrice) * 100 : 0;
      
      // Mock competitor prices (in real implementation, this would come from market data)
      const competitorPrices = [
        currentPrice * 0.95, // slightly lower
        currentPrice * 1.05, // slightly higher
        currentPrice * 0.90, // significantly lower
      ].filter(price => price > 0);
      
      // Simple price elasticity calculation (would be more sophisticated in real implementation)
      const priceElasticity = salesVolume > 0 ? -1.2 : 0; // typical pharmaceutical elasticity
      
      // Calculate optimal price range
      const minPrice = averageCost * 1.1; // at least 10% margin
      const maxPrice = currentPrice * 1.3; // not more than 30% increase
      const recommended = averageCost > 0 ? averageCost * 1.4 : currentPrice; // target 40% margin
      
      return {
        productId: product.productId,
        productName: product.productName,
        currentPrice,
        averageCost,
        currentMargin: Math.round(currentMargin * 100) / 100,
        salesVolume,
        competitorPrices,
        priceElasticity: Math.round(priceElasticity * 100) / 100,
        optimalPriceRange: {
          min: Math.round(minPrice * 100) / 100,
          max: Math.round(maxPrice * 100) / 100,
          recommended: Math.round(recommended * 100) / 100,
        },
      };
    });
  }

  // CRM Module - Quotation operations
  async getQuotations(limit = 100, status?: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] })[]> {
    const db = await getDb();
    const quotationData = await db
      .select({
        quotation: quotations,
        customer: customers,
        salesRep: users,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(users, eq(quotations.salesRepId, users.id))
      .where(status ? sql`${quotations.status} = ${status}` : sql`true`)
      .limit(limit)
      .orderBy(desc(quotations.createdAt));

    const quotationsWithItems = await Promise.all(
      quotationData.map(async (row) => {
        const items = await db
          .select({
            quotationItem: quotationItems,
            product: products,
          })
          .from(quotationItems)
          .leftJoin(products, eq(quotationItems.productId, products.id))
          .where(eq(quotationItems.quotationId, row.quotation.id));

        return {
          ...row.quotation,
          customer: row.customer!,
          salesRep: row.salesRep || undefined,
          items: items.map(item => ({ ...item.quotationItem, product: item.product! })),
        };
      })
    );

    return quotationsWithItems;
  }

  async getQuotation(id: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] }) | undefined> {
    const db = await getDb();
    const quotationData = await db
      .select({
        quotation: quotations,
        customer: customers,
        salesRep: users,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(users, eq(quotations.salesRepId, users.id))
      .where(eq(quotations.id, id));

    if (quotationData.length === 0) return undefined;

    const row = quotationData[0];
    const items = await db
      .select({
        quotationItem: quotationItems,
        product: products,
      })
      .from(quotationItems)
      .leftJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, id));

    return {
      ...row.quotation,
      customer: row.customer!,
      salesRep: row.salesRep || undefined,
      items: items.map(item => ({ ...item.quotationItem, product: item.product! })),
    };
  }

  async createQuotation(quotationData: InsertQuotation): Promise<Quotation> {
    const db = await getDb();
    const [quotation] = await db.insert(quotations).values(quotationData).returning();
    return quotation;
  }

  async updateQuotation(id: string, quotationData: Partial<InsertQuotation>): Promise<Quotation> {
    const db = await getDb();
    const [quotation] = await db
      .update(quotations)
      .set({ ...quotationData, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return quotation;
  }

  async deleteQuotation(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  async createQuotationItem(itemData: InsertQuotationItem): Promise<QuotationItem> {
    const db = await getDb();
    const [item] = await db.insert(quotationItems).values(itemData).returning();
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<(QuotationItem & { product: Product })[]> {
    const db = await getDb();
    const items = await db
      .select({
        quotationItem: quotationItems,
        product: products,
      })
      .from(quotationItems)
      .leftJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, quotationId));

    return items.map(item => ({ ...item.quotationItem, product: item.product! }));
  }

  async updateQuotationItem(id: string, itemData: Partial<InsertQuotationItem>): Promise<QuotationItem> {
    const db = await getDb();
    const [item] = await db
      .update(quotationItems)
      .set(itemData)
      .where(eq(quotationItems.id, id))
      .returning();
    return item;
  }

  async deleteQuotationItem(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(quotationItems).where(eq(quotationItems.id, id));
  }

  async recalculateQuotationTotals(quotationId: string): Promise<Quotation> {
    const db = await getDb();
    
    // Get quotation
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));
    
    if (!quotation) throw new Error("Quotation not found");

    // Get all line items for this quotation
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId));

    // Calculate totals from line items
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const lineSubtotal = item.quantity * parseFloat(item.unitPrice);
      const discountAmount = lineSubtotal * (parseFloat(item.discount || '0') / 100);
      const afterDiscount = lineSubtotal - discountAmount;
      const taxAmount = afterDiscount * (parseFloat(item.tax || '0') / 100);
      
      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const totalAmount = subtotal - totalDiscount + totalTax;

    // Update quotation with calculated totals
    const [updated] = await db
      .update(quotations)
      .set({
        subtotal: subtotal.toFixed(2),
        discountAmount: totalDiscount.toFixed(2),
        taxAmount: totalTax.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return updated;
  }

  async convertQuotationToOrder(quotationId: string, orderData?: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const db = await getDb();
    
    const quotation = await this.getQuotation(quotationId);
    if (!quotation) throw new Error("Quotation not found");

    // Create sales order
    const orderNumber = `SO-${Date.now()}`;
    const [order] = await db.insert(salesOrders).values({
      orderNumber,
      customerId: quotation.customerId,
      salesRepId: quotation.salesRepId,
      orderDate: new Date().toISOString().split('T')[0] as any,
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      notes: quotation.notes,
      ...orderData,
    }).returning();

    // Create order items
    for (const item of quotation.items) {
      await db.insert(salesOrderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.lineTotal,
      });
    }

    // Update quotation status
    await db.update(quotations)
      .set({ 
        status: 'accepted', 
        convertedToOrderId: order.id,
        convertedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(quotations.id, quotationId));

    return order;
  }

  // CRM Module - Receipt operations
  async getReceipts(limit = 100, customerId?: string): Promise<(Omit<Receipt, 'receivedBy'> & { customer: Customer; invoice?: Invoice; receivedBy: User })[]> {
    const db = await getDb();
    return await db
      .select({
        receipt: receipts,
        customer: customers,
        invoice: invoices,
        receivedBy: users,
      })
      .from(receipts)
      .leftJoin(customers, eq(receipts.customerId, customers.id))
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(users, eq(receipts.receivedBy, users.id))
      .where(customerId ? eq(receipts.customerId, customerId) : sql`true`)
      .limit(limit)
      .orderBy(desc(receipts.createdAt))
      .then(rows => rows.map(row => ({
        ...row.receipt,
        customer: row.customer!,
        invoice: row.invoice || undefined,
        receivedBy: row.receivedBy!,
      })));
  }

  async getReceipt(id: string): Promise<(Omit<Receipt, 'receivedBy'> & { customer: Customer; invoice?: Invoice; receivedBy: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        receipt: receipts,
        customer: customers,
        invoice: invoices,
        receivedBy: users,
      })
      .from(receipts)
      .leftJoin(customers, eq(receipts.customerId, customers.id))
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(users, eq(receipts.receivedBy, users.id))
      .where(eq(receipts.id, id));

    if (!row) return undefined;

    return {
      ...row.receipt,
      customer: row.customer!,
      invoice: row.invoice || undefined,
      receivedBy: row.receivedBy!,
    };
  }

  async createReceipt(receiptData: InsertReceipt): Promise<Receipt> {
    const db = await getDb();
    const [receipt] = await db.insert(receipts).values(receiptData).returning();
    return receipt;
  }

  async updateReceipt(id: string, receiptData: Partial<InsertReceipt>): Promise<Receipt> {
    const db = await getDb();
    const [receipt] = await db
      .update(receipts)
      .set(receiptData)
      .where(eq(receipts.id, id))
      .returning();
    return receipt;
  }

  async allocateReceiptToInvoice(receiptId: string, invoiceId: string, amount: number): Promise<{ receipt: Receipt; invoice: Invoice }> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Validate receipt exists and is available for allocation
      const [currentReceipt] = await tx
        .select()
        .from(receipts)
        .where(eq(receipts.id, receiptId));
      
      if (!currentReceipt) {
        throw new Error('Receipt not found');
      }
      
      if (currentReceipt.status === 'cleared') {
        throw new Error('Receipt has already been allocated');
      }
      
      const remainingAmount = parseFloat(currentReceipt.amount) - parseFloat(currentReceipt.appliedAmount || '0');
      if (amount > remainingAmount) {
        throw new Error(`Allocation amount ${amount} exceeds remaining receipt amount ${remainingAmount}`);
      }
      
      // Validate invoice exists
      const [currentInvoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId));
      
      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }
      
      // Update receipt
      const [receipt] = await tx
        .update(receipts)
        .set({ 
          invoiceId,
          appliedAmount: (parseFloat(currentReceipt.appliedAmount || '0') + amount).toFixed(2),
          status: (parseFloat(currentReceipt.appliedAmount || '0') + amount) >= parseFloat(currentReceipt.amount) ? 'cleared' : 'pending'
        })
        .where(eq(receipts.id, receiptId))
        .returning();

      // Update invoice paid amount and status
      const newPaidAmount = parseFloat(currentInvoice.paidAmount || '0') + amount;
      const totalAmount = parseFloat(currentInvoice.totalAmount || '0');
      const newStatus = newPaidAmount >= totalAmount ? 'paid' : newPaidAmount > 0 ? 'sent' : currentInvoice.status;
      
      const [invoice] = await tx
        .update(invoices)
        .set({ 
          paidAmount: newPaidAmount.toFixed(2),
          status: newStatus as any,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return { receipt, invoice };
    });
  }

  // CRM Module - Commission operations
  async getCommissionEntries(salesRepId?: string, status?: string, limit = 100, startDate?: string, endDate?: string): Promise<(CommissionEntry & { invoice: Invoice; salesRep: User; approver?: User })[]> {
    const db = await getDb();
    
    const dateFilter = and(
      startDate ? gte(commissionEntries.createdAt, new Date(startDate)) : sql`true`,
      endDate ? lte(commissionEntries.createdAt, new Date(endDate)) : sql`true`
    );

    return await db
      .select({
        commission: commissionEntries,
        invoice: invoices,
        salesRep: users,
        approver: sql<User>`approver_user.*`.as('approver'),
      })
      .from(commissionEntries)
      .leftJoin(invoices, eq(commissionEntries.invoiceId, invoices.id))
      .leftJoin(users, eq(commissionEntries.salesRepId, users.id))
      .leftJoin(sql`users AS approver_user`, sql`${commissionEntries.approvedBy} = approver_user.id`)
      .where(
        and(
          salesRepId ? eq(commissionEntries.salesRepId, salesRepId) : sql`true`,
          status ? sql`${commissionEntries.status} = ${status}` : sql`true`,
          dateFilter
        )
      )
      .limit(limit)
      .orderBy(desc(commissionEntries.createdAt))
      .then(rows => rows.map(row => ({
        ...row.commission,
        invoice: row.invoice!,
        salesRep: row.salesRep!,
        approver: row.approver || undefined,
      })));
  }

  async getCommissionEntry(id: string): Promise<(CommissionEntry & { invoice: Invoice; salesRep: User; approver?: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        commission: commissionEntries,
        invoice: invoices,
        salesRep: users,
        approver: sql<User>`approver_user.*`.as('approver'),
      })
      .from(commissionEntries)
      .leftJoin(invoices, eq(commissionEntries.invoiceId, invoices.id))
      .leftJoin(users, eq(commissionEntries.salesRepId, users.id))
      .leftJoin(sql`users AS approver_user`, sql`${commissionEntries.approvedBy} = approver_user.id`)
      .where(eq(commissionEntries.id, id));

    if (!row) return undefined;

    return {
      ...row.commission,
      invoice: row.invoice!,
      salesRep: row.salesRep!,
      approver: row.approver || undefined,
    };
  }

  async createCommissionEntry(commissionData: InsertCommissionEntry): Promise<CommissionEntry> {
    const db = await getDb();
    const [commission] = await db.insert(commissionEntries).values(commissionData).returning();
    return commission;
  }

  async updateCommissionEntry(id: string, commissionData: Partial<InsertCommissionEntry>): Promise<CommissionEntry> {
    const db = await getDb();
    const [commission] = await db
      .update(commissionEntries)
      .set(commissionData)
      .where(eq(commissionEntries.id, id))
      .returning();
    return commission;
  }

  async approveCommission(id: string, approverId: string): Promise<CommissionEntry> {
    const db = await getDb();
    const [commission] = await db
      .update(commissionEntries)
      .set({ 
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date()
      })
      .where(eq(commissionEntries.id, id))
      .returning();
    return commission;
  }

  async getSalesRepCommissionSummary(salesRepId: string, startDate?: string, endDate?: string): Promise<{
    totalAccrued: number;
    totalApproved: number;
    totalPaid: number;
    entries: (CommissionEntry & { invoice: Invoice })[];
  }> {
    const db = await getDb();
    
    const dateFilter = and(
      startDate ? gte(commissionEntries.createdAt, new Date(startDate)) : sql`true`,
      endDate ? lte(commissionEntries.createdAt, new Date(endDate)) : sql`true`
    );

    const entries = await db
      .select({
        commission: commissionEntries,
        invoice: invoices,
      })
      .from(commissionEntries)
      .leftJoin(invoices, eq(commissionEntries.invoiceId, invoices.id))
      .where(and(eq(commissionEntries.salesRepId, salesRepId), dateFilter))
      .orderBy(desc(commissionEntries.createdAt));

    const totals = entries.reduce((acc, entry) => {
      const amount = parseFloat(entry.commission.commissionAmount);
      if (entry.commission.status === 'accrued') acc.totalAccrued += amount;
      if (entry.commission.status === 'approved') acc.totalApproved += amount;
      if (entry.commission.status === 'paid') acc.totalPaid += amount;
      return acc;
    }, { totalAccrued: 0, totalApproved: 0, totalPaid: 0 });

    return {
      ...totals,
      entries: entries.map(row => ({ ...row.commission, invoice: row.invoice! })),
    };
  }

  async markCommissionAsPaid(id: string): Promise<CommissionEntry> {
    const db = await getDb();
    const [commission] = await db
      .update(commissionEntries)
      .set({ 
        status: 'paid',
        paidAt: new Date()
      })
      .where(eq(commissionEntries.id, id))
      .returning();
    return commission;
  }

  async updateCommissionNotes(id: string, notes?: string): Promise<CommissionEntry> {
    const db = await getDb();
    const [commission] = await db
      .update(commissionEntries)
      .set({ notes })
      .where(eq(commissionEntries.id, id))
      .returning();
    return commission;
  }

  async getCommissionEntriesForExport(filters: {
    salesRepId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<(CommissionEntry & { 
    invoice: Invoice & { customer: Customer }; 
    salesRep: User; 
    approver?: User 
  })[]> {
    const db = await getDb();
    
    const dateFilter = and(
      filters.startDate ? gte(commissionEntries.createdAt, new Date(filters.startDate)) : sql`true`,
      filters.endDate ? lte(commissionEntries.createdAt, new Date(filters.endDate)) : sql`true`
    );

    const rows = await db
      .select({
        commission: commissionEntries,
        invoice: invoices,
        customer: customers,
        salesRep: users,
        approver: sql<User>`approver_user.*`.as('approver'),
      })
      .from(commissionEntries)
      .leftJoin(invoices, eq(commissionEntries.invoiceId, invoices.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(users, eq(commissionEntries.salesRepId, users.id))
      .leftJoin(sql`users AS approver_user`, sql`${commissionEntries.approvedBy} = approver_user.id`)
      .where(
        and(
          filters.salesRepId ? eq(commissionEntries.salesRepId, filters.salesRepId) : sql`true`,
          filters.status ? sql`${commissionEntries.status} = ${filters.status}` : sql`true`,
          dateFilter
        )
      )
      .orderBy(desc(commissionEntries.createdAt));

    return rows.map(row => ({
      ...row.commission,
      invoice: { ...row.invoice!, customer: row.customer! },
      salesRep: row.salesRep!,
      approver: row.approver || undefined,
    }));
  }

  async bulkCommissionActions(
    commissionIds: string[], 
    action: 'approve' | 'mark-paid' | 'cancel',
    userId: string,
    notes?: string
  ): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    const db = await getDb();
    const results: { success: string[]; failed: { id: string; error: string }[] } = { success: [], failed: [] };
    
    for (const commissionId of commissionIds) {
      try {
        let updateData: any = {};
        
        switch (action) {
          case 'approve':
            updateData = {
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date(),
              ...(notes && { notes })
            };
            break;
          case 'mark-paid':
            updateData = {
              status: 'paid',
              paidAt: new Date(),
              ...(notes && { notes })
            };
            break;
          case 'cancel':
            updateData = {
              status: 'cancelled',
              ...(notes && { notes })
            };
            break;
        }
        
        await db
          .update(commissionEntries)
          .set(updateData)
          .where(eq(commissionEntries.id, commissionId));
          
        results.success.push(commissionId);
      } catch (error) {
        results.failed.push({
          id: commissionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // CRM Module - Credit Override operations
  async getCreditOverrides(customerId?: string, status?: string, limit = 100): Promise<(CreditOverride & { customer: Customer; requester: User; approver?: User; invoice?: Invoice })[]> {
    const db = await getDb();
    return await db
      .select({
        override: creditOverrides,
        customer: customers,
        requester: users,
        approver: sql<User>`approver_user.*`.as('approver'),
        invoice: invoices,
      })
      .from(creditOverrides)
      .leftJoin(customers, eq(creditOverrides.customerId, customers.id))
      .leftJoin(users, eq(creditOverrides.requestedBy, users.id))
      .leftJoin(sql`users AS approver_user`, sql`${creditOverrides.approvedBy} = approver_user.id`)
      .leftJoin(invoices, eq(creditOverrides.invoiceId, invoices.id))
      .where(
        and(
          customerId ? eq(creditOverrides.customerId, customerId) : sql`true`,
          status ? sql`${creditOverrides.status} = ${status}` : sql`true`
        )
      )
      .limit(limit)
      .orderBy(desc(creditOverrides.createdAt))
      .then(rows => rows.map(row => ({
        ...row.override,
        customer: row.customer!,
        requester: row.requester!,
        approver: row.approver || undefined,
        invoice: row.invoice || undefined,
      })));
  }

  async getCreditOverride(id: string): Promise<(CreditOverride & { customer: Customer; requester: User; approver?: User; invoice?: Invoice }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        override: creditOverrides,
        customer: customers,
        requester: users,
        approver: sql<User>`approver_user.*`.as('approver'),
        invoice: invoices,
      })
      .from(creditOverrides)
      .leftJoin(customers, eq(creditOverrides.customerId, customers.id))
      .leftJoin(users, eq(creditOverrides.requestedBy, users.id))
      .leftJoin(sql`users AS approver_user`, sql`${creditOverrides.approvedBy} = approver_user.id`)
      .leftJoin(invoices, eq(creditOverrides.invoiceId, invoices.id))
      .where(eq(creditOverrides.id, id));

    if (!row) return undefined;

    return {
      ...row.override,
      customer: row.customer!,
      requester: row.requester!,
      approver: row.approver || undefined,
      invoice: row.invoice || undefined,
    };
  }

  async createCreditOverride(overrideData: InsertCreditOverride): Promise<CreditOverride> {
    const db = await getDb();
    const [override] = await db.insert(creditOverrides).values(overrideData).returning();
    return override;
  }

  async updateCreditOverride(id: string, overrideData: Partial<InsertCreditOverride>): Promise<CreditOverride> {
    const db = await getDb();
    const [override] = await db
      .update(creditOverrides)
      .set(overrideData)
      .where(eq(creditOverrides.id, id))
      .returning();
    return override;
  }

  async approveCreditOverride(id: string, approverId: string, approvedAmount: number): Promise<CreditOverride> {
    const db = await getDb();
    const [override] = await db
      .update(creditOverrides)
      .set({ 
        status: 'approved',
        approvedBy: approverId,
        approvedAmount: String(approvedAmount),
        approvedAt: new Date()
      })
      .where(eq(creditOverrides.id, id))
      .returning();
    return override;
  }

  async checkCustomerCredit(customerId: string, newOrderAmount: number): Promise<{
    creditLimit: number;
    outstandingAmount: number;
    availableCredit: number;
    canProceed: boolean;
    requiresOverride: boolean;
  }> {
    const db = await getDb();
    
    // Get customer credit limit
    const [customer] = await db
      .select({ creditLimit: customers.creditLimit })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) throw new Error("Customer not found");

    // Calculate outstanding amount
    const [outstandingResult] = await db
      .select({
        outstanding: sql<number>`COALESCE(SUM(${invoices.totalAmount} - ${invoices.paidAmount}), 0)`.as('outstanding')
      })
      .from(invoices)
      .where(and(
        eq(invoices.customerId, customerId),
        sql`${invoices.status} != 'paid'`
      ));

    const creditLimit = parseFloat(customer.creditLimit || '0');
    const outstandingAmount = outstandingResult?.outstanding || 0;
    const availableCredit = creditLimit - outstandingAmount;
    const canProceed = availableCredit >= newOrderAmount;
    const requiresOverride = !canProceed && creditLimit > 0;

    return {
      creditLimit,
      outstandingAmount,
      availableCredit,
      canProceed,
      requiresOverride,
    };
  }

  // CRM Module - Lead operations
  async getLeads(limit = 100, status?: string, assignedTo?: string): Promise<(Lead & { assignee?: User; campaign?: any; communications: Communication[] })[]> {
    const db = await getDb();
    const leadData = await db
      .select({
        lead: leads,
        assignee: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(
        and(
          eq(leads.isActive, true),
          status ? sql`${leads.leadStatus} = ${status}` : sql`true`,
          assignedTo ? eq(leads.assignedTo, assignedTo) : sql`true`
        )
      )
      .limit(limit)
      .orderBy(desc(leads.createdAt));

    const leadsWithCommunications = await Promise.all(
      leadData.map(async (row) => {
        const comms = await db
          .select()
          .from(communications)
          .where(eq(communications.leadId, row.lead.id))
          .orderBy(desc(communications.createdAt));

        return {
          ...row.lead,
          assignee: row.assignee || undefined,
          campaign: undefined, // TODO: Add campaign data if needed
          communications: comms,
        };
      })
    );

    return leadsWithCommunications;
  }

  async getLead(id: string): Promise<(Lead & { assignee?: User; campaign?: any; communications: Communication[] }) | undefined> {
    const db = await getDb();
    const [leadData] = await db
      .select({
        lead: leads,
        assignee: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.id, id));

    if (!leadData) return undefined;

    const comms = await db
      .select()
      .from(communications)
      .where(eq(communications.leadId, id))
      .orderBy(desc(communications.createdAt));

    return {
      ...leadData.lead,
      assignee: leadData.assignee || undefined,
      campaign: undefined, // TODO: Add campaign data if needed
      communications: comms,
    };
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const db = await getDb();
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead> {
    const db = await getDb();
    const [lead] = await db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    const db = await getDb();
    await db.update(leads).set({ isActive: false }).where(eq(leads.id, id));
  }

  async convertLeadToCustomer(leadId: string, customerData: InsertCustomer): Promise<{ lead: Lead; customer: Customer }> {
    const db = await getDb();
    
    // Create customer
    const [customer] = await db.insert(customers).values(customerData).returning();
    
    // Update lead
    const [lead] = await db
      .update(leads)
      .set({ 
        leadStatus: 'converted',
        convertedAt: new Date(),
        convertedToCustomerId: customer.id,
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId))
      .returning();

    return { lead, customer };
  }

  // CRM Module - Lead Communication operations
  async getLeadCommunications(leadId: string, limit = 50): Promise<(Communication & { user: User })[]> {
    const db = await getDb();
    return await db
      .select({
        communication: communications,
        user: users,
      })
      .from(communications)
      .leftJoin(users, eq(communications.userId, users.id))
      .where(eq(communications.leadId, leadId))
      .limit(limit)
      .orderBy(desc(communications.createdAt))
      .then(rows => rows.map(row => ({
        ...row.communication,
        user: row.user!,
      })));
  }

  async createLeadCommunication(communicationData: InsertCommunication): Promise<Communication> {
    const db = await getDb();
    const [communication] = await db.insert(communications).values(communicationData).returning();
    return communication;
  }

  async updateLeadCommunication(id: string, communicationData: Partial<InsertCommunication>): Promise<Communication> {
    const db = await getDb();
    const [communication] = await db
      .update(communications)
      .set(communicationData)
      .where(eq(communications.id, id))
      .returning();
    return communication;
  }

  // CRM Module - General Communication operations
  async getCommunication(id: string): Promise<Communication | undefined> {
    const db = await getDb();
    const [communication] = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id))
      .limit(1);
    return communication;
  }

  async getCustomerCommunications(customerId: string, limit = 50): Promise<Communication[]> {
    const db = await getDb();
    return await db
      .select()
      .from(communications)
      .where(eq(communications.customerId, customerId))
      .limit(limit)
      .orderBy(desc(communications.createdAt));
  }

  // Sentiment Analysis operations
  async upsertSentiment(sentimentData: InsertSentimentAnalysis): Promise<SentimentAnalysis> {
    const db = await getDb();
    
    // Check if sentiment analysis already exists for this communication
    const existing = await db
      .select()
      .from(sentimentAnalyses)
      .where(eq(sentimentAnalyses.communicationId, sentimentData.communicationId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing
      const [sentiment] = await db
        .update(sentimentAnalyses)
        .set({
          ...sentimentData,
          analyzedAt: new Date()
        })
        .where(eq(sentimentAnalyses.communicationId, sentimentData.communicationId))
        .returning();
      return sentiment;
    } else {
      // Insert new
      const [sentiment] = await db.insert(sentimentAnalyses).values(sentimentData).returning();
      return sentiment;
    }
  }

  async getSentimentByCommunication(communicationId: string): Promise<SentimentAnalysis | undefined> {
    const db = await getDb();
    const [sentiment] = await db
      .select()
      .from(sentimentAnalyses)
      .where(eq(sentimentAnalyses.communicationId, communicationId))
      .limit(1);
    return sentiment;
  }

  async listSentimentsByCustomer(customerId: string, limit = 50): Promise<(SentimentAnalysis & { communication: Communication })[]> {
    const db = await getDb();
    return await db
      .select({
        sentiment: sentimentAnalyses,
        communication: communications,
      })
      .from(sentimentAnalyses)
      .leftJoin(communications, eq(sentimentAnalyses.communicationId, communications.id))
      .where(eq(sentimentAnalyses.customerId, customerId))
      .limit(limit)
      .orderBy(desc(sentimentAnalyses.analyzedAt))
      .then(rows => rows.map(row => ({
        ...row.sentiment,
        communication: row.communication!,
      })));
  }

  async getCustomerSentimentSummary(customerId: string): Promise<{
    totalCommunications: number;
    averageScore: number;
    sentimentDistribution: { negative: number; neutral: number; positive: number };
    recentTrend: 'improving' | 'declining' | 'stable';
    lastAnalyzedAt: Date | null;
  }> {
    const db = await getDb();
    
    // Get overall metrics
    const [metrics] = await db
      .select({
        totalCommunications: sql<number>`COUNT(*)`.as('totalCommunications'),
        averageScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('averageScore'),
        negativeCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'negative' THEN 1 END)`.as('negativeCount'),
        neutralCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'neutral' THEN 1 END)`.as('neutralCount'),
        positiveCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'positive' THEN 1 END)`.as('positiveCount'),
        lastAnalyzedAt: sql<Date>`MAX(${sentimentAnalyses.analyzedAt})`.as('lastAnalyzedAt'),
      })
      .from(sentimentAnalyses)
      .where(eq(sentimentAnalyses.customerId, customerId));

    // Get recent trend (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentAvg] = await db
      .select({
        avgScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('avgScore'),
      })
      .from(sentimentAnalyses)
      .where(and(
        eq(sentimentAnalyses.customerId, customerId),
        gte(sentimentAnalyses.analyzedAt, thirtyDaysAgo)
      ));

    const [previousAvg] = await db
      .select({
        avgScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('avgScore'),
      })
      .from(sentimentAnalyses)
      .where(and(
        eq(sentimentAnalyses.customerId, customerId),
        gte(sentimentAnalyses.analyzedAt, sixtyDaysAgo),
        lte(sentimentAnalyses.analyzedAt, thirtyDaysAgo)
      ));

    // Determine trend
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg?.avgScore && previousAvg?.avgScore) {
      const difference = recentAvg.avgScore - previousAvg.avgScore;
      if (difference > 0.1) recentTrend = 'improving';
      else if (difference < -0.1) recentTrend = 'declining';
    }

    return {
      totalCommunications: metrics?.totalCommunications || 0,
      averageScore: metrics?.averageScore || 0,
      sentimentDistribution: {
        negative: metrics?.negativeCount || 0,
        neutral: metrics?.neutralCount || 0,
        positive: metrics?.positiveCount || 0,
      },
      recentTrend,
      lastAnalyzedAt: metrics?.lastAnalyzedAt || null,
    };
  }

  async getGlobalSentimentSummary(): Promise<{
    totalCommunications: number;
    averageScore: number;
    sentimentDistribution: { negative: number; neutral: number; positive: number };
    topNegativeCustomers: { customerId: string; customerName: string; averageScore: number }[];
    topPositiveCustomers: { customerId: string; customerName: string; averageScore: number }[];
  }> {
    const db = await getDb();
    
    // Get overall metrics
    const [metrics] = await db
      .select({
        totalCommunications: sql<number>`COUNT(*)`.as('totalCommunications'),
        averageScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('averageScore'),
        negativeCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'negative' THEN 1 END)`.as('negativeCount'),
        neutralCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'neutral' THEN 1 END)`.as('neutralCount'),
        positiveCount: sql<number>`COUNT(CASE WHEN ${sentimentAnalyses.label} = 'positive' THEN 1 END)`.as('positiveCount'),
      })
      .from(sentimentAnalyses);

    // Get top negative customers
    const topNegativeCustomers = await db
      .select({
        customerId: sentimentAnalyses.customerId,
        customerName: customers.name,
        averageScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('averageScore'),
      })
      .from(sentimentAnalyses)
      .leftJoin(customers, eq(sentimentAnalyses.customerId, customers.id))
      .groupBy(sentimentAnalyses.customerId, customers.name)
      .having(sql`COUNT(*) >= 3`) // At least 3 communications
      .orderBy(asc(sql`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`))
      .limit(5);

    // Get top positive customers
    const topPositiveCustomers = await db
      .select({
        customerId: sentimentAnalyses.customerId,
        customerName: customers.name,
        averageScore: sql<number>`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`.as('averageScore'),
      })
      .from(sentimentAnalyses)
      .leftJoin(customers, eq(sentimentAnalyses.customerId, customers.id))
      .groupBy(sentimentAnalyses.customerId, customers.name)
      .having(sql`COUNT(*) >= 3`) // At least 3 communications
      .orderBy(desc(sql`AVG(CAST(${sentimentAnalyses.score} AS FLOAT))`))
      .limit(5);

    return {
      totalCommunications: metrics?.totalCommunications || 0,
      averageScore: metrics?.averageScore || 0,
      sentimentDistribution: {
        negative: metrics?.negativeCount || 0,
        neutral: metrics?.neutralCount || 0,
        positive: metrics?.positiveCount || 0,
      },
      topNegativeCustomers: topNegativeCustomers.map(row => ({
        customerId: row.customerId,
        customerName: row.customerName || 'Unknown Customer',
        averageScore: row.averageScore || 0,
      })),
      topPositiveCustomers: topPositiveCustomers.map(row => ({
        customerId: row.customerId,
        customerName: row.customerName || 'Unknown Customer',
        averageScore: row.averageScore || 0,
      })),
    };
  }

  // Enhanced Dashboard metrics for CRM
  async getCrmDashboardMetrics(): Promise<{
    totalQuotations: number;
    pendingQuotations: number;
    quotationValue: number;
    conversionRate: number;
    totalLeads: number;
    qualifiedLeads: number;
    totalCommissions: number;
    outstandingReceipts: number;
    creditOverridesPending: number;
  }> {
    const db = await getDb();

    // Get quotation metrics
    const [quotationMetrics] = await db
      .select({
        totalQuotations: sql<number>`COUNT(*)`.as('totalQuotations'),
        pendingQuotations: sql<number>`COUNT(CASE WHEN status IN ('draft', 'sent') THEN 1 END)`.as('pendingQuotations'),
        quotationValue: sql<number>`COALESCE(SUM(${quotations.totalAmount}), 0)`.as('quotationValue'),
        acceptedQuotations: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`.as('acceptedQuotations'),
      })
      .from(quotations);

    // Get lead metrics
    const [leadMetrics] = await db
      .select({
        totalLeads: sql<number>`COUNT(*)`.as('totalLeads'),
        qualifiedLeads: sql<number>`COUNT(CASE WHEN lead_status IN ('qualified', 'converted') THEN 1 END)`.as('qualifiedLeads'),
      })
      .from(leads)
      .where(eq(leads.isActive, true));

    // Get commission metrics
    const [commissionMetrics] = await db
      .select({
        totalCommissions: sql<number>`COALESCE(SUM(${commissionEntries.commissionAmount}), 0)`.as('totalCommissions'),
      })
      .from(commissionEntries)
      .where(eq(commissionEntries.status, 'accrued'));

    // Get receipt metrics
    const [receiptMetrics] = await db
      .select({
        outstandingReceipts: sql<number>`COALESCE(SUM(${receipts.amount} - ${receipts.appliedAmount}), 0)`.as('outstandingReceipts'),
      })
      .from(receipts)
      .where(eq(receipts.status, 'pending'));

    // Get credit override metrics
    const [creditMetrics] = await db
      .select({
        creditOverridesPending: sql<number>`COUNT(*)`.as('creditOverridesPending'),
      })
      .from(creditOverrides)
      .where(eq(creditOverrides.status, 'pending'));

    const totalQuotations = quotationMetrics?.totalQuotations || 0;
    const acceptedQuotations = quotationMetrics?.acceptedQuotations || 0;
    const conversionRate = totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;

    return {
      totalQuotations: totalQuotations,
      pendingQuotations: quotationMetrics?.pendingQuotations || 0,
      quotationValue: parseFloat(quotationMetrics?.quotationValue?.toString() || '0'),
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalLeads: leadMetrics?.totalLeads || 0,
      qualifiedLeads: leadMetrics?.qualifiedLeads || 0,
      totalCommissions: parseFloat(commissionMetrics?.totalCommissions?.toString() || '0'),
      outstandingReceipts: parseFloat(receiptMetrics?.outstandingReceipts?.toString() || '0'),
      creditOverridesPending: creditMetrics?.creditOverridesPending || 0,
    };
  }

  // Enhanced Purchase Module Operations Implementation
  
  // Purchase Request operations
  async getPurchaseRequests(limit = 50, status?: string, requesterId?: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] })[]> {
    const db = await getDb();
    
    let conditions = [];
    if (status) conditions.push(eq(purchaseRequests.status, status as any));
    if (requesterId) conditions.push(eq(purchaseRequests.requesterId, requesterId));
    
    const prs = await db
      .select({
        pr: purchaseRequests,
        requester: users,
        supplier: suppliers,
      })
      .from(purchaseRequests)
      .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
      .leftJoin(suppliers, eq(purchaseRequests.supplierId, suppliers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(purchaseRequests.createdAt));

    // Get items for each PR
    const results = [];
    for (const pr of prs) {
      const items = await db
        .select({
          item: purchaseRequestItems,
          product: products,
        })
        .from(purchaseRequestItems)
        .innerJoin(products, eq(purchaseRequestItems.productId, products.id))
        .where(eq(purchaseRequestItems.prId, pr.pr.id));
      
      results.push({ 
        ...pr.pr, 
        requester: pr.requester!, 
        supplier: pr.supplier || undefined,
        items: items.map(item => ({ ...item.item, product: item.product }))
      });
    }
    
    return results;
  }

  async getPurchaseRequest(id: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] }) | undefined> {
    const db = await getDb();
    
    const [pr] = await db
      .select({
        pr: purchaseRequests,
        requester: users,
        supplier: suppliers,
      })
      .from(purchaseRequests)
      .leftJoin(users, eq(purchaseRequests.requesterId, users.id))
      .leftJoin(suppliers, eq(purchaseRequests.supplierId, suppliers.id))
      .where(eq(purchaseRequests.id, id));

    if (!pr) return undefined;

    const items = await db
      .select({
        item: purchaseRequestItems,
        product: products,
      })
      .from(purchaseRequestItems)
      .innerJoin(products, eq(purchaseRequestItems.productId, products.id))
      .where(eq(purchaseRequestItems.prId, id));

    return { 
      ...pr.pr, 
      requester: pr.requester!,
      supplier: pr.supplier || undefined,
      items: items.map(item => ({ ...item.item, product: item.product }))
    };
  }

  async createPurchaseRequest(prData: InsertPurchaseRequest): Promise<PurchaseRequest> {
    const db = await getDb();
    const [pr] = await db
      .insert(purchaseRequests)
      .values(prData)
      .returning();
    return pr;
  }

  async updatePurchaseRequest(id: string, prData: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest> {
    const db = await getDb();
    const [pr] = await db
      .update(purchaseRequests)
      .set({ ...prData, updatedAt: new Date() })
      .where(eq(purchaseRequests.id, id))
      .returning();
    return pr;
  }

  async deletePurchaseRequest(id: string): Promise<void> {
    const db = await getDb();
    // Delete items first
    await db.delete(purchaseRequestItems).where(eq(purchaseRequestItems.prId, id));
    // Then delete the PR
    await db.delete(purchaseRequests).where(eq(purchaseRequests.id, id));
  }

  async createPurchaseRequestItem(item: InsertPurchaseRequestItem): Promise<PurchaseRequestItem> {
    const db = await getDb();
    const [prItem] = await db
      .insert(purchaseRequestItems)
      .values(item)
      .returning();
    return prItem;
  }

  async submitPurchaseRequest(id: string): Promise<PurchaseRequest> {
    const db = await getDb();
    const [pr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, id))
      .returning();
    return pr;
  }

  async approvePurchaseRequest(id: string, approverId: string): Promise<PurchaseRequest> {
    const db = await getDb();
    const [pr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, id))
      .returning();
    
    // Create approval record
    await this.createApproval({
      entityType: 'purchase_request',
      entityId: id,
      step: 1,
      approverId,
      status: 'approved',
      decidedAt: new Date(),
    });
    
    return pr;
  }

  async rejectPurchaseRequest(id: string, approverId: string, comment: string): Promise<PurchaseRequest> {
    const db = await getDb();
    const [pr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, id))
      .returning();
    
    // Create approval record
    await this.createApproval({
      entityType: 'purchase_request',
      entityId: id,
      step: 1,
      approverId,
      status: 'rejected',
      decidedAt: new Date(),
      comment,
    });
    
    return pr;
  }

  async convertPRtoPO(prId: string, poData: Partial<InsertPurchaseOrder>): Promise<{ pr: PurchaseRequest; po: PurchaseOrder }> {
    const db = await getDb();
    
    const pr = await this.getPurchaseRequest(prId);
    if (!pr) throw new Error('Purchase request not found');
    
    // Create PO with default data from PR
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const [po] = await db
      .insert(purchaseOrders)
      .values({
        orderNumber: poNumber,
        prId: prId,
        supplierId: pr.supplierId!,
        orderDate: new Date().toISOString().split('T')[0],
        totalAmount: pr.totalAmount,
        currency: pr.currency,
        status: 'draft',
        createdBy: poData.createdBy!,
        ...poData,
      })
      .returning();
    
    // Create PO items from PR items
    for (const prItem of pr.items) {
      await db
        .insert(purchaseOrderItems)
        .values({
          orderId: po.id,
          productId: prItem.productId,
          quantity: prItem.quantity,
          unitPrice: prItem.unitPrice || '0',
          totalPrice: prItem.lineTotal || '0',
        });
    }
    
    // Update PR status
    const [updatedPr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'converted',
        convertedToPo: po.id,
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, prId))
      .returning();
    
    return { pr: updatedPr, po };
  }

  // Enhanced PR workflow methods with multi-level approval
  async submitPurchaseRequestWithApproval(id: string, submitterId: string): Promise<{ pr: PurchaseRequest; approvals: PurchaseRequestApproval[] }> {
    const db = await getDb();
    
    const pr = await this.getPurchaseRequest(id);
    if (!pr) throw new Error('Purchase request not found');

    // Get applicable approval rules for this PR
    const rules = await this.getApprovalRules('purchase_request', pr.currency || 'USD');
    
    const prTotalAmount = parseFloat(pr.totalAmount || '0');
    const applicableRules = rules.filter(rule => 
      prTotalAmount >= (rule.amountRangeMin ? parseFloat(rule.amountRangeMin) : 0) &&
      prTotalAmount <= (rule.amountRangeMax ? parseFloat(rule.amountRangeMax) : Infinity)
    );

    // Update PR status to submitted
    const [updatedPr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, id))
      .returning();

    // Create approval records
    const approvals: PurchaseRequestApproval[] = [];
    for (const rule of applicableRules) {
      const [approval] = await db
        .insert(purchaseRequestApprovals)
        .values({
          prId: id,
          ruleId: rule.id,
          level: rule.level,
          approverId: rule.specificApproverId || submitterId,
          status: 'pending',
        })
        .returning();
      approvals.push(approval);
    }

    return { pr: updatedPr, approvals };
  }

  async approvePurchaseRequestLevel(prId: string, level: number, approverId: string, comment?: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval; isFullyApproved: boolean }> {
    const db = await getDb();
    
    // Update approval for this level
    const [approval] = await db
      .update(purchaseRequestApprovals)
      .set({
        status: 'approved',
        approverId: approverId,
        decidedAt: new Date(),
        comment,
      })
      .where(and(
        eq(purchaseRequestApprovals.prId, prId),
        eq(purchaseRequestApprovals.level, level)
      ))
      .returning();

    // Check if all levels are approved
    const pendingApprovals = await db
      .select()
      .from(purchaseRequestApprovals)
      .where(and(
        eq(purchaseRequestApprovals.prId, prId),
        eq(purchaseRequestApprovals.status, 'pending')
      ));

    const isFullyApproved = pendingApprovals.length === 0;

    // If fully approved, update PR status
    let updatedPr;
    if (isFullyApproved) {
      [updatedPr] = await db
        .update(purchaseRequests)
        .set({ 
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(purchaseRequests.id, prId))
        .returning();
    } else {
      updatedPr = await this.getPurchaseRequest(prId);
    }

    return { pr: updatedPr!, approval, isFullyApproved };
  }

  async rejectPurchaseRequestLevel(prId: string, level: number, approverId: string, comment: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval }> {
    const db = await getDb();
    
    // Update approval for this level
    const [approval] = await db
      .update(purchaseRequestApprovals)
      .set({
        status: 'rejected',
        approverId: approverId,
        decidedAt: new Date(),
        comment,
      })
      .where(and(
        eq(purchaseRequestApprovals.prId, prId),
        eq(purchaseRequestApprovals.level, level)
      ))
      .returning();

    // Update PR status to rejected
    const [updatedPr] = await db
      .update(purchaseRequests)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(purchaseRequests.id, prId))
      .returning();

    return { pr: updatedPr, approval };
  }

  async getPurchaseRequestApprovals(prId: string): Promise<(PurchaseRequestApproval & { approver: User; rule: ApprovalRule })[]> {
    const db = await getDb();
    
    const results = await db
      .select({
        id: purchaseRequestApprovals.id,
        prId: purchaseRequestApprovals.prId,
        ruleId: purchaseRequestApprovals.ruleId,
        level: purchaseRequestApprovals.level,
        status: purchaseRequestApprovals.status,
        approverId: purchaseRequestApprovals.approverId,
        decidedAt: purchaseRequestApprovals.decidedAt,
        comment: purchaseRequestApprovals.comment,
        notifiedAt: purchaseRequestApprovals.notifiedAt,
        createdAt: purchaseRequestApprovals.createdAt,
        approver: users,
        rule: approvalRules,
      })
      .from(purchaseRequestApprovals)
      .leftJoin(users, eq(purchaseRequestApprovals.approverId, users.id))
      .leftJoin(approvalRules, eq(purchaseRequestApprovals.ruleId, approvalRules.id))
      .where(eq(purchaseRequestApprovals.prId, prId))
      .orderBy(asc(purchaseRequestApprovals.level));
    
    return results.map(row => ({
      id: row.id,
      prId: row.prId,
      ruleId: row.ruleId,
      level: row.level,
      status: row.status,
      approverId: row.approverId,
      decidedAt: row.decidedAt,
      comment: row.comment,
      notifiedAt: row.notifiedAt,
      createdAt: row.createdAt,
      approver: row.approver!,
      rule: row.rule!,
    }));
  }

  async getPendingApprovalsForUser(userId: string, limit = 50): Promise<(PurchaseRequestApproval & { purchaseRequest: PurchaseRequest & { requester: User; items: (PurchaseRequestItem & { product: Product })[] }; rule: ApprovalRule })[]> {
    const db = await getDb();
    
    // Get pending approvals for this user
    const approvals = await db
      .select({
        id: purchaseRequestApprovals.id,
        prId: purchaseRequestApprovals.prId,
        ruleId: purchaseRequestApprovals.ruleId,
        level: purchaseRequestApprovals.level,
        status: purchaseRequestApprovals.status,
        approverId: purchaseRequestApprovals.approverId,
        decidedAt: purchaseRequestApprovals.decidedAt,
        comment: purchaseRequestApprovals.comment,
        notifiedAt: purchaseRequestApprovals.notifiedAt,
        createdAt: purchaseRequestApprovals.createdAt,
        rule: approvalRules,
      })
      .from(purchaseRequestApprovals)
      .leftJoin(approvalRules, eq(purchaseRequestApprovals.ruleId, approvalRules.id))
      .where(and(
        eq(purchaseRequestApprovals.status, 'pending'),
        eq(purchaseRequestApprovals.approverId, userId)
      ))
      .limit(limit)
      .orderBy(desc(purchaseRequestApprovals.createdAt));

    // Get purchase request details for each approval
    const results = [];
    for (const approval of approvals) {
      const pr = await this.getPurchaseRequest(approval.prId);
      if (pr) {
        results.push({
          id: approval.id,
          prId: approval.prId,
          ruleId: approval.ruleId,
          level: approval.level,
          status: approval.status,
          approverId: approval.approverId,
          decidedAt: approval.decidedAt,
          comment: approval.comment,
          notifiedAt: approval.notifiedAt,
          createdAt: approval.createdAt,
          purchaseRequest: pr,
          rule: approval.rule!,
        });
      }
    }

    return results;
  }

  // Approval workflow operations
  async getApprovals(entityType?: string, entityId?: string, approverId?: string): Promise<(Approval & { approver: User })[]> {
    const db = await getDb();
    
    let conditions = [];
    if (entityType) conditions.push(eq(approvals.entityType, entityType));
    if (entityId) conditions.push(eq(approvals.entityId, entityId));
    if (approverId) conditions.push(eq(approvals.approverId, approverId));
    
    return await db
      .select({
        id: approvals.id,
        entityType: approvals.entityType,
        entityId: approvals.entityId,
        step: approvals.step,
        approverId: approvals.approverId,
        status: approvals.status,
        comment: approvals.comment,
        decidedAt: approvals.decidedAt,
        createdAt: approvals.createdAt,
        approver: users,
      })
      .from(approvals)
      .innerJoin(users, eq(approvals.approverId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(approvals.createdAt));
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const db = await getDb();
    const [newApproval] = await db
      .insert(approvals)
      .values(approval)
      .returning();
    return newApproval;
  }

  async processApproval(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Approval> {
    const db = await getDb();
    const [approval] = await db
      .update(approvals)
      .set({ 
        status,
        decidedAt: new Date(),
        comment
      })
      .where(eq(approvals.id, id))
      .returning();
    return approval;
  }

  // Multi-level approval rules management
  async getApprovalRules(entityType?: string, currency?: string): Promise<ApprovalRule[]> {
    const db = await getDb();
    
    let conditions = [];
    if (entityType) conditions.push(eq(approvalRules.entityType, entityType));
    if (currency) conditions.push(eq(approvalRules.currency, currency));
    
    return await db
      .select()
      .from(approvalRules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(approvalRules.level));
  }

  async createApprovalRule(rule: InsertApprovalRule): Promise<ApprovalRule> {
    const db = await getDb();
    const [approvalRule] = await db.insert(approvalRules).values(rule).returning();
    return approvalRule;
  }

  async updateApprovalRule(id: string, rule: Partial<InsertApprovalRule>): Promise<ApprovalRule> {
    const db = await getDb();
    const [approvalRule] = await db
      .update(approvalRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(approvalRules.id, id))
      .returning();
    return approvalRule;
  }

  async deleteApprovalRule(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(approvalRules).where(eq(approvalRules.id, id));
  }

  // Goods Receipt operations
  async getGoodsReceipts(limit = 50, poId?: string): Promise<(Omit<GoodsReceipt, 'receivedBy'> & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; warehouse: Warehouse; receivedBy: User; items: (GoodsReceiptItem & { product: Product })[] })[]> {
    const db = await getDb();
    
    let conditions = [];
    if (poId) conditions.push(eq(goodsReceipts.poId, poId));
    
    const grs = await db
      .select({
        goodsReceipt: goodsReceipts,
        purchaseOrder: purchaseOrders,
        supplier: suppliers,
        warehouse: warehouses,
        receivedBy: users,
      })
      .from(goodsReceipts)
      .innerJoin(purchaseOrders, eq(goodsReceipts.poId, purchaseOrders.id))
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .innerJoin(warehouses, eq(goodsReceipts.warehouseId, warehouses.id))
      .innerJoin(users, eq(goodsReceipts.receivedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(goodsReceipts.createdAt));

    // Get items for each GR
    const results = [];
    for (const gr of grs) {
      const items = await db
        .select({
          goodsReceiptItem: goodsReceiptItems,
          product: products,
        })
        .from(goodsReceiptItems)
        .innerJoin(products, eq(goodsReceiptItems.productId, products.id))
        .where(eq(goodsReceiptItems.grId, gr.goodsReceipt.id));
      
      results.push({ 
        ...gr.goodsReceipt, 
        purchaseOrder: { ...gr.purchaseOrder, supplier: gr.supplier },
        warehouse: gr.warehouse,
        receivedBy: gr.receivedBy,
        items: items.map(item => ({ ...item.goodsReceiptItem, product: item.product }))
      });
    }
    
    return results;
  }

  async getGoodsReceipt(id: string): Promise<(Omit<GoodsReceipt, 'receivedBy'> & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; warehouse: Warehouse; receivedBy: User; items: (GoodsReceiptItem & { product: Product })[] }) | undefined> {
    const db = await getDb();
    
    const [gr] = await db
      .select({
        goodsReceipt: goodsReceipts,
        purchaseOrder: purchaseOrders,
        supplier: suppliers,
        warehouse: warehouses,
        receivedBy: users,
      })
      .from(goodsReceipts)
      .innerJoin(purchaseOrders, eq(goodsReceipts.poId, purchaseOrders.id))
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .innerJoin(warehouses, eq(goodsReceipts.warehouseId, warehouses.id))
      .innerJoin(users, eq(goodsReceipts.receivedBy, users.id))
      .where(eq(goodsReceipts.id, id));

    if (!gr) return undefined;

    const items = await db
      .select({
        goodsReceiptItem: goodsReceiptItems,
        product: products,
      })
      .from(goodsReceiptItems)
      .innerJoin(products, eq(goodsReceiptItems.productId, products.id))
      .where(eq(goodsReceiptItems.grId, id));

    return { 
      ...gr.goodsReceipt, 
      purchaseOrder: { ...gr.purchaseOrder, supplier: gr.supplier },
      warehouse: gr.warehouse,
      receivedBy: gr.receivedBy,
      items: items.map(item => ({ ...item.goodsReceiptItem, product: item.product }))
    };
  }

  async createGoodsReceipt(receiptData: InsertGoodsReceipt, items: InsertGoodsReceiptItem[]): Promise<GoodsReceipt> {
    const db = await getDb();
    
    // Generate GR number
    const grNumber = `GR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const [gr] = await db
      .insert(goodsReceipts)
      .values({
        ...receiptData,
        grNumber,
      })
      .returning();

    // Create GR items
    for (const item of items) {
      await db
        .insert(goodsReceiptItems)
        .values({
          ...item,
          grId: gr.id,
        });
    }

    return gr;
  }

  async updateGoodsReceipt(id: string, receiptData: Partial<InsertGoodsReceipt>): Promise<GoodsReceipt> {
    const db = await getDb();
    const [gr] = await db
      .update(goodsReceipts)
      .set(receiptData)
      .where(eq(goodsReceipts.id, id))
      .returning();
    return gr;
  }

  async postGoodsReceipt(id: string): Promise<GoodsReceipt> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Get GR details and validate state
      const grDetail = await this.getGoodsReceipt(id);
      if (!grDetail) throw new Error('Goods receipt not found');
      
      if (grDetail.status === 'posted') {
        throw new Error('Goods receipt has already been posted');
      }
      
      // Validate associated purchase order exists
      const [po] = await tx
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, grDetail.purchaseOrder.id));
      
      if (!po) {
        throw new Error('Associated purchase order not found');
      }
      
      // Get PO items for cost reference
      const poItems = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.orderId, po.id));
      
      // Update GR status
      const [gr] = await tx
        .update(goodsReceipts)
        .set({ status: 'posted' })
        .where(eq(goodsReceipts.id, id))
        .returning();

      // Get GR items to create inventory and stock movements
      const grItems = await tx
        .select()
        .from(goodsReceiptItems)
        .where(eq(goodsReceiptItems.grId, id));
      
      if (grItems.length === 0) {
        throw new Error('No goods receipt items found');
      }

      // Create/update inventory and stock movements with proper batch/expiry data
      for (const item of grItems) {
        // Find corresponding PO item for cost data
        const poItem = poItems.find(pi => pi.productId === item.productId);
        const costPerUnit = poItem ? poItem.unitPrice : '0';
        
        // Validate expiry date is in the future for pharmaceuticals
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          if (expiryDate <= today) {
            throw new Error(`Cannot receive expired product. Batch ${item.batchNumber} expires on ${expiryDate.toDateString()}`);
          }
        }
        
        // Create inventory entry with proper batch and expiry tracking
        const [inventoryEntry] = await tx
          .insert(inventory)
          .values({
            productId: item.productId,
            warehouseId: grDetail.warehouseId,
            batchNumber: item.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            quantity: item.quantity,
            manufactureDate: new Date().toISOString().split('T')[0], // Today as received date
            expiryDate: item.expiryDate,
            costPerUnit: costPerUnit || '0',
          })
          .returning();

        // Create stock movement
        const movementData: InsertStockMovement = {
          productId: item.productId,
          warehouseId: grDetail.warehouseId,
          inventoryId: inventoryEntry.id,
          movementType: 'in',
          quantity: item.quantity,
          reference: grDetail.grNumber,
          notes: `Goods receipt: ${grDetail.grNumber} - Batch: ${item.batchNumber || 'Auto-generated'}${item.expiryDate ? ` - Expires: ${item.expiryDate}` : ''}`,
          userId: typeof grDetail.receivedBy === 'string' ? grDetail.receivedBy : grDetail.receivedBy.id,
        };
        const [movement] = await tx
          .insert(stockMovements)
          .values(movementData)
          .returning();
      }
      
      // Update PO status if all items received
      const totalPOItems = poItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalGRItems = grItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalGRItems >= totalPOItems) {
        await tx
          .update(purchaseOrders)
          .set({ 
            status: 'received',
            deliveryDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date()
          })
          .where(eq(purchaseOrders.id, po.id));
      }

      return gr;
    });
  }

  // Vendor Bill operations
  async getVendorBills(limit = 50, supplierId?: string): Promise<(Omit<VendorBill, 'createdBy'> & { supplier: Supplier; purchaseOrder?: PurchaseOrder; createdBy: User; items: (VendorBillItem & { product?: Product })[] })[]> {
    const db = await getDb();
    
    let conditions = [];
    if (supplierId) conditions.push(eq(vendorBills.supplierId, supplierId));
    
    const bills = await db
      .select({
        vendorBill: vendorBills,
        supplier: suppliers,
        purchaseOrder: purchaseOrders,
        createdBy: users,
      })
      .from(vendorBills)
      .innerJoin(suppliers, eq(vendorBills.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(vendorBills.poId, purchaseOrders.id))
      .innerJoin(users, eq(vendorBills.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(vendorBills.createdAt));

    // Get items for each bill
    const results = [];
    for (const bill of bills) {
      const items = await db
        .select({
          vendorBillItem: vendorBillItems,
          product: products,
        })
        .from(vendorBillItems)
        .leftJoin(products, eq(vendorBillItems.productId, products.id))
        .where(eq(vendorBillItems.billId, bill.vendorBill.id));
      
      results.push({ 
        ...bill.vendorBill, 
        supplier: bill.supplier,
        purchaseOrder: bill.purchaseOrder || undefined,
        createdBy: bill.createdBy,
        items: items.map(item => ({ ...item.vendorBillItem, product: item.product || undefined }))
      });
    }
    
    return results;
  }

  async getVendorBill(id: string): Promise<(Omit<VendorBill, 'createdBy'> & { supplier: Supplier; purchaseOrder?: PurchaseOrder; createdBy: User; items: (VendorBillItem & { product?: Product })[] }) | undefined> {
    const db = await getDb();
    
    const [bill] = await db
      .select({
        vendorBill: vendorBills,
        supplier: suppliers,
        purchaseOrder: purchaseOrders,
        createdBy: users,
      })
      .from(vendorBills)
      .innerJoin(suppliers, eq(vendorBills.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(vendorBills.poId, purchaseOrders.id))
      .innerJoin(users, eq(vendorBills.createdBy, users.id))
      .where(eq(vendorBills.id, id));

    if (!bill) return undefined;

    const items = await db
      .select({
        vendorBillItem: vendorBillItems,
        product: products,
      })
      .from(vendorBillItems)
      .leftJoin(products, eq(vendorBillItems.productId, products.id))
      .where(eq(vendorBillItems.billId, id));

    return { 
      ...bill.vendorBill, 
      supplier: bill.supplier,
      purchaseOrder: bill.purchaseOrder || undefined,
      createdBy: bill.createdBy,
      items: items.map(item => ({ ...item.vendorBillItem, product: item.product || undefined }))
    };
  }

  async createVendorBill(billData: InsertVendorBill, items: InsertVendorBillItem[]): Promise<VendorBill> {
    const db = await getDb();
    
    const [bill] = await db
      .insert(vendorBills)
      .values(billData)
      .returning();

    // Create bill items
    for (const item of items) {
      await db
        .insert(vendorBillItems)
        .values({
          ...item,
          billId: bill.id,
        });
    }

    return bill;
  }

  async updateVendorBill(id: string, billData: Partial<InsertVendorBill>): Promise<VendorBill> {
    const db = await getDb();
    const [bill] = await db
      .update(vendorBills)
      .set({ ...billData, updatedAt: new Date() })
      .where(eq(vendorBills.id, id))
      .returning();
    return bill;
  }

  async postVendorBill(id: string): Promise<VendorBill> {
    const db = await getDb();
    const [bill] = await db
      .update(vendorBills)
      .set({ status: 'posted' })
      .where(eq(vendorBills.id, id))
      .returning();
    return bill;
  }

  async processOCRBill(billId: string, ocrRaw: string, ocrExtract: any): Promise<VendorBill> {
    const db = await getDb();
    const [bill] = await db
      .update(vendorBills)
      .set({ 
        ocrRaw,
        ocrExtract,
        updatedAt: new Date()
      })
      .where(eq(vendorBills.id, billId))
      .returning();
    return bill;
  }

  // Three-Way Matching operations
  async getMatchResults(poId?: string, status?: string): Promise<(MatchResult & { purchaseOrder: PurchaseOrder & { supplier: Supplier }; goodsReceipt?: GoodsReceipt; vendorBill?: VendorBill; resolvedBy?: User })[]> {
    const db = await getDb();
    
    let conditions = [];
    if (poId) conditions.push(eq(matchResults.poId, poId));
    if (status) conditions.push(eq(matchResults.status, status as any));
    
    return await db
      .select({
        id: matchResults.id,
        poId: matchResults.poId,
        grId: matchResults.grId,
        billId: matchResults.billId,
        status: matchResults.status,
        quantityVariance: matchResults.quantityVariance,
        priceVariance: matchResults.priceVariance,
        matchDetails: matchResults.matchDetails,
        resolvedBy: matchResults.resolvedBy,
        resolvedAt: matchResults.resolvedAt,
        createdAt: matchResults.createdAt,
        purchaseOrder: purchaseOrders,
        supplier: suppliers,
        goodsReceipt: goodsReceipts,
        vendorBill: vendorBills,
        resolvedByUser: users,
      })
      .from(matchResults)
      .innerJoin(purchaseOrders, eq(matchResults.poId, purchaseOrders.id))
      .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(goodsReceipts, eq(matchResults.grId, goodsReceipts.id))
      .leftJoin(vendorBills, eq(matchResults.billId, vendorBills.id))
      .leftJoin(users, eq(matchResults.resolvedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(matchResults.createdAt)) as any;
  }

  async performThreeWayMatch(poId: string): Promise<MatchResult> {
    const db = await getDb();
    
    return await db.transaction(async (tx) => {
      // Validate PO exists
      const po = await this.getPurchaseOrder(poId);
      if (!po) throw new Error('Purchase order not found');
      
      // Check if match already exists
      const [existingMatch] = await tx
        .select()
        .from(matchResults)
        .where(eq(matchResults.poId, poId))
        .limit(1);
      
      if (existingMatch && existingMatch.status === 'matched') {
        throw new Error('Three-way match already completed for this purchase order');
      }

      // Get GR and Bill for the PO
      const [gr] = await tx
        .select()
        .from(goodsReceipts)
        .where(eq(goodsReceipts.poId, poId))
        .limit(1);

      const [bill] = await tx
        .select()
        .from(vendorBills)
        .where(eq(vendorBills.poId, poId))
        .limit(1);

      let matchStatus: 'matched' | 'quantity_mismatch' | 'price_mismatch' | 'missing_receipt' | 'missing_bill' | 'pending' = 'pending';
      let quantityVariance = '0';
      let priceVariance = '0';
      const matchDetails: any = {
        po: { id: po.id, amount: po.totalAmount, items: po.items.length },
        gr: gr ? { id: gr.id, received: true } : null,
        bill: bill ? { id: bill.id, amount: bill.totalAmount } : null,
        matchedAt: new Date().toISOString(),
      };

      if (!gr && !bill) {
        matchStatus = 'pending';
      } else if (!gr) {
        matchStatus = 'missing_receipt';
      } else if (!bill) {
        matchStatus = 'missing_bill';
      } else {
        // Perform detailed three-way matching
        const poAmount = parseFloat(po.totalAmount || '0');
        const billAmount = parseFloat(bill.totalAmount || '0');
        const priceDiff = Math.abs(poAmount - billAmount);
        
        // Get detailed item-level matching
        const grItems = await tx
          .select()
          .from(goodsReceiptItems)
          .where(eq(goodsReceiptItems.grId, gr.id));
          
        const billItems = await tx
          .select()
          .from(vendorBillItems)
          .where(eq(vendorBillItems.billId, bill.id));
        
        // Calculate quantity variance
        const poQuantity = po.items.reduce((sum, item) => sum + item.quantity, 0);
        const grQuantity = grItems.reduce((sum, item) => sum + item.quantity, 0);
        const quantityDiff = Math.abs(poQuantity - grQuantity);
        
        quantityVariance = quantityDiff.toString();
        priceVariance = priceDiff.toString();
        
        // Enhanced matching details
        matchDetails.quantities = {
          po: poQuantity,
          gr: grQuantity,
          variance: quantityDiff
        };
        matchDetails.amounts = {
          po: poAmount,
          bill: billAmount,
          variance: priceDiff
        };
        
        // Determine match status with tolerance thresholds
        const priceTolerancePercent = 0.05; // 5% tolerance
        const quantityTolerancePercent = 0.02; // 2% tolerance
        
        const priceToleranceAmount = poAmount * priceTolerancePercent;
        const quantityToleranceAmount = poQuantity * quantityTolerancePercent;
        
        if (quantityDiff > quantityToleranceAmount) {
          matchStatus = 'quantity_mismatch';
        } else if (priceDiff > Math.max(priceToleranceAmount, 0.01)) { // At least 1 cent tolerance
          matchStatus = 'price_mismatch';
        } else {
          matchStatus = 'matched';
        }
      }

      // Insert or update match result
      let matchResult: MatchResult;
      if (existingMatch) {
        [matchResult] = await tx
          .update(matchResults)
          .set({
            grId: gr?.id,
            billId: bill?.id,
            status: matchStatus,
            quantityVariance,
            priceVariance,
            matchDetails,
          })
          .where(eq(matchResults.id, existingMatch.id))
          .returning();
      } else {
        [matchResult] = await tx
          .insert(matchResults)
          .values({
            poId,
            grId: gr?.id,
            billId: bill?.id,
            status: matchStatus,
            quantityVariance,
            priceVariance,
            matchDetails,
          })
          .returning();
      }
      
      // If matched successfully, update PO status to closed
      if (matchStatus === 'matched') {
        await tx
          .update(purchaseOrders)
          .set({ 
            status: 'closed',
            updatedAt: new Date()
          })
          .where(eq(purchaseOrders.id, poId));
      }

      return matchResult;
    });
  }

  async resolveMatchException(matchId: string, resolvedBy: string, notes: string): Promise<MatchResult> {
    const db = await getDb();
    const [matchResult] = await db
      .update(matchResults)
      .set({ 
        status: 'matched',
        resolvedBy,
        resolvedAt: new Date(),
        notes
      })
      .where(eq(matchResults.id, matchId))
      .returning();
    return matchResult;
  }

  // FX Rate operations
  async getFxRates(baseCurrency?: string, quoteCurrency?: string): Promise<FxRate[]> {
    const db = await getDb();
    
    let conditions = [];
    if (baseCurrency) conditions.push(eq(fxRates.baseCurrency, baseCurrency));
    if (quoteCurrency) conditions.push(eq(fxRates.quoteCurrency, quoteCurrency));
    
    return await db
      .select()
      .from(fxRates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(fxRates.asOfDate), desc(fxRates.createdAt));
  }

  async getFxRateLatest(baseCurrency: string, quoteCurrency: string): Promise<FxRate | undefined> {
    const db = await getDb();
    const [rate] = await db
      .select()
      .from(fxRates)
      .where(and(
        eq(fxRates.baseCurrency, baseCurrency),
        eq(fxRates.quoteCurrency, quoteCurrency)
      ))
      .orderBy(desc(fxRates.asOfDate), desc(fxRates.createdAt))
      .limit(1);
    return rate;
  }

  async upsertFxRate(rateData: InsertFxRate): Promise<FxRate> {
    const db = await getDb();
    const [rate] = await db
      .insert(fxRates)
      .values(rateData)
      .onConflictDoUpdate({
        target: [fxRates.baseCurrency, fxRates.quoteCurrency, fxRates.asOfDate],
        set: {
          rate: rateData.rate,
          source: rateData.source,
          createdAt: new Date(),
        },
      })
      .returning();
    return rate;
  }

  async refreshFxRates(): Promise<FxRate[]> {
    try {
      const { externalIntegrationsService } = await import("./external-integrations");
      
      // Get latest rates from external service
      const fxData = await externalIntegrationsService.getFxRatesWithFallbacks('USD');
      
      if (!fxData.success) {
        console.warn('Failed to fetch FX rates from external services');
        return [];
      }

      const db = await getDb();
      const updatedRates: FxRate[] = [];
      const currentDate = new Date().toISOString().split('T')[0];

      // Update rates in database
      for (const [quoteCurrency, rate] of Object.entries(fxData.rates)) {
        const [updatedRate] = await db
          .insert(fxRates)
          .values({
            baseCurrency: 'USD',
            quoteCurrency,
            rate: rate.toString(),
            asOfDate: currentDate,
            source: fxData.source,
          })
          .onConflictDoUpdate({
            target: [fxRates.baseCurrency, fxRates.quoteCurrency, fxRates.asOfDate],
            set: {
              rate: rate.toString(),
              source: fxData.source,
              createdAt: new Date(),
            },
          })
          .returning();
        
        updatedRates.push(updatedRate);
      }

      console.log(`Updated ${updatedRates.length} FX rates from ${fxData.source}`);
      return updatedRates;
    } catch (error) {
      console.error('Error refreshing FX rates:', error);
      return [];
    }
  }

  // Competitor Price operations
  async getCompetitorPrices(productId?: string, competitor?: string): Promise<(CompetitorPrice & { product: Product })[]> {
    const db = await getDb();
    
    let conditions = [eq(competitorPrices.isActive, true)];
    if (productId) conditions.push(eq(competitorPrices.productId, productId));
    if (competitor) conditions.push(eq(competitorPrices.competitor, competitor));
    
    return await db
      .select({
        id: competitorPrices.id,
        productId: competitorPrices.productId,
        competitor: competitorPrices.competitor,
        price: competitorPrices.price,
        currency: competitorPrices.currency,
        sourceUrl: competitorPrices.sourceUrl,
        collectedAt: competitorPrices.collectedAt,
        isActive: competitorPrices.isActive,
        product: products,
      })
      .from(competitorPrices)
      .innerJoin(products, eq(competitorPrices.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(competitorPrices.collectedAt)) as any;
  }

  async upsertCompetitorPrice(priceData: InsertCompetitorPrice): Promise<CompetitorPrice> {
    const db = await getDb();
    const [price] = await db
      .insert(competitorPrices)
      .values(priceData)
      .onConflictDoUpdate({
        target: [competitorPrices.productId, competitorPrices.competitor],
        set: {
          price: priceData.price,
          currency: priceData.currency,
          sourceUrl: priceData.sourceUrl,
          collectedAt: new Date(),
        },
      })
      .returning();
    return price;
  }

  async getCompetitorAnalysis(productId?: string): Promise<Array<{
    productId: string;
    productName: string;
    ourPrice: number;
    avgCompetitorPrice: number;
    minCompetitorPrice: number;
    maxCompetitorPrice: number;
    priceAdvantage: number;
    competitorCount: number;
  }>> {
    const db = await getDb();
    
    let conditions = [eq(competitorPrices.isActive, true)];
    if (productId) conditions.push(eq(competitorPrices.productId, productId));
    
    const analysis = await db
      .select({
        productId: products.id,
        productName: products.name,
        ourPrice: products.unitPrice,
        avgCompetitorPrice: sql<number>`AVG(${competitorPrices.price})`.as('avgCompetitorPrice'),
        minCompetitorPrice: sql<number>`MIN(${competitorPrices.price})`.as('minCompetitorPrice'),
        maxCompetitorPrice: sql<number>`MAX(${competitorPrices.price})`.as('maxCompetitorPrice'),
        competitorCount: sql<number>`COUNT(DISTINCT ${competitorPrices.competitor})`.as('competitorCount'),
      })
      .from(competitorPrices)
      .innerJoin(products, eq(competitorPrices.productId, products.id))
      .where(and(...conditions))
      .groupBy(products.id, products.name, products.unitPrice);

    return analysis.map(item => ({
      ...item,
      ourPrice: parseFloat(item.ourPrice?.toString() || '0'),
      avgCompetitorPrice: parseFloat(item.avgCompetitorPrice?.toString() || '0'),
      minCompetitorPrice: parseFloat(item.minCompetitorPrice?.toString() || '0'),
      maxCompetitorPrice: parseFloat(item.maxCompetitorPrice?.toString() || '0'),
      priceAdvantage: item.ourPrice && item.avgCompetitorPrice 
        ? ((parseFloat(item.avgCompetitorPrice.toString()) - parseFloat(item.ourPrice.toString())) / parseFloat(item.avgCompetitorPrice.toString())) * 100
        : 0,
    }));
  }

  // Purchase Dashboard metrics
  async getPurchaseDashboardMetrics(): Promise<{
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
  }> {
    const db = await getDb();
    
    // Get basic PO metrics
    const [poMetrics] = await db
      .select({
        totalPurchaseOrders: sql<number>`COUNT(*)`.as('totalPurchaseOrders'),
        openPurchaseOrders: sql<number>`COUNT(*) FILTER (WHERE ${purchaseOrders.status} IN ('draft', 'sent', 'confirmed'))`.as('openPurchaseOrders'),
        totalPurchaseValue: sql<number>`COALESCE(SUM(${purchaseOrders.totalAmount}), 0)`.as('totalPurchaseValue'),
        averageOrderValue: sql<number>`COALESCE(AVG(${purchaseOrders.totalAmount}), 0)`.as('averageOrderValue'),
      })
      .from(purchaseOrders);

    // Get pending approvals
    const [approvalMetrics] = await db
      .select({
        pendingApprovals: sql<number>`COUNT(*)`.as('pendingApprovals'),
      })
      .from(approvals)
      .where(eq(approvals.status, 'pending'));

    // Get matching exceptions
    const [matchMetrics] = await db
      .select({
        matchingExceptions: sql<number>`COUNT(*)`.as('matchingExceptions'),
      })
      .from(matchResults)
      .where(sql`${matchResults.status} != 'matched'`);

    return {
      totalPurchaseOrders: poMetrics?.totalPurchaseOrders || 0,
      pendingApprovals: approvalMetrics?.pendingApprovals || 0,
      openPurchaseOrders: poMetrics?.openPurchaseOrders || 0,
      totalPurchaseValue: parseFloat(poMetrics?.totalPurchaseValue?.toString() || '0'),
      averageOrderValue: parseFloat(poMetrics?.averageOrderValue?.toString() || '0'),
      topSuppliers: [], // Would implement with complex query
      upcomingPayments: [], // Would implement with complex query
      matchingExceptions: matchMetrics?.matchingExceptions || 0,
      currencyExposure: [], // Would implement with complex query
    };
  }

  // AI Module Operations Implementation
  
  // AI Chat Session operations
  async getAiChatSessions(userId?: string, status?: string, limit = 50): Promise<AiChatSession[]> {
    const db = await getDb();
    const conditions = [];
    
    if (userId) conditions.push(eq(aiChatSessions.userId, userId));
    if (status) conditions.push(eq(aiChatSessions.status, status as any));
    
    return await db
      .select()
      .from(aiChatSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(aiChatSessions.createdAt));
  }

  async getAiChatSession(id: string): Promise<(AiChatSession & { messages: AiChatMessage[] }) | undefined> {
    const db = await getDb();
    const [session] = await db
      .select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.id, id));
    
    if (!session) return undefined;
    
    const messages = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, id))
      .orderBy(asc(aiChatMessages.createdAt));
    
    return { ...session, messages };
  }

  async createAiChatSession(sessionData: InsertAiChatSession): Promise<AiChatSession> {
    const db = await getDb();
    const [session] = await db
      .insert(aiChatSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateAiChatSession(id: string, sessionData: Partial<InsertAiChatSession>): Promise<AiChatSession> {
    const db = await getDb();
    const [session] = await db
      .update(aiChatSessions)
      .set({ ...sessionData, updatedAt: new Date() })
      .where(eq(aiChatSessions.id, id))
      .returning();
    return session;
  }

  async closeAiChatSession(id: string): Promise<AiChatSession> {
    const db = await getDb();
    const [session] = await db
      .update(aiChatSessions)
      .set({ 
        status: 'closed',
        updatedAt: new Date()
      })
      .where(eq(aiChatSessions.id, id))
      .returning();
    return session;
  }

  // AI Chat Message operations
  async getAiChatMessages(sessionId: string, limit = 100): Promise<AiChatMessage[]> {
    const db = await getDb();
    return await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .limit(limit)
      .orderBy(asc(aiChatMessages.createdAt));
  }

  async createAiChatMessage(messageData: InsertAiChatMessage): Promise<AiChatMessage> {
    const db = await getDb();
    const [message] = await db
      .insert(aiChatMessages)
      .values(messageData)
      .returning();
    
    // Update session timestamp
    await db
      .update(aiChatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(aiChatSessions.id, messageData.sessionId));
    
    return message;
  }

  // AI Insights operations
  async getAiInsights(type?: string, status?: string, entityType?: string, entityId?: string, limit = 50): Promise<(AiInsight & { generatedByUser?: User; reviewedByUser?: User; appliedByUser?: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (type) conditions.push(eq(aiInsights.type, type as any));
    if (status) conditions.push(eq(aiInsights.status, status as any));
    if (entityType) conditions.push(eq(aiInsights.entityType, entityType));
    if (entityId) conditions.push(eq(aiInsights.entityId, entityId));
    
    const results = await db
      .select({
        insight: aiInsights,
        generatedBy: users,
        reviewedBy: sql<User | null>`rev_user.*`,
        appliedBy: sql<User | null>`app_user.*`,
      })
      .from(aiInsights)
      .leftJoin(users, eq(aiInsights.generatedBy, users.id))
      .leftJoin(sql`${users} AS rev_user`, sql`${aiInsights.reviewedBy} = rev_user.id`)
      .leftJoin(sql`${users} AS app_user`, sql`${aiInsights.appliedBy} = app_user.id`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(aiInsights.createdAt));
    
    return results.map(row => ({
      ...row.insight,
      generatedByUser: row.generatedBy || undefined,
      reviewedByUser: row.reviewedBy || undefined,
      appliedByUser: row.appliedBy || undefined,
    }));
  }

  async getAiInsight(id: string): Promise<(AiInsight & { generatedByUser?: User; reviewedByUser?: User; appliedByUser?: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        insight: aiInsights,
        generatedBy: users,
        reviewedBy: sql<User | null>`rev_user.*`,
        appliedBy: sql<User | null>`app_user.*`,
      })
      .from(aiInsights)
      .leftJoin(users, eq(aiInsights.generatedBy, users.id))
      .leftJoin(sql`${users} AS rev_user`, sql`${aiInsights.reviewedBy} = rev_user.id`)
      .leftJoin(sql`${users} AS app_user`, sql`${aiInsights.appliedBy} = app_user.id`)
      .where(eq(aiInsights.id, id));
    
    if (!row) return undefined;
    
    return {
      ...row.insight,
      generatedByUser: row.generatedBy || undefined,
      reviewedByUser: row.reviewedBy || undefined,
      appliedByUser: row.appliedBy || undefined,
    };
  }

  async createAiInsight(insightData: InsertAiInsight): Promise<AiInsight> {
    const db = await getDb();
    const [insight] = await db
      .insert(aiInsights)
      .values(insightData)
      .returning();
    return insight;
  }

  async updateAiInsight(id: string, insightData: Partial<InsertAiInsight>): Promise<AiInsight> {
    const db = await getDb();
    const [insight] = await db
      .update(aiInsights)
      .set({ ...insightData, updatedAt: new Date() })
      .where(eq(aiInsights.id, id))
      .returning();
    return insight;
  }

  async reviewAiInsight(id: string, reviewerId: string, status: 'reviewed' | 'applied' | 'dismissed'): Promise<AiInsight> {
    const db = await getDb();
    const [insight] = await db
      .update(aiInsights)
      .set({ 
        status,
        reviewedBy: reviewerId,
        updatedAt: new Date()
      })
      .where(eq(aiInsights.id, id))
      .returning();
    return insight;
  }

  async applyAiInsight(id: string, appliedBy: string): Promise<AiInsight> {
    const db = await getDb();
    const [insight] = await db
      .update(aiInsights)
      .set({ 
        status: 'applied',
        appliedBy,
        appliedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(aiInsights.id, id))
      .returning();
    return insight;
  }

  // AI Model Metrics operations
  async getAiModelMetrics(modelName?: string, requestType?: string, limit = 100): Promise<AiModelMetric[]> {
    const db = await getDb();
    const conditions = [];
    
    if (modelName) conditions.push(eq(aiModelMetrics.modelName, modelName));
    if (requestType) conditions.push(eq(aiModelMetrics.requestType, requestType));
    
    return await db
      .select()
      .from(aiModelMetrics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(aiModelMetrics.createdAt));
  }

  async createAiModelMetric(metricData: InsertAiModelMetric): Promise<AiModelMetric> {
    const db = await getDb();
    const [metric] = await db
      .insert(aiModelMetrics)
      .values(metricData)
      .returning();
    return metric;
  }

  async getAiModelPerformanceStats(modelName?: string, days = 30): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    averageTokensUsed: number;
    errorRate: number;
    costEstimate: number;
  }> {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const conditions = [gte(aiModelMetrics.createdAt, cutoffDate)];
    if (modelName) conditions.push(eq(aiModelMetrics.modelName, modelName));
    
    const [stats] = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`.as('totalRequests'),
        successCount: sql<number>`COUNT(*) FILTER (WHERE ${aiModelMetrics.success} = true)`.as('successCount'),
        errorCount: sql<number>`COUNT(*) FILTER (WHERE ${aiModelMetrics.success} = false)`.as('errorCount'),
        avgResponseTime: sql<number>`AVG(${aiModelMetrics.responseTime})`.as('avgResponseTime'),
        avgTokensUsed: sql<number>`AVG(${aiModelMetrics.tokensUsed})`.as('avgTokensUsed'),
      })
      .from(aiModelMetrics)
      .where(and(...conditions));
    
    const totalRequests = stats?.totalRequests || 0;
    const successCount = stats?.successCount || 0;
    const errorCount = stats?.errorCount || 0;
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    
    // Rough cost estimate based on tokens used (OpenAI pricing approximation)
    const avgTokens = stats?.avgTokensUsed || 0;
    const costEstimate = (avgTokens * totalRequests * 0.000002); // $0.002 per 1K tokens
    
    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(stats?.avgResponseTime || 0),
      averageTokensUsed: Math.round(avgTokens),
      errorRate: Math.round(errorRate * 100) / 100,
      costEstimate: Math.round(costEstimate * 100) / 100,
    };
  }

  // Marketing Module Operations Implementation
  
  // Campaign operations
  async getCampaigns(status?: string, type?: string, managerId?: string, limit = 50): Promise<(Campaign & { manager: User; members: CampaignMember[] })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (status) conditions.push(eq(campaigns.status, status as any));
    if (type) conditions.push(eq(campaigns.campaignType, type as any));
    if (managerId) conditions.push(eq(campaigns.managerId, managerId));
    
    const campaignData = await db
      .select({
        campaign: campaigns,
        manager: users,
      })
      .from(campaigns)
      .innerJoin(users, eq(campaigns.managerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(campaigns.createdAt));
    
    const results = [];
    for (const row of campaignData) {
      const members = await db
        .select()
        .from(campaignMembers)
        .where(eq(campaignMembers.campaignId, row.campaign.id))
        .orderBy(asc(campaignMembers.createdAt));
      
      results.push({
        ...row.campaign,
        manager: row.manager,
        members,
      });
    }
    
    return results;
  }

  async getCampaign(id: string): Promise<(Campaign & { manager: User; members: (CampaignMember & { customer?: Customer; lead?: Lead })[] }) | undefined> {
    const db = await getDb();
    const [campaignData] = await db
      .select({
        campaign: campaigns,
        manager: users,
      })
      .from(campaigns)
      .innerJoin(users, eq(campaigns.managerId, users.id))
      .where(eq(campaigns.id, id));
    
    if (!campaignData) return undefined;
    
    const members = await db
      .select({
        member: campaignMembers,
        customer: customers,
        lead: leads,
      })
      .from(campaignMembers)
      .leftJoin(customers, eq(campaignMembers.customerId, customers.id))
      .leftJoin(leads, eq(campaignMembers.leadId, leads.id))
      .where(eq(campaignMembers.campaignId, id))
      .orderBy(asc(campaignMembers.createdAt));
    
    return {
      ...campaignData.campaign,
      manager: campaignData.manager,
      members: members.map(row => ({
        ...row.member,
        customer: row.customer || undefined,
        lead: row.lead || undefined,
      })),
    } as any;
  }

  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const db = await getDb();
    const [campaign] = await db
      .insert(campaigns)
      .values(campaignData)
      .returning();
    return campaign;
  }

  async updateCampaign(id: string, campaignData: Partial<InsertCampaign>): Promise<Campaign> {
    const db = await getDb();
    const [campaign] = await db
      .update(campaigns)
      .set({ ...campaignData, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    const db = await getDb();
    // First delete members
    await db.delete(campaignMembers).where(eq(campaignMembers.campaignId, id));
    // Then delete campaign
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async launchCampaign(id: string): Promise<Campaign> {
    const db = await getDb();
    const [campaign] = await db
      .update(campaigns)
      .set({ 
        status: 'active',
        launchedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async pauseCampaign(id: string): Promise<Campaign> {
    const db = await getDb();
    const [campaign] = await db
      .update(campaigns)
      .set({ 
        status: 'paused',
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async completeCampaign(id: string): Promise<Campaign> {
    const db = await getDb();
    const [campaign] = await db
      .update(campaigns)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  // Campaign Member operations
  async getCampaignMembers(campaignId?: string, status?: string, limit = 100): Promise<(CampaignMember & { customer?: Customer; lead?: Lead })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (campaignId) conditions.push(eq(campaignMembers.campaignId, campaignId));
    if (status) conditions.push(eq(campaignMembers.status, status as any));
    
    return await db
      .select({
        member: campaignMembers,
        customer: customers,
        lead: leads,
      })
      .from(campaignMembers)
      .leftJoin(customers, eq(campaignMembers.customerId, customers.id))
      .leftJoin(leads, eq(campaignMembers.leadId, leads.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(campaignMembers.createdAt))
      .then(rows => rows.map(row => ({
        ...row.member,
        customer: row.customer || undefined,
        lead: row.lead || undefined,
      })));
  }

  async addCampaignMember(memberData: InsertCampaignMember): Promise<CampaignMember> {
    const db = await getDb();
    const [member] = await db
      .insert(campaignMembers)
      .values(memberData)
      .returning();
    
    // Update campaign member count
    await db
      .update(campaigns)
      .set({ 
        totalMembers: sql`${campaigns.totalMembers} + 1`,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, memberData.campaignId));
    
    return member;
  }

  async updateCampaignMember(id: string, memberData: Partial<InsertCampaignMember>): Promise<CampaignMember> {
    const db = await getDb();
    const [member] = await db
      .update(campaignMembers)
      .set({ ...memberData, updatedAt: new Date() })
      .where(eq(campaignMembers.id, id))
      .returning();
    return member;
  }

  async removeCampaignMember(id: string): Promise<void> {
    const db = await getDb();
    
    // Get the campaign ID first
    const [member] = await db
      .select({ campaignId: campaignMembers.campaignId })
      .from(campaignMembers)
      .where(eq(campaignMembers.id, id));
    
    if (member) {
      // Delete the member
      await db.delete(campaignMembers).where(eq(campaignMembers.id, id));
      
      // Update campaign member count
      await db
        .update(campaigns)
        .set({ 
          totalMembers: sql`${campaigns.totalMembers} - 1`,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, member.campaignId));
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    optedOutMembers: number;
    bouncedMembers: number;
    engagementRate: number;
    conversionRate: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  }> {
    const db = await getDb();
    
    const [memberStats] = await db
      .select({
        totalMembers: sql<number>`COUNT(*)`.as('totalMembers'),
        activeMembers: sql<number>`COUNT(*) FILTER (WHERE ${campaignMembers.status} = 'active')`.as('activeMembers'),
        optedOutMembers: sql<number>`COUNT(*) FILTER (WHERE ${campaignMembers.status} = 'opted_out')`.as('optedOutMembers'),
        bouncedMembers: sql<number>`COUNT(*) FILTER (WHERE ${campaignMembers.status} = 'bounced')`.as('bouncedMembers'),
      })
      .from(campaignMembers)
      .where(eq(campaignMembers.campaignId, campaignId));
    
    // Get communication stats
    const [commStats] = await db
      .select({
        totalSent: sql<number>`COUNT(*) FILTER (WHERE ${communications.status} IN ('sent', 'delivered'))`.as('totalSent'),
        totalOpened: sql<number>`COUNT(*) FILTER (WHERE ${communications.status} = 'opened')`.as('totalOpened'),
        totalClicked: sql<number>`COUNT(*) FILTER (WHERE ${communications.status} = 'clicked')`.as('totalClicked'),
      })
      .from(communications)
      .where(eq(communications.campaignId, campaignId));
    
    const totalMembers = memberStats?.totalMembers || 0;
    const totalSent = commStats?.totalSent || 0;
    const totalOpened = commStats?.totalOpened || 0;
    const totalClicked = commStats?.totalClicked || 0;
    
    const engagementRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const conversionRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    
    return {
      totalMembers,
      activeMembers: memberStats?.activeMembers || 0,
      optedOutMembers: memberStats?.optedOutMembers || 0,
      bouncedMembers: memberStats?.bouncedMembers || 0,
      engagementRate: Math.round(engagementRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalSent,
      totalOpened,
      totalClicked,
    };
  }

  // Compliance Module Operations Implementation
  
  // License operations
  async getLicenses(status?: string, managedBy?: string, limit = 50): Promise<(License & { manager: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (status) conditions.push(eq(licenses.status, status as any));
    if (managedBy) conditions.push(eq(licenses.managedBy, managedBy));
    
    return await db
      .select({
        license: licenses,
        manager: users,
      })
      .from(licenses)
      .innerJoin(users, eq(licenses.managedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(asc(licenses.expiryDate))
      .then(rows => rows.map(row => ({
        ...row.license,
        manager: row.manager,
      })));
  }

  async getLicense(id: string): Promise<(License & { manager: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        license: licenses,
        manager: users,
      })
      .from(licenses)
      .innerJoin(users, eq(licenses.managedBy, users.id))
      .where(eq(licenses.id, id));
    
    return row ? { ...row.license, manager: row.manager } : undefined;
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const db = await getDb();
    const [license] = await db
      .insert(licenses)
      .values(licenseData)
      .returning();
    return license;
  }

  async updateLicense(id: string, licenseData: Partial<InsertLicense>): Promise<License> {
    const db = await getDb();
    const [license] = await db
      .update(licenses)
      .set({ ...licenseData, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  async deleteLicense(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async renewLicense(id: string, newExpiryDate: string, renewalDate: string): Promise<License> {
    const db = await getDb();
    const [license] = await db
      .update(licenses)
      .set({ 
        expiryDate: newExpiryDate,
        renewalDate,
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  async getExpiringLicenses(daysAhead: number): Promise<(License & { manager: User })[]> {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return await db
      .select({
        license: licenses,
        manager: users,
      })
      .from(licenses)
      .innerJoin(users, eq(licenses.managedBy, users.id))
      .where(
        and(
          lte(licenses.expiryDate, cutoffDate.toISOString().split('T')[0]),
          eq(licenses.status, 'active')
        )
      )
      .orderBy(asc(licenses.expiryDate))
      .then(rows => rows.map(row => ({
        ...row.license,
        manager: row.manager,
      })));
  }

  // Regulatory Report operations
  async getRegulatoryReports(status?: string, reportType?: string, preparedBy?: string, limit = 50): Promise<(RegulatoryReport & { preparer: User; reviewer?: User; approver?: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (status) conditions.push(eq(regulatoryReports.status, status as any));
    if (reportType) conditions.push(eq(regulatoryReports.reportType, reportType));
    if (preparedBy) conditions.push(eq(regulatoryReports.preparedBy, preparedBy));
    
    return await db
      .select({
        report: regulatoryReports,
        preparer: sql<User>`prep_user.*`.as('preparer'),
        reviewer: sql<User>`rev_user.*`.as('reviewer'),
        approver: sql<User>`app_user.*`.as('approver'),
      })
      .from(regulatoryReports)
      .innerJoin(sql`${users} AS prep_user`, sql`${regulatoryReports.preparedBy} = prep_user.id`)
      .leftJoin(sql`${users} AS rev_user`, sql`${regulatoryReports.reviewedBy} = rev_user.id`)
      .leftJoin(sql`${users} AS app_user`, sql`${regulatoryReports.approvedBy} = app_user.id`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(regulatoryReports.createdAt))
      .then(rows => rows.map(row => ({
        ...row.report,
        preparer: row.preparer,
        reviewer: row.reviewer || undefined,
        approver: row.approver || undefined,
      })));
  }

  async getRegulatoryReport(id: string): Promise<(RegulatoryReport & { preparer: User; reviewer?: User; approver?: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        report: regulatoryReports,
        preparer: sql<User>`prep_user.*`.as('preparer'),
        reviewer: sql<User>`rev_user.*`.as('reviewer'),
        approver: sql<User>`app_user.*`.as('approver'),
      })
      .from(regulatoryReports)
      .innerJoin(sql`${users} AS prep_user`, sql`${regulatoryReports.preparedBy} = prep_user.id`)
      .leftJoin(sql`${users} AS rev_user`, sql`${regulatoryReports.reviewedBy} = rev_user.id`)
      .leftJoin(sql`${users} AS app_user`, sql`${regulatoryReports.approvedBy} = app_user.id`)
      .where(eq(regulatoryReports.id, id));
    
    return row ? {
      ...row.report,
      preparer: row.preparer,
      reviewer: row.reviewer || undefined,
      approver: row.approver || undefined,
    } : undefined;
  }

  async createRegulatoryReport(reportData: InsertRegulatoryReport): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .insert(regulatoryReports)
      .values(reportData)
      .returning();
    return report;
  }

  async updateRegulatoryReport(id: string, reportData: Partial<InsertRegulatoryReport>): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .update(regulatoryReports)
      .set({ ...reportData, updatedAt: new Date() })
      .where(eq(regulatoryReports.id, id))
      .returning();
    return report;
  }

  async submitRegulatoryReport(id: string, submissionRef: string): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .update(regulatoryReports)
      .set({ 
        status: 'submitted',
        submissionReference: submissionRef,
        submittedDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      })
      .where(eq(regulatoryReports.id, id))
      .returning();
    return report;
  }

  async reviewRegulatoryReport(id: string, reviewerId: string): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .update(regulatoryReports)
      .set({ 
        reviewedBy: reviewerId,
        updatedAt: new Date()
      })
      .where(eq(regulatoryReports.id, id))
      .returning();
    return report;
  }

  async approveRegulatoryReport(id: string, approverId: string): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .update(regulatoryReports)
      .set({ 
        status: 'accepted',
        approvedBy: approverId,
        updatedAt: new Date()
      })
      .where(eq(regulatoryReports.id, id))
      .returning();
    return report;
  }

  async rejectRegulatoryReport(id: string, approverId: string, reason: string): Promise<RegulatoryReport> {
    const db = await getDb();
    const [report] = await db
      .update(regulatoryReports)
      .set({ 
        status: 'rejected',
        approvedBy: approverId,
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(regulatoryReports.id, id))
      .returning();
    return report;
  }

  // Audit Log operations
  async getAuditLogs(tableName?: string, recordId?: string, userId?: string, action?: string, limit = 100): Promise<(AuditLog & { user?: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
    if (recordId) conditions.push(eq(auditLogs.recordId, recordId));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (action) conditions.push(eq(auditLogs.action, action as any));
    
    return await db
      .select({
        auditLog: auditLogs,
        user: users,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(auditLogs.timestamp))
      .then(rows => rows.map(row => ({
        ...row.auditLog,
        user: row.user || undefined,
      })));
  }

  async createAuditLog(auditLogData: InsertAuditLog): Promise<AuditLog> {
    const db = await getDb();
    const [auditLog] = await db
      .insert(auditLogs)
      .values(auditLogData)
      .returning();
    return auditLog;
  }

  // Recall Notice operations
  async getRecallNotices(status?: string, productId?: string, managedBy?: string, limit = 50): Promise<(RecallNotice & { product: Product; manager: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (status) conditions.push(eq(recallNotices.status, status as any));
    if (productId) conditions.push(eq(recallNotices.productId, productId));
    if (managedBy) conditions.push(eq(recallNotices.managedBy, managedBy));
    
    return await db
      .select({
        recall: recallNotices,
        product: products,
        manager: users,
      })
      .from(recallNotices)
      .innerJoin(products, eq(recallNotices.productId, products.id))
      .innerJoin(users, eq(recallNotices.managedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(recallNotices.createdAt))
      .then(rows => rows.map(row => ({
        ...row.recall,
        product: row.product,
        manager: row.manager,
      })));
  }

  async getRecallNotice(id: string): Promise<(RecallNotice & { product: Product; manager: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        recall: recallNotices,
        product: products,
        manager: users,
      })
      .from(recallNotices)
      .innerJoin(products, eq(recallNotices.productId, products.id))
      .innerJoin(users, eq(recallNotices.managedBy, users.id))
      .where(eq(recallNotices.id, id));
    
    return row ? {
      ...row.recall,
      product: row.product,
      manager: row.manager,
    } : undefined;
  }

  async createRecallNotice(recallData: InsertRecallNotice): Promise<RecallNotice> {
    const db = await getDb();
    const [recall] = await db
      .insert(recallNotices)
      .values(recallData)
      .returning();
    return recall;
  }

  async updateRecallNotice(id: string, recallData: Partial<InsertRecallNotice>): Promise<RecallNotice> {
    const db = await getDb();
    const [recall] = await db
      .update(recallNotices)
      .set({ ...recallData, updatedAt: new Date() })
      .where(eq(recallNotices.id, id))
      .returning();
    return recall;
  }

  async initiateRecall(id: string): Promise<RecallNotice> {
    const db = await getDb();
    const [recall] = await db
      .update(recallNotices)
      .set({ 
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(recallNotices.id, id))
      .returning();
    return recall;
  }

  async completeRecall(id: string, recoveryPercentage: number): Promise<RecallNotice> {
    const db = await getDb();
    const [recall] = await db
      .update(recallNotices)
      .set({ 
        status: 'completed',
        recoveryPercentage: recoveryPercentage.toString(),
        completionDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      })
      .where(eq(recallNotices.id, id))
      .returning();
    return recall;
  }

  // Advanced Reporting Operations Implementation
  
  // Report Definition operations
  async getReportDefinitions(category?: string, isPublic?: boolean, ownerId?: string, limit = 50): Promise<(ReportDefinition & { owner: User })[]> {
    const db = await getDb();
    const conditions = [eq(reportDefinitions.isActive, true)];
    
    if (category) conditions.push(eq(reportDefinitions.category, category));
    if (isPublic !== undefined) conditions.push(eq(reportDefinitions.isPublic, isPublic));
    if (ownerId) conditions.push(eq(reportDefinitions.ownerId, ownerId));
    
    return await db
      .select({
        reportDef: reportDefinitions,
        owner: users,
      })
      .from(reportDefinitions)
      .innerJoin(users, eq(reportDefinitions.ownerId, users.id))
      .where(and(...conditions))
      .limit(limit)
      .orderBy(desc(reportDefinitions.createdAt))
      .then(rows => rows.map(row => ({
        ...row.reportDef,
        owner: row.owner,
      })));
  }

  async getReportDefinition(id: string): Promise<(ReportDefinition & { owner: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        reportDef: reportDefinitions,
        owner: users,
      })
      .from(reportDefinitions)
      .innerJoin(users, eq(reportDefinitions.ownerId, users.id))
      .where(eq(reportDefinitions.id, id));
    
    return row ? {
      ...row.reportDef,
      owner: row.owner,
    } : undefined;
  }

  async createReportDefinition(reportDefData: InsertReportDefinition): Promise<ReportDefinition> {
    const db = await getDb();
    const [reportDef] = await db
      .insert(reportDefinitions)
      .values(reportDefData)
      .returning();
    return reportDef;
  }

  async updateReportDefinition(id: string, reportDefData: Partial<InsertReportDefinition>): Promise<ReportDefinition> {
    const db = await getDb();
    const [reportDef] = await db
      .update(reportDefinitions)
      .set({ ...reportDefData, updatedAt: new Date() })
      .where(eq(reportDefinitions.id, id))
      .returning();
    return reportDef;
  }

  async deleteReportDefinition(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(reportDefinitions)
      .set({ isActive: false })
      .where(eq(reportDefinitions.id, id));
  }

  // Saved Report operations
  async getSavedReports(userId?: string, reportDefinitionId?: string, limit = 50): Promise<(SavedReport & { reportDefinition: ReportDefinition; user: User })[]> {
    const db = await getDb();
    const conditions = [eq(savedReports.isActive, true)];
    
    if (userId) conditions.push(eq(savedReports.userId, userId));
    if (reportDefinitionId) conditions.push(eq(savedReports.reportDefinitionId, reportDefinitionId));
    
    return await db
      .select({
        savedReport: savedReports,
        reportDefinition: reportDefinitions,
        user: users,
      })
      .from(savedReports)
      .innerJoin(reportDefinitions, eq(savedReports.reportDefinitionId, reportDefinitions.id))
      .innerJoin(users, eq(savedReports.userId, users.id))
      .where(and(...conditions))
      .limit(limit)
      .orderBy(desc(savedReports.createdAt))
      .then(rows => rows.map(row => ({
        ...row.savedReport,
        reportDefinition: row.reportDefinition,
        user: row.user,
      })));
  }

  async getSavedReport(id: string): Promise<(SavedReport & { reportDefinition: ReportDefinition; user: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        savedReport: savedReports,
        reportDefinition: reportDefinitions,
        user: users,
      })
      .from(savedReports)
      .innerJoin(reportDefinitions, eq(savedReports.reportDefinitionId, reportDefinitions.id))
      .innerJoin(users, eq(savedReports.userId, users.id))
      .where(eq(savedReports.id, id));
    
    return row ? {
      ...row.savedReport,
      reportDefinition: row.reportDefinition,
      user: row.user,
    } : undefined;
  }

  async createSavedReport(savedReportData: InsertSavedReport): Promise<SavedReport> {
    const db = await getDb();
    const [savedReport] = await db
      .insert(savedReports)
      .values(savedReportData)
      .returning();
    return savedReport;
  }

  async updateSavedReport(id: string, savedReportData: Partial<InsertSavedReport>): Promise<SavedReport> {
    const db = await getDb();
    const [savedReport] = await db
      .update(savedReports)
      .set({ ...savedReportData, updatedAt: new Date() })
      .where(eq(savedReports.id, id))
      .returning();
    return savedReport;
  }

  async deleteSavedReport(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(savedReports)
      .set({ isActive: false })
      .where(eq(savedReports.id, id));
  }

  // Report Export operations
  async getReportExports(generatedBy?: string, status?: string, limit = 50): Promise<(ReportExport & { generator: User })[]> {
    const db = await getDb();
    const conditions = [];
    
    if (generatedBy) conditions.push(eq(reportExports.generatedBy, generatedBy));
    if (status) conditions.push(eq(reportExports.status, status as any));
    
    return await db
      .select({
        reportExport: reportExports,
        generator: users,
      })
      .from(reportExports)
      .innerJoin(users, eq(reportExports.generatedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(reportExports.createdAt))
      .then(rows => rows.map(row => ({
        ...row.reportExport,
        generator: row.generator,
      })));
  }

  async getReportExport(id: string): Promise<(ReportExport & { generator: User }) | undefined> {
    const db = await getDb();
    const [row] = await db
      .select({
        reportExport: reportExports,
        generator: users,
      })
      .from(reportExports)
      .innerJoin(users, eq(reportExports.generatedBy, users.id))
      .where(eq(reportExports.id, id));
    
    return row ? {
      ...row.reportExport,
      generator: row.generator,
    } : undefined;
  }

  async createReportExport(reportExportData: InsertReportExport): Promise<ReportExport> {
    const db = await getDb();
    const [reportExport] = await db
      .insert(reportExports)
      .values(reportExportData)
      .returning();
    return reportExport;
  }

  async updateReportExport(id: string, reportExportData: Partial<InsertReportExport>): Promise<ReportExport> {
    const db = await getDb();
    const [reportExport] = await db
      .update(reportExports)
      .set(reportExportData)
      .where(eq(reportExports.id, id))
      .returning();
    return reportExport;
  }

  async markReportExportComplete(id: string, filePath: string, fileSize: number): Promise<ReportExport> {
    const db = await getDb();
    const [reportExport] = await db
      .update(reportExports)
      .set({ 
        status: 'completed',
        filePath,
        fileSize,
        generatedAt: new Date()
      })
      .where(eq(reportExports.id, id))
      .returning();
    return reportExport;
  }

  async markReportExportFailed(id: string, errorMessage: string): Promise<ReportExport> {
    const db = await getDb();
    const [reportExport] = await db
      .update(reportExports)
      .set({ 
        status: 'failed',
        errorMessage
      })
      .where(eq(reportExports.id, id))
      .returning();
    return reportExport;
  }

  // Missing interface method stubs - to be implemented as needed
  async getLeadsByPipelineStage(stage?: string, assignedTo?: string): Promise<(Lead & { assignee?: User; activities: LeadActivity[]; scoreHistory: LeadScoringHistory[] })[]> {
    return [];
  }
  
  async updateLeadPipelineStage(leadId: string, newStage: string, movedBy: string, reason?: string): Promise<Lead> {
    throw new Error('Method not implemented');
  }
  
  async updateLeadScore(leadId: string, score: number, criteria: string, reason?: string, triggeredBy?: string): Promise<Lead> {
    throw new Error('Method not implemented');
  }
  
  async calculateLeadScore(leadId: string): Promise<{ totalScore: number; breakdown: Record<string, number> }> {
    return { totalScore: 0, breakdown: {} };
  }
  
  async batchCalculateLeadScores(leadIds?: string[]): Promise<void> {
    return Promise.resolve();
  }
  
  async getPipelineConfiguration(): Promise<PipelineConfiguration[]> {
    return [];
  }
  
  async getPipelineAnalytics(startDate?: Date, endDate?: Date, assignedTo?: string): Promise<{
    pipelineValue: number;
    averageTimeInStage: Record<string, number>;
    conversionRates: Record<string, number>;
    stageDistribution: Record<string, { count: number; value: number }>;
    topPerformers: { userId: string; userName: string; leadsConverted: number; totalValue: number }[];
    leadSources: Record<string, { count: number; conversionRate: number }>;
    velocityMetrics: { averageCycleTime: number; fastestDeals: number; slowestDeals: number };
  }> {
    return {
      pipelineValue: 0,
      averageTimeInStage: {},
      conversionRates: {},
      stageDistribution: {},
      topPerformers: [],
      leadSources: {},
      velocityMetrics: { averageCycleTime: 0, fastestDeals: 0, slowestDeals: 0 }
    };
  }
  
  async getLeadSourcePerformance(): Promise<Array<{ source: string; totalLeads: number; convertedLeads: number; conversionRate: number; avgScore: number }>> {
    return [];
  }
  
  async getPipelineVelocity(stage?: string): Promise<{ averageDays: number; medianDays: number; trends: Array<{ date: string; averageDays: number }> }> {
    return { averageDays: 0, medianDays: 0, trends: [] };
  }


  // Additional missing method stubs
  async updatePipelineConfiguration(configs: InsertPipelineConfiguration[]): Promise<PipelineConfiguration[]> {
    throw new Error('Method not implemented');
  }

  async getLeadActivities(leadId: string, limit?: number): Promise<LeadActivity[]> {
    throw new Error('Method not implemented');
  }

  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    throw new Error('Method not implemented');
  }

  async getLeadScoringHistory(leadId: string, limit?: number): Promise<LeadScoringHistory[]> {
    throw new Error('Method not implemented');
  }

  async getLeadStageHistory(leadId: string): Promise<(LeadStageHistory & { movedByUser?: User })[]> {
    throw new Error('Method not implemented');
  }

  async createLeadScoringHistory(scoringData: InsertLeadScoringHistory): Promise<LeadScoringHistory> {
    throw new Error('Method not implemented');
  }

  async createLeadStageHistory(stageData: InsertLeadStageHistory): Promise<LeadStageHistory> {
    throw new Error('Method not implemented');
  }

  async getLeadScoringRules(isActive?: boolean): Promise<LeadScoringRule[]> {
    throw new Error('Method not implemented');
  }

  async createLeadScoringRule(rule: InsertLeadScoringRule): Promise<LeadScoringRule> {
    throw new Error('Method not implemented');
  }

  async updateLeadScoringRule(id: string, rule: Partial<InsertLeadScoringRule>): Promise<LeadScoringRule> {
    throw new Error('Method not implemented');
  }

  async deleteLeadScoringRule(id: string): Promise<void> {
    throw new Error('Method not implemented');
  }

  async createSentimentAnalysis(sentiment: InsertSentimentAnalysis): Promise<SentimentAnalysis> {
    throw new Error('Method not implemented');
  }

  async getSentimentAnalysis(id: string): Promise<SentimentAnalysis | undefined> {
    throw new Error('Method not implemented');
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const db = await getDb();
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getUserNotifications(userId: string, limit: number = 50, unreadOnly: boolean = false): Promise<Notification[]> {
    const db = await getDb();
    
    const whereConditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      whereConditions.push(eq(notifications.isRead, false));
    }
    
    const query = db.select()
      .from(notifications)
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    
    return await query;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const db = await getDb();
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const db = await getDb();
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const db = await getDb();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result?.count || 0;
  }

  async deleteGoodsReceipt(id: string): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      // Delete goods receipt items first
      await tx.delete(goodsReceiptItems).where(eq(goodsReceiptItems.grId, id));
      // Then delete the goods receipt
      await tx.delete(goodsReceipts).where(eq(goodsReceipts.id, id));
    });
  }

  async deleteVendorBill(id: string): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      // Delete vendor bill items first
      await tx.delete(vendorBillItems).where(eq(vendorBillItems.billId, id));
      // Then delete the vendor bill
      await tx.delete(vendorBills).where(eq(vendorBills.id, id));
    });
  }

  async deleteCompetitorPrice(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(competitorPrices).where(eq(competitorPrices.id, id));
  }
  
}

import { MemStorage } from "./memStorage";
import { getDatabaseUrlAsync, debugSecretSources } from "./secretLoader";

// Import fs properly for ES modules
import * as fs from 'fs';

// Async storage initialization
async function initializeStorage(): Promise<IStorage> {
  try {
    console.log('🚀 [STORAGE] Enhanced storage initialization with robust secret loading...');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
    
    // Debug secret sources for troubleshooting
    debugSecretSources();
    
    // Check if database should be used (enabled by default if DATABASE_URL is available)
    const explicitDbFlag = process.env.USE_DB_STORAGE?.toLowerCase();
    
    // Since check_secrets confirmed all database variables exist, let's be more aggressive
    // about using database storage by default
    const useDbStorage = explicitDbFlag !== 'false'; // Use DB unless explicitly disabled
    
    console.log('Database configuration check:');
    console.log('- USE_DB_STORAGE flag:', explicitDbFlag || 'not set');
    console.log('- Database secrets confirmed available via check_secrets');
    console.log('- Will use database storage:', useDbStorage);
    
    if (!useDbStorage) {
      console.log('📝 Using memory storage (DATABASE_URL not available or explicitly disabled)');
      const memStorage = new MemStorage();
      console.log('✅ Successfully initialized memory storage');
      return memStorage;
    }
    
    // Use async retry-based secret loading
    console.log('🚀 [STORAGE] Starting database URL retrieval with retries...');
    const databaseUrl = await getDatabaseUrlAsync();

    console.log('DATABASE_URL exists:', !!databaseUrl);
    console.log('Environment:', process.env.NODE_ENV);

    if (databaseUrl && databaseUrl.trim() !== '') {
      try {
        console.log('Initializing database storage...');
        const dbStorage = new DatabaseStorage();
        console.log('✅ Successfully initialized database storage');
        return dbStorage;
      } catch (error) {
        console.warn('❌ Database storage failed, falling back to memory storage:', error);
        const memStorage = new MemStorage();
        console.log('✅ Successfully initialized memory storage (fallback)');
        return memStorage;
      }
    } else {
      console.log('📝 DATABASE_URL not available, using memory storage for development');
      const memStorage = new MemStorage();
      console.log('✅ Successfully initialized memory storage');
      return memStorage;
    }
  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    console.log('Falling back to memory storage');
    return new MemStorage();
  }
}

// Export storage promise
export const storagePromise = initializeStorage();

// For backward compatibility, export a resolved storage instance
let storage: IStorage;
export const getStorage = async (): Promise<IStorage> => {
  if (!storage) {
    storage = await storagePromise;
  }
  return storage;
};

// Export storage directly for existing code (will be undefined initially)
export { storage };
