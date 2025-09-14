import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'sales',
  'inventory',
  'finance',
  'hr',
  'pos',
  'marketing'
]);

// Additional enums for new modules
export const employmentStatusEnum = pgEnum('employment_status', [
  'active',
  'inactive',
  'terminated',
  'suspended',
  'probation'
]);

export const timeEntryTypeEnum = pgEnum('time_entry_type', [
  'regular',
  'overtime',
  'sick_leave',
  'vacation',
  'personal_leave',
  'training'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'mobile_money',
  'bank_transfer',
  'check',
  'credit'
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'email',
  'sms',
  'promotional',
  'educational',
  'seasonal',
  'loyalty'
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
  'nurturing'
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'email',
  'phone',
  'sms',
  'meeting',
  'letter',
  'visit'
]);

export const reportStatusEnum = pgEnum('report_status', [
  'draft',
  'generating',
  'completed',
  'failed',
  'expired'
]);

export const licenseStatusEnum = pgEnum('license_status', [
  'active',
  'expired',
  'pending_renewal',
  'suspended',
  'revoked'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'import',
  'approve',
  'reject'
]);

export const recallStatusEnum = pgEnum('recall_status', [
  'initiated',
  'in_progress',
  'completed',
  'cancelled'
]);

export const quotationStatusEnum = pgEnum('quotation_status', [
  'draft',
  'sent',
  'accepted',
  'expired',
  'cancelled'
]);

export const receiptStatusEnum = pgEnum('receipt_status', [
  'pending',
  'cleared',
  'bounced',
  'cancelled'
]);

export const commissionStatusEnum = pgEnum('commission_status', [
  'accrued',
  'approved',
  'paid',
  'cancelled'
]);

// Purchase-specific enums
export const incotermEnum = pgEnum('incoterm', [
  'EXW', // Ex Works
  'FCA', // Free Carrier
  'CPT', // Carriage Paid To
  'CIP', // Carriage and Insurance Paid To
  'DAP', // Delivered at Place
  'DPU', // Delivered at Place Unloaded
  'DDP', // Delivered Duty Paid
  'FAS', // Free Alongside Ship
  'FOB', // Free on Board
  'CFR', // Cost and Freight
  'CIF'  // Cost, Insurance, and Freight
]);

export const prStatusEnum = pgEnum('pr_status', [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'converted',
  'cancelled'
]);

export const poStatusEnum = pgEnum('po_status', [
  'draft',
  'sent',
  'confirmed',
  'received',
  'closed',
  'cancelled'
]);

export const billStatusEnum = pgEnum('bill_status', [
  'draft',
  'posted',
  'paid',
  'cancelled'
]);

export const receiptStatusEnum2 = pgEnum('gr_receipt_status', [
  'draft',
  'posted'
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected'
]);

export const matchStatusEnum = pgEnum('match_status', [
  'matched',
  'quantity_mismatch',
  'price_mismatch',
  'missing_receipt',
  'missing_bill',
  'pending'
]);

// Additional missing enums for proper status management
export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'draft',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled'
]);

export const creditOverrideStatusEnum = pgEnum('credit_override_status', [
  'pending',
  'approved',
  'rejected',
  'expired'
]);

export const payrollStatusEnum = pgEnum('payroll_status', [
  'draft',
  'processing',
  'completed',
  'cancelled'
]);

export const performanceReviewStatusEnum = pgEnum('performance_review_status', [
  'draft',
  'in_review',
  'completed',
  'archived'
]);

export const posSessionStatusEnum = pgEnum('pos_session_status', [
  'open',
  'closed',
  'suspended'
]);

export const posReceiptStatusEnum = pgEnum('pos_receipt_status', [
  'completed',
  'voided',
  'refunded'
]);

export const posPaymentStatusEnum = pgEnum('pos_payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded'
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

export const campaignMemberStatusEnum = pgEnum('campaign_member_status', [
  'active',
  'opted_out',
  'bounced'
]);

export const communicationStatusEnum = pgEnum('communication_status', [
  'draft',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'replied',
  'failed'
]);

export const regulatoryReportStatusEnum = pgEnum('regulatory_report_status', [
  'draft',
  'submitted',
  'accepted',
  'rejected'
]);

// AI-related enums
export const aiInsightTypeEnum = pgEnum('ai_insight_type', [
  'inventory_optimization',
  'price_optimization',
  'sales_forecast',
  'customer_sentiment',
  'business_intelligence',
  'purchase_risk_analysis',
  'expiry_prediction'
]);

export const aiInsightStatusEnum = pgEnum('ai_insight_status', [
  'generated',
  'reviewed',
  'applied',
  'dismissed',
  'expired'
]);

export const aiChatSessionStatusEnum = pgEnum('ai_chat_session_status', [
  'active',
  'closed',
  'archived'
]);

// System settings enums
export const settingCategoryEnum = pgEnum('setting_category', [
  'ai',
  'general', 
  'feature_flags',
  'integrations',
  'security'
]);

// Sentiment analysis enum
export const sentimentLabelEnum = pgEnum('sentiment_label', [
  'negative',
  'neutral',
  'positive'
]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('sales'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System settings table for application configuration
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  category: settingCategoryEnum("category").default('general'),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false),
  isPublic: boolean("is_public").default(false), // Whether setting can be read by non-admin users
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  taxId: varchar("tax_id"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default('0'),
  paymentTerms: integer("payment_terms").default(30), // days
  assignedSalesRep: varchar("assigned_sales_rep").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  country: varchar("country"),
  creditDays: integer("credit_days").default(30),
  currency: varchar("currency", { length: 3 }).default('USD'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouses table
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location"),
  type: varchar("type").default('standard'), // standard, cold_storage, branch
  capacity: integer("capacity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category"),
  manufacturer: varchar("manufacturer"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  minStockLevel: integer("min_stock_level").default(0),
  requiresBatchTracking: boolean("requires_batch_tracking").default(true),
  shelfLifeDays: integer("shelf_life_days"), // for expiry calculations
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory table with batch tracking
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id).notNull(),
  batchNumber: varchar("batch_number"),
  quantity: integer("quantity").notNull().default(0),
  manufactureDate: date("manufacture_date"),
  expiryDate: date("expiry_date"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_inventory_fefo").on(table.productId, table.warehouseId, table.expiryDate),
]);

// Sales orders table
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  status: salesOrderStatusEnum("status").default('draft'),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales order items table
export const salesOrderItems = pgTable("sales_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => salesOrders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => inventory.id), // for batch tracking
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sales_order_items_order").on(table.orderId),
]);

// Purchase orders table (enhanced)
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  prId: varchar("pr_id"), // Reference to purchase request (optional)
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  deliveryDate: date("delivery_date"), // actual delivery date
  status: poStatusEnum("status").default('draft'),
  incoterm: incotermEnum("incoterm"),
  paymentTerms: integer("payment_terms").default(30), // days
  currency: varchar("currency", { length: 3 }).default('USD'),
  fxRate: decimal("fx_rate", { precision: 10, scale: 6 }).default('1'),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase order items table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => purchaseOrders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_purchase_order_items_order").on(table.orderId),
]);

// Purchase requests table
export const purchaseRequests = pgTable("purchase_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prNumber: varchar("pr_number").notNull().unique(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('USD'),
  status: prStatusEnum("status").default('draft'),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  convertedToPo: varchar("converted_to_po").references(() => purchaseOrders.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase request items table
export const purchaseRequestItems = pgTable("purchase_request_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prId: varchar("pr_id").references(() => purchaseRequests.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Approvals table for workflow management
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'purchase_request', 'purchase_order', etc.
  entityId: varchar("entity_id").notNull(),
  step: integer("step").notNull(), // approval level/step
  approverId: varchar("approver_id").references(() => users.id).notNull(),
  status: approvalStatusEnum("status").default('pending'),
  decidedAt: timestamp("decided_at"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Approval rules table for defining multi-level approval hierarchies
export const approvalRules = pgTable("approval_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'purchase_request', 'purchase_order', etc.
  amountRangeMin: decimal("amount_range_min", { precision: 12, scale: 2 }).default('0'),
  amountRangeMax: decimal("amount_range_max", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('USD'),
  level: integer("level").notNull(), // approval level (1, 2, 3, etc.)
  approverRole: userRoleEnum("approver_role"), // role that can approve at this level
  specificApproverId: varchar("specific_approver_id").references(() => users.id), // specific user (optional)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_rules_entity_amount").on(table.entityType, table.amountRangeMin, table.amountRangeMax),
  index("idx_approval_rules_level").on(table.level),
]);

// Purchase request approvals table for tracking specific approval workflows
export const purchaseRequestApprovals = pgTable("purchase_request_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prId: varchar("pr_id").references(() => purchaseRequests.id).notNull(),
  ruleId: varchar("rule_id").references(() => approvalRules.id).notNull(),
  level: integer("level").notNull(),
  approverId: varchar("approver_id").references(() => users.id).notNull(),
  status: approvalStatusEnum("status").default('pending'),
  decidedAt: timestamp("decided_at"),
  comment: text("comment"),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pr_approvals_pr").on(table.prId),
  index("idx_pr_approvals_approver").on(table.approverId, table.status),
  index("idx_pr_approvals_level").on(table.prId, table.level),
]);

// Notifications table for workflow events
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'pr_submitted', 'pr_approved', 'pr_rejected', etc.
  title: varchar("title").notNull(),
  message: text("message"),
  entityType: varchar("entity_type"), // 'purchase_request', etc.
  entityId: varchar("entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
  index("idx_notifications_entity").on(table.entityType, table.entityId),
]);

// Goods receipts table
export const goodsReceipts = pgTable("goods_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grNumber: varchar("gr_number").notNull().unique(),
  poId: varchar("po_id").references(() => purchaseOrders.id).notNull(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id).notNull(),
  status: receiptStatusEnum2("status").default('draft'),
  receivedBy: varchar("received_by").references(() => users.id).notNull(),
  receivedAt: timestamp("received_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Goods receipt items table
export const goodsReceiptItems = pgTable("goods_receipt_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grId: varchar("gr_id").references(() => goodsReceipts.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  batchNumber: varchar("batch_number"),
  expiryDate: date("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_goods_receipt_items_gr").on(table.grId),
]);

// Vendor bills table
export const vendorBills = pgTable("vendor_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: varchar("bill_number").notNull().unique(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  poId: varchar("po_id").references(() => purchaseOrders.id),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  fxRate: decimal("fx_rate", { precision: 10, scale: 6 }).default('1'),
  status: billStatusEnum("status").default('draft'),
  billDate: date("bill_date").notNull(),
  dueDate: date("due_date"),
  ocrRaw: text("ocr_raw"), // raw OCR text
  ocrExtract: jsonb("ocr_extract"), // structured OCR data
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor bill items table
export const vendorBillItems = pgTable("vendor_bill_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").references(() => vendorBills.id).notNull(),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // fallback if product not matched
  createdAt: timestamp("created_at").defaultNow(),
});

// Foreign exchange rates table
export const fxRates = pgTable("fx_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  quoteCurrency: varchar("quote_currency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  asOfDate: date("as_of_date").notNull(),
  source: varchar("source").notNull(), // API source or manual
  createdAt: timestamp("created_at").defaultNow(),
});

// Competitor prices table
export const competitorPrices = pgTable("competitor_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  competitor: varchar("competitor").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  sourceUrl: text("source_url"),
  collectedAt: timestamp("collected_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Three-way matching results table
export const matchResults = pgTable("match_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poId: varchar("po_id").references(() => purchaseOrders.id).notNull(),
  grId: varchar("gr_id").references(() => goodsReceipts.id),
  billId: varchar("bill_id").references(() => vendorBills.id),
  status: matchStatusEnum("status").notNull(),
  quantityVariance: decimal("quantity_variance", { precision: 10, scale: 2 }).default('0'),
  priceVariance: decimal("price_variance", { precision: 12, scale: 2 }).default('0'),
  matchDetails: jsonb("match_details"), // detailed line-by-line match results
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: invoiceStatusEnum("status").default('draft'),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock movements table for tracking inventory changes
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => inventory.id),
  movementType: varchar("movement_type").notNull(), // in, out, transfer, adjustment, expired
  quantity: integer("quantity").notNull(),
  reference: varchar("reference"), // order number, invoice number, etc.
  notes: text("notes"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM Module Tables

// Quotations table
export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationNumber: varchar("quotation_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  quotationDate: date("quotation_date").notNull(),
  validityDate: date("validity_date").notNull(),
  status: quotationStatusEnum("status").default('draft'),
  currency: varchar("currency", { length: 3 }).default('USD'),
  fxRate: decimal("fx_rate", { precision: 10, scale: 6 }).default('1'),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  notes: text("notes"),
  convertedToOrderId: varchar("converted_to_order_id").references(() => salesOrders.id),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotation items table
export const quotationItems = pgTable("quotation_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id").references(() => quotations.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default('0'),
  tax: decimal("tax", { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts table for payment tracking
export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: varchar("receipt_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  fxRate: decimal("fx_rate", { precision: 10, scale: 6 }).default('1'),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  reference: varchar("reference"), // bank reference, cheque number, etc.
  appliedAmount: decimal("applied_amount", { precision: 12, scale: 2 }).default('0'),
  status: receiptStatusEnum("status").default('pending'),
  notes: text("notes"),
  receivedBy: varchar("received_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission entries table
export const commissionEntries = pgTable("commission_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  salesRepId: varchar("sales_rep_id").references(() => users.id).notNull(),
  basisAmount: decimal("basis_amount", { precision: 12, scale: 2 }).notNull(),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  status: commissionStatusEnum("status").default('accrued'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit overrides table for credit limit exceptions
export const creditOverrides = pgTable("credit_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  requestedBy: varchar("requested_by").references(() => users.id).notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  reason: text("reason").notNull(),
  requestedAmount: decimal("requested_amount", { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('USD'),
  expiryDate: date("expiry_date"),
  status: creditOverrideStatusEnum("status").default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// HR Module Tables

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  employeeNumber: varchar("employee_number").notNull().unique(),
  department: varchar("department").notNull(),
  position: varchar("position").notNull(),
  hireDate: date("hire_date").notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  employmentStatus: employmentStatusEnum("employment_status").default('active'),
  managerId: varchar("manager_id").references(() => users.id),
  workSchedule: varchar("work_schedule").default('full_time'), // full_time, part_time, contract
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  bankAccountNumber: varchar("bank_account_number"),
  taxIdNumber: varchar("tax_id_number"),
  socialSecurityNumber: varchar("social_security_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  date: date("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }).default('0'),
  entryType: timeEntryTypeEnum("entry_type").default('regular'),
  notes: text("notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll runs table
export const payrollRuns = pgTable("payroll_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollPeriod: varchar("payroll_period").notNull(), // e.g., "2024-01"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: payrollStatusEnum("status").default('draft'),
  totalGrossPay: decimal("total_gross_pay", { precision: 15, scale: 2 }).default('0'),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default('0'),
  totalNetPay: decimal("total_net_pay", { precision: 15, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll items table
export const payrollItems = pgTable("payroll_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollRunId: varchar("payroll_run_id").references(() => payrollRuns.id).notNull(),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  basePay: decimal("base_pay", { precision: 12, scale: 2 }).default('0'),
  overtimePay: decimal("overtime_pay", { precision: 12, scale: 2 }).default('0'),
  bonuses: decimal("bonuses", { precision: 12, scale: 2 }).default('0'),
  grossPay: decimal("gross_pay", { precision: 12, scale: 2 }).default('0'),
  taxDeductions: decimal("tax_deductions", { precision: 12, scale: 2 }).default('0'),
  socialSecurityDeductions: decimal("social_security_deductions", { precision: 12, scale: 2 }).default('0'),
  otherDeductions: decimal("other_deductions", { precision: 12, scale: 2 }).default('0'),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }).default('0'),
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  regularHours: decimal("regular_hours", { precision: 5, scale: 2 }).default('0'),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance reviews table
export const performanceReviews = pgTable("performance_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  reviewerId: varchar("reviewer_id").references(() => users.id).notNull(),
  reviewPeriod: varchar("review_period").notNull(), // e.g., "2024-Q1", "2024-Annual"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  overallRating: integer("overall_rating"), // 1-5 scale
  goals: text("goals"),
  achievements: text("achievements"),
  areasForImprovement: text("areas_for_improvement"),
  reviewerComments: text("reviewer_comments"),
  employeeComments: text("employee_comments"),
  status: performanceReviewStatusEnum("status").default('draft'),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Module Tables

// POS terminals table
export const posTerminals = pgTable("pos_terminals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  terminalNumber: varchar("terminal_number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location").notNull(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id).notNull(),
  ipAddress: varchar("ip_address"),
  macAddress: varchar("mac_address"),
  deviceSerial: varchar("device_serial"),
  softwareVersion: varchar("software_version"),
  lastHeartbeat: timestamp("last_heartbeat"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS sessions table
export const posSessions = pgTable("pos_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  terminalId: varchar("terminal_id").references(() => posTerminals.id).notNull(),
  cashierId: varchar("cashier_id").references(() => users.id).notNull(),
  sessionNumber: varchar("session_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startingCash: decimal("starting_cash", { precision: 12, scale: 2 }).default('0'),
  expectedCash: decimal("expected_cash", { precision: 12, scale: 2 }).default('0'),
  actualCash: decimal("actual_cash", { precision: 12, scale: 2 }).default('0'),
  cashVariance: decimal("cash_variance", { precision: 12, scale: 2 }).default('0'),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default('0'),
  totalTransactions: integer("total_transactions").default(0),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  status: posSessionStatusEnum("status").default('open'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS receipts table
export const posReceipts = pgTable("pos_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: varchar("receipt_number").notNull().unique(),
  sessionId: varchar("session_id").references(() => posSessions.id).notNull(),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  customerId: varchar("customer_id").references(() => customers.id),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  receiptData: jsonb("receipt_data"), // full receipt JSON for reprints
  status: posReceiptStatusEnum("status").default('completed'),
  voidedBy: varchar("voided_by").references(() => users.id),
  voidedAt: timestamp("voided_at"),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS payments table
export const posPayments = pgTable("pos_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id").references(() => posReceipts.id).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  cardTransactionId: varchar("card_transaction_id"), // for card payments
  cardLast4: varchar("card_last_4"), // for card payments
  cardType: varchar("card_type"), // visa, mastercard, etc.
  mobileMoneyNumber: varchar("mobile_money_number"), // for mobile money
  mobileMoneyProvider: varchar("mobile_money_provider"), // unitel, movicel, etc.
  checkNumber: varchar("check_number"), // for check payments
  bankName: varchar("bank_name"), // for check/transfer payments
  referenceNumber: varchar("reference_number"),
  status: posPaymentStatusEnum("status").default('completed'),
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cash movements table
export const cashMovements = pgTable("cash_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => posSessions.id).notNull(),
  movementType: varchar("movement_type").notNull(), // sale, refund, payout, cash_drop, starting_cash
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  reference: varchar("reference"), // receipt number, payout reference, etc.
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing Module Tables

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: campaignTypeEnum("campaign_type").notNull(),
  campaignType: campaignTypeEnum("campaign_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }).default('0'),
  actualSpend: decimal("actual_spend", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  targetAudience: text("target_audience"),
  objectives: text("objectives"),
  status: campaignStatusEnum("status").default('draft'),
  managedBy: varchar("manager_id").references(() => users.id).notNull(),
  managerId: varchar("manager_id").references(() => users.id).notNull(),
  totalMembers: integer("total_members").default(0),
  launchedAt: timestamp("launched_at"),
  completedAt: timestamp("completed_at"),
  metrics: jsonb("metrics"), // campaign performance metrics
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign members table
export const campaignMembers = pgTable("campaign_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  leadId: varchar("lead_id").references(() => leads.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: campaignMemberStatusEnum("status").default('active'),
  responseData: jsonb("response_data"), // tracking campaign engagement
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  position: varchar("position"),
  address: text("address"),
  source: varchar("source"), // website, referral, campaign, trade_show, etc.
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  leadStatus: leadStatusEnum("lead_status").default('new'),
  leadScore: integer("lead_score").default(0), // 0-100 scoring system
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  lastContactedAt: timestamp("last_contacted_at"),
  convertedAt: timestamp("converted_at"),
  convertedToCustomerId: varchar("converted_to_customer_id").references(() => customers.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communications table
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  leadId: varchar("lead_id").references(() => leads.id),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  communicationType: communicationTypeEnum("communication_type").notNull(),
  subject: varchar("subject"),
  content: text("content"),
  direction: varchar("direction").notNull(), // inbound, outbound
  status: communicationStatusEnum("status").default('sent'),
  userId: varchar("user_id").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  metadata: jsonb("metadata"), // email tracking, sms delivery receipts, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Sentiment Analysis table
export const sentimentAnalyses = pgTable("sentiment_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communicationId: varchar("communication_id").references(() => communications.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  score: decimal("score", { precision: 3, scale: 2 }).notNull(), // -1.00 to 1.00
  label: sentimentLabelEnum("label").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
  aspects: text("aspects").array(), // identified aspects/topics
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sentiment_customer").on(table.customerId),
  index("idx_sentiment_communication").on(table.communicationId),
  index("idx_sentiment_label_date").on(table.label, table.analyzedAt),
]);

// Advanced Reporting Module Tables

// Report definitions table
export const reportDefinitions = pgTable("report_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // sales, inventory, finance, hr, compliance
  reportType: varchar("report_type").notNull(), // tabular, chart, dashboard, export
  queryDefinition: jsonb("query_definition").notNull(), // SQL query or data source config
  parameters: jsonb("parameters"), // configurable report parameters
  layout: jsonb("layout"), // report layout and formatting options
  isPublic: boolean("is_public").default(false), // accessible to all users vs private
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  permissions: jsonb("permissions"), // role-based access permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saved reports table
export const savedReports = pgTable("saved_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportDefinitionId: varchar("report_definition_id").references(() => reportDefinitions.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parameters: jsonb("parameters"), // saved parameter values
  userId: varchar("user_id").references(() => users.id).notNull(),
  isScheduled: boolean("is_scheduled").default(false),
  scheduleConfig: jsonb("schedule_config"), // cron expression, email recipients, etc.
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Report exports table
export const reportExports = pgTable("report_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportDefinitionId: varchar("report_definition_id").references(() => reportDefinitions.id),
  savedReportId: varchar("saved_report_id").references(() => savedReports.id),
  fileName: varchar("file_name").notNull(),
  fileFormat: varchar("file_format").notNull(), // pdf, excel, csv, json
  fileSize: integer("file_size"), // in bytes
  filePath: varchar("file_path"), // storage path or URL
  parameters: jsonb("parameters"), // parameters used for this export
  status: reportStatusEnum("status").default('generating'),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"), // auto-cleanup after expiration
  downloadCount: integer("download_count").default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // additional export metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Regulatory Compliance Module Tables

// Licenses table
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseNumber: varchar("license_number").notNull().unique(),
  licenseType: varchar("license_type").notNull(), // pharmacy_license, import_permit, wholesale_license, etc.
  licenseName: varchar("license_name", { length: 255 }).notNull(),
  issuingAuthority: varchar("issuing_authority").notNull(),
  issuedDate: date("issued_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  renewalDate: date("renewal_date"),
  status: licenseStatusEnum("status").default('active'),
  documentPath: varchar("document_path"), // file storage path
  conditions: text("conditions"), // special conditions or restrictions
  annualFee: decimal("annual_fee", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  contactPerson: varchar("contact_person"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  reminderDays: integer("reminder_days").default(30), // days before expiry to remind
  managedBy: varchar("managed_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Regulatory reports table
export const regulatoryReports = pgTable("regulatory_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: varchar("report_type").notNull(), // monthly_sales, inventory_summary, adverse_events, etc.
  reportPeriod: varchar("report_period").notNull(), // 2024-01, 2024-Q1, 2024-Annual
  submittedTo: varchar("submitted_to").notNull(), // regulatory authority name
  dueDate: date("due_date").notNull(),
  submittedDate: date("submitted_date"),
  reportData: jsonb("report_data").notNull(), // structured report data
  documentPath: varchar("document_path"), // generated report file path
  status: regulatoryReportStatusEnum("status").default('draft'),
  submissionReference: varchar("submission_reference"), // authority reference number
  preparedBy: varchar("prepared_by").references(() => users.id).notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: date("follow_up_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: varchar("table_name").notNull(), // affected table
  recordId: varchar("record_id").notNull(), // affected record ID
  action: auditActionEnum("action").notNull(),
  oldValues: jsonb("old_values"), // previous values for updates
  newValues: jsonb("new_values"), // new values for creates/updates
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  module: varchar("module"), // which module/feature was used
  description: text("description"), // human-readable description
  metadata: jsonb("metadata"), // additional context data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Recall notices table
export const recallNotices = pgTable("recall_notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recallNumber: varchar("recall_number").notNull().unique(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  batchNumbers: text("batch_numbers").array(), // array of affected batch numbers
  recallType: varchar("recall_type").notNull(), // voluntary, mandated, precautionary
  severity: varchar("severity").notNull(), // low, medium, high, critical
  reason: text("reason").notNull(), // reason for recall
  description: text("description"),
  announcementDate: date("announcement_date").notNull(),
  effectiveDate: date("effective_date").notNull(),
  completionDate: date("completion_date"),
  status: recallStatusEnum("status").default('initiated'),
  issuingAuthority: varchar("issuing_authority"),
  distributionArea: text("distribution_area"), // geographic scope
  quantityDistributed: integer("quantity_distributed"),
  quantityRecovered: integer("quantity_recovered").default(0),
  recoveryPercentage: decimal("recovery_percentage", { precision: 5, scale: 2 }).default('0'),
  customerNotificationMethod: varchar("customer_notification_method"), // email, phone, letter, public_notice
  mediaNotification: boolean("media_notification").default(false),
  publicNotification: boolean("public_notification").default(false),
  managedBy: varchar("managed_by").references(() => users.id).notNull(),
  communicationLog: jsonb("communication_log"), // log of all communications
  correctiveActions: text("corrective_actions"),
  preventiveActions: text("preventive_actions"),
  costs: decimal("costs", { precision: 12, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).default('AOA'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Module Tables

// AI chat sessions table
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionTitle: varchar("session_title").notNull(),
  status: aiChatSessionStatusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI chat messages table
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => aiChatSessions.id).notNull(),
  content: text("content").notNull(),
  role: varchar("role").notNull(), // 'user' | 'assistant'
  metadata: jsonb("metadata"), // additional context like tokens used, model version
  createdAt: timestamp("created_at").defaultNow(),
});

// AI insights table for storing generated recommendations
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: aiInsightTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  insightData: jsonb("insight_data").notNull(), // structured insight data
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // confidence score 0-100
  status: aiInsightStatusEnum("status").default('generated'),
  entityType: varchar("entity_type"), // 'product', 'customer', 'order', etc.
  entityId: varchar("entity_id"), // reference to specific entity
  generatedBy: varchar("generated_by").references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  appliedBy: varchar("applied_by").references(() => users.id),
  appliedAt: timestamp("applied_at"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI model performance tracking
export const aiModelMetrics = pgTable("ai_model_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: varchar("model_name").notNull(),
  modelVersion: varchar("model_version").notNull(),
  requestType: varchar("request_type").notNull(), // 'chat', 'insight_generation', etc.
  tokensUsed: integer("tokens_used"),
  responseTime: integer("response_time"), // milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").references(() => aiChatSessions.id),
  insightId: varchar("insight_id").references(() => aiInsights.id),
  metadata: jsonb("metadata"), // additional metrics
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  // Existing relations
  customers: many(customers),
  salesOrders: many(salesOrders),
  stockMovements: many(stockMovements),
  // CRM relations
  quotations: many(quotations, { relationName: "salesRep" }),
  receipts: many(receipts, { relationName: "receiver" }),
  commissionEntries: many(commissionEntries, { relationName: "salesRep" }),
  creditOverridesRequested: many(creditOverrides, { relationName: "requester" }),
  creditOverridesApproved: many(creditOverrides, { relationName: "approver" }),
  commissionsApproved: many(commissionEntries, { relationName: "approver" }),
  // HR relations
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  managedEmployees: many(employees, { relationName: "manager" }),
  timeEntries: many(timeEntries, { relationName: "approver" }),
  payrollRuns: many(payrollRuns, { relationName: "processor" }),
  performanceReviewsAsReviewer: many(performanceReviews, { relationName: "reviewer" }),
  // POS relations
  posSessions: many(posSessions, { relationName: "cashier" }),
  posReceiptsVoided: many(posReceipts, { relationName: "voider" }),
  posPayments: many(posPayments, { relationName: "processor" }),
  cashMovements: many(cashMovements, { relationName: "user" }),
  // Marketing relations
  managedCampaigns: many(campaigns, { relationName: "manager" }),
  assignedLeads: many(leads, { relationName: "assignee" }),
  communications: many(communications, { relationName: "sender" }),
  // Reporting relations
  ownedReports: many(reportDefinitions, { relationName: "owner" }),
  savedReports: many(savedReports, { relationName: "user" }),
  reportExports: many(reportExports, { relationName: "generator" }),
  // Compliance relations
  managedLicenses: many(licenses, { relationName: "manager" }),
  preparedReports: many(regulatoryReports, { relationName: "preparer" }),
  reviewedReports: many(regulatoryReports, { relationName: "reviewer" }),
  approvedReports: many(regulatoryReports, { relationName: "approver" }),
  auditLogs: many(auditLogs, { relationName: "user" }),
  managedRecalls: many(recallNotices, { relationName: "manager" }),
  // AI relations
  aiChatSessions: many(aiChatSessions),
  aiInsightsGenerated: many(aiInsights, { relationName: "generator" }),
  aiInsightsReviewed: many(aiInsights, { relationName: "reviewer" }),
  aiInsightsApplied: many(aiInsights, { relationName: "applier" }),
  aiModelMetrics: many(aiModelMetrics),
  // Purchase Request Workflow relations
  purchaseRequests: many(purchaseRequests, { relationName: "requester" }),
  purchaseRequestApprovals: many(purchaseRequestApprovals, { relationName: "approver" }),
  approvalRulesAsSpecificApprover: many(approvalRules, { relationName: "specificApprover" }),
  notifications: many(notifications),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedSalesRep: one(users, {
    fields: [customers.assignedSalesRep],
    references: [users.id],
  }),
  salesOrders: many(salesOrders),
  invoices: many(invoices),
  quotations: many(quotations),
  receipts: many(receipts),
  creditOverrides: many(creditOverrides),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  inventory: many(inventory),
  stockMovements: many(stockMovements),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventory: many(inventory),
  salesOrderItems: many(salesOrderItems),
  purchaseOrderItems: many(purchaseOrderItems),
  stockMovements: many(stockMovements),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventory.warehouseId],
    references: [warehouses.id],
  }),
  salesOrderItems: many(salesOrderItems),
  stockMovements: many(stockMovements),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  salesRep: one(users, {
    fields: [salesOrders.salesRepId],
    references: [users.id],
  }),
  items: many(salesOrderItems),
  invoices: many(invoices),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  order: one(salesOrders, {
    fields: [salesOrderItems.orderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [salesOrderItems.productId],
    references: [products.id],
  }),
  inventory: one(inventory, {
    fields: [salesOrderItems.inventoryId],
    references: [inventory.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  order: one(purchaseOrders, {
    fields: [purchaseOrderItems.orderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [invoices.salesOrderId],
    references: [salesOrders.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockMovements.warehouseId],
    references: [warehouses.id],
  }),
  inventory: one(inventory, {
    fields: [stockMovements.inventoryId],
    references: [inventory.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
}));

// CRM Module Relations
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  salesRep: one(users, {
    fields: [quotations.salesRepId],
    references: [users.id],
    relationName: "salesRep",
  }),
  items: many(quotationItems),
  convertedOrder: one(salesOrders, {
    fields: [quotations.convertedToOrderId],
    references: [salesOrders.id],
  }),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  customer: one(customers, {
    fields: [receipts.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [receipts.invoiceId],
    references: [invoices.id],
  }),
  receivedBy: one(users, {
    fields: [receipts.receivedBy],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const commissionEntriesRelations = relations(commissionEntries, ({ one }) => ({
  invoice: one(invoices, {
    fields: [commissionEntries.invoiceId],
    references: [invoices.id],
  }),
  salesRep: one(users, {
    fields: [commissionEntries.salesRepId],
    references: [users.id],
    relationName: "salesRep",
  }),
  approver: one(users, {
    fields: [commissionEntries.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const creditOverridesRelations = relations(creditOverrides, ({ one }) => ({
  customer: one(customers, {
    fields: [creditOverrides.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [creditOverrides.invoiceId],
    references: [invoices.id],
  }),
  requester: one(users, {
    fields: [creditOverrides.requestedBy],
    references: [users.id],
    relationName: "requester",
  }),
  approver: one(users, {
    fields: [creditOverrides.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

// HR Module Relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [employees.managerId],
    references: [users.id],
    relationName: "manager",
  }),
  timeEntries: many(timeEntries),
  payrollItems: many(payrollItems),
  performanceReviews: many(performanceReviews),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [timeEntries.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  processor: one(users, {
    fields: [payrollRuns.processedBy],
    references: [users.id],
    relationName: "processor",
  }),
  payrollItems: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollItems.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payrollItems.employeeId],
    references: [employees.id],
  }),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one }) => ({
  employee: one(employees, {
    fields: [performanceReviews.employeeId],
    references: [employees.id],
  }),
  reviewer: one(users, {
    fields: [performanceReviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

// POS Module Relations
export const posTerminalsRelations = relations(posTerminals, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [posTerminals.warehouseId],
    references: [warehouses.id],
  }),
  posSessions: many(posSessions),
}));

export const posSessionsRelations = relations(posSessions, ({ one, many }) => ({
  terminal: one(posTerminals, {
    fields: [posSessions.terminalId],
    references: [posTerminals.id],
  }),
  cashier: one(users, {
    fields: [posSessions.cashierId],
    references: [users.id],
    relationName: "cashier",
  }),
  posReceipts: many(posReceipts),
  cashMovements: many(cashMovements),
}));

export const posReceiptsRelations = relations(posReceipts, ({ one, many }) => ({
  session: one(posSessions, {
    fields: [posReceipts.sessionId],
    references: [posSessions.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [posReceipts.salesOrderId],
    references: [salesOrders.id],
  }),
  customer: one(customers, {
    fields: [posReceipts.customerId],
    references: [customers.id],
  }),
  voidedBy: one(users, {
    fields: [posReceipts.voidedBy],
    references: [users.id],
    relationName: "voider",
  }),
  posPayments: many(posPayments),
}));

export const posPaymentsRelations = relations(posPayments, ({ one }) => ({
  receipt: one(posReceipts, {
    fields: [posPayments.receiptId],
    references: [posReceipts.id],
  }),
}));

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  session: one(posSessions, {
    fields: [cashMovements.sessionId],
    references: [posSessions.id],
  }),
  user: one(users, {
    fields: [cashMovements.userId],
    references: [users.id],
    relationName: "user",
  }),
}));

// Marketing Module Relations
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  manager: one(users, {
    fields: [campaigns.managerId],
    references: [users.id],
    relationName: "manager",
  }),
  campaignMembers: many(campaignMembers),
  leads: many(leads),
  communications: many(communications),
}));

export const campaignMembersRelations = relations(campaignMembers, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignMembers.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [campaignMembers.customerId],
    references: [customers.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [leads.campaignId],
    references: [campaigns.id],
  }),
  assignee: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
    relationName: "assignee",
  }),
  convertedCustomer: one(customers, {
    fields: [leads.convertedToCustomerId],
    references: [customers.id],
  }),
  communications: many(communications),
}));

export const communicationsRelations = relations(communications, ({ one, many }) => ({
  customer: one(customers, {
    fields: [communications.customerId],
    references: [customers.id],
  }),
  lead: one(leads, {
    fields: [communications.leadId],
    references: [leads.id],
  }),
  campaign: one(campaigns, {
    fields: [communications.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [communications.userId],
    references: [users.id],
    relationName: "sender",
  }),
  sentimentAnalyses: many(sentimentAnalyses),
}));

export const sentimentAnalysesRelations = relations(sentimentAnalyses, ({ one }) => ({
  communication: one(communications, {
    fields: [sentimentAnalyses.communicationId],
    references: [communications.id],
  }),
  customer: one(customers, {
    fields: [sentimentAnalyses.customerId],
    references: [customers.id],
  }),
}));

// Reporting Module Relations
export const reportDefinitionsRelations = relations(reportDefinitions, ({ one, many }) => ({
  owner: one(users, {
    fields: [reportDefinitions.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  savedReports: many(savedReports),
  reportExports: many(reportExports),
}));

export const savedReportsRelations = relations(savedReports, ({ one, many }) => ({
  reportDefinition: one(reportDefinitions, {
    fields: [savedReports.reportDefinitionId],
    references: [reportDefinitions.id],
  }),
  user: one(users, {
    fields: [savedReports.userId],
    references: [users.id],
    relationName: "user",
  }),
  reportExports: many(reportExports),
}));

export const reportExportsRelations = relations(reportExports, ({ one }) => ({
  reportDefinition: one(reportDefinitions, {
    fields: [reportExports.reportDefinitionId],
    references: [reportDefinitions.id],
  }),
  savedReport: one(savedReports, {
    fields: [reportExports.savedReportId],
    references: [savedReports.id],
  }),
  generator: one(users, {
    fields: [reportExports.generatedBy],
    references: [users.id],
    relationName: "generator",
  }),
}));

// Compliance Module Relations
export const licensesRelations = relations(licenses, ({ one }) => ({
  manager: one(users, {
    fields: [licenses.managedBy],
    references: [users.id],
    relationName: "manager",
  }),
}));

export const regulatoryReportsRelations = relations(regulatoryReports, ({ one }) => ({
  preparer: one(users, {
    fields: [regulatoryReports.preparedBy],
    references: [users.id],
    relationName: "preparer",
  }),
  reviewer: one(users, {
    fields: [regulatoryReports.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
  approver: one(users, {
    fields: [regulatoryReports.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
    relationName: "user",
  }),
}));

export const recallNoticesRelations = relations(recallNotices, ({ one }) => ({
  product: one(products, {
    fields: [recallNotices.productId],
    references: [products.id],
  }),
  manager: one(users, {
    fields: [recallNotices.managedBy],
    references: [users.id],
    relationName: "manager",
  }),
}));

// AI Module Relations
export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
  messages: many(aiChatMessages),
  modelMetrics: many(aiModelMetrics),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  generatedBy: one(users, {
    fields: [aiInsights.generatedBy],
    references: [users.id],
    relationName: "generator",
  }),
  reviewedBy: one(users, {
    fields: [aiInsights.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
  appliedBy: one(users, {
    fields: [aiInsights.appliedBy],
    references: [users.id],
    relationName: "applier",
  }),
}));

export const aiModelMetricsRelations = relations(aiModelMetrics, ({ one }) => ({
  user: one(users, {
    fields: [aiModelMetrics.userId],
    references: [users.id],
  }),
  session: one(aiChatSessions, {
    fields: [aiModelMetrics.sessionId],
    references: [aiChatSessions.id],
  }),
  insight: one(aiInsights, {
    fields: [aiModelMetrics.insightId],
    references: [aiInsights.id],
  }),
}));

// Enhanced Purchase Module Relations for new tables
export const approvalRulesRelations = relations(approvalRules, ({ one, many }) => ({
  specificApprover: one(users, {
    fields: [approvalRules.specificApproverId],
    references: [users.id],
  }),
  purchaseRequestApprovals: many(purchaseRequestApprovals),
}));

export const purchaseRequestApprovalsRelations = relations(purchaseRequestApprovals, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [purchaseRequestApprovals.prId],
    references: [purchaseRequests.id],
  }),
  approvalRule: one(approvalRules, {
    fields: [purchaseRequestApprovals.ruleId],
    references: [approvalRules.id],
  }),
  approver: one(users, {
    fields: [purchaseRequestApprovals.approverId],
    references: [users.id],
  }),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [purchaseRequests.requesterId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseRequests.supplierId],
    references: [suppliers.id],
  }),
  convertedPurchaseOrder: one(purchaseOrders, {
    fields: [purchaseRequests.convertedToPo],
    references: [purchaseOrders.id],
  }),
  items: many(purchaseRequestItems),
  approvals: many(purchaseRequestApprovals),
}));

export const purchaseRequestItemsRelations = relations(purchaseRequestItems, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [purchaseRequestItems.prId],
    references: [purchaseRequests.id],
  }),
  product: one(products, {
    fields: [purchaseRequestItems.productId],
    references: [products.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

// HR Module Insert Schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({
  id: true,
  createdAt: true,
});

export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// POS Module Insert Schemas
export const insertPosTerminalSchema = createInsertSchema(posTerminals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPosSessionSchema = createInsertSchema(posSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPosReceiptSchema = createInsertSchema(posReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertPosPaymentSchema = createInsertSchema(posPayments).omit({
  id: true,
  createdAt: true,
});

export const insertCashMovementSchema = createInsertSchema(cashMovements).omit({
  id: true,
  createdAt: true,
});

// Marketing Module Insert Schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMemberSchema = createInsertSchema(campaignMembers).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export const insertSentimentAnalysisSchema = createInsertSchema(sentimentAnalyses).omit({
  id: true,
  analyzedAt: true,
  createdAt: true,
});

// CRM Module Insert Schemas
export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
  createdAt: true,
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionEntrySchema = createInsertSchema(commissionEntries).omit({
  id: true,
  createdAt: true,
});

export const insertCreditOverrideSchema = createInsertSchema(creditOverrides).omit({
  id: true,
  createdAt: true,
});

// Advanced Reporting Insert Schemas
export const insertReportDefinitionSchema = createInsertSchema(reportDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSavedReportSchema = createInsertSchema(savedReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportExportSchema = createInsertSchema(reportExports).omit({
  id: true,
  createdAt: true,
});

// Regulatory Compliance Insert Schemas
export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRegulatoryReportSchema = createInsertSchema(regulatoryReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
});

export const insertRecallNoticeSchema = createInsertSchema(recallNotices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Purchase Module Insert Schemas
export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseRequestItemSchema = createInsertSchema(purchaseRequestItems).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalRuleSchema = createInsertSchema(approvalRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseRequestApprovalSchema = createInsertSchema(purchaseRequestApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertGoodsReceiptSchema = createInsertSchema(goodsReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertGoodsReceiptItemSchema = createInsertSchema(goodsReceiptItems).omit({
  id: true,
  createdAt: true,
});

export const insertVendorBillSchema = createInsertSchema(vendorBills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorBillItemSchema = createInsertSchema(vendorBillItems).omit({
  id: true,
  createdAt: true,
});

export const insertFxRateSchema = createInsertSchema(fxRates).omit({
  id: true,
  createdAt: true,
});

export const insertCompetitorPriceSchema = createInsertSchema(competitorPrices).omit({
  id: true,
  collectedAt: true,
});

export const insertMatchResultSchema = createInsertSchema(matchResults).omit({
  id: true,
  createdAt: true,
});

// AI Module Insert Schemas
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiModelMetricSchema = createInsertSchema(aiModelMetrics).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// HR Module Types
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;

// POS Module Types
export type InsertPosTerminal = z.infer<typeof insertPosTerminalSchema>;
export type PosTerminal = typeof posTerminals.$inferSelect;
export type InsertPosSession = z.infer<typeof insertPosSessionSchema>;
export type PosSession = typeof posSessions.$inferSelect;
export type InsertPosReceipt = z.infer<typeof insertPosReceiptSchema>;
export type PosReceipt = typeof posReceipts.$inferSelect;
export type InsertPosPayment = z.infer<typeof insertPosPaymentSchema>;
export type PosPayment = typeof posPayments.$inferSelect;
export type InsertCashMovement = z.infer<typeof insertCashMovementSchema>;
export type CashMovement = typeof cashMovements.$inferSelect;

// Marketing Module Types
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaignMember = z.infer<typeof insertCampaignMemberSchema>;
export type CampaignMember = typeof campaignMembers.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;
export type SentimentAnalysis = typeof sentimentAnalyses.$inferSelect;

// CRM Module Types
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertCommissionEntry = z.infer<typeof insertCommissionEntrySchema>;
export type CommissionEntry = typeof commissionEntries.$inferSelect;
export type InsertCreditOverride = z.infer<typeof insertCreditOverrideSchema>;
export type CreditOverride = typeof creditOverrides.$inferSelect;

// Advanced Reporting Types
export type InsertReportDefinition = z.infer<typeof insertReportDefinitionSchema>;
export type ReportDefinition = typeof reportDefinitions.$inferSelect;
export type InsertSavedReport = z.infer<typeof insertSavedReportSchema>;
export type SavedReport = typeof savedReports.$inferSelect;
export type InsertReportExport = z.infer<typeof insertReportExportSchema>;
export type ReportExport = typeof reportExports.$inferSelect;

// Regulatory Compliance Types
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertRegulatoryReport = z.infer<typeof insertRegulatoryReportSchema>;
export type RegulatoryReport = typeof regulatoryReports.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertRecallNotice = z.infer<typeof insertRecallNoticeSchema>;
export type RecallNotice = typeof recallNotices.$inferSelect;

// Purchase Module Types
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequestItem = z.infer<typeof insertPurchaseRequestItemSchema>;
export type PurchaseRequestItem = typeof purchaseRequestItems.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;
export type InsertApprovalRule = z.infer<typeof insertApprovalRuleSchema>;
export type ApprovalRule = typeof approvalRules.$inferSelect;
export type InsertPurchaseRequestApproval = z.infer<typeof insertPurchaseRequestApprovalSchema>;
export type PurchaseRequestApproval = typeof purchaseRequestApprovals.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertGoodsReceipt = z.infer<typeof insertGoodsReceiptSchema>;
export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type InsertGoodsReceiptItem = z.infer<typeof insertGoodsReceiptItemSchema>;
export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type InsertVendorBill = z.infer<typeof insertVendorBillSchema>;
export type VendorBill = typeof vendorBills.$inferSelect;
export type InsertVendorBillItem = z.infer<typeof insertVendorBillItemSchema>;
export type VendorBillItem = typeof vendorBillItems.$inferSelect;
export type InsertFxRate = z.infer<typeof insertFxRateSchema>;
export type FxRate = typeof fxRates.$inferSelect;
export type InsertCompetitorPrice = z.infer<typeof insertCompetitorPriceSchema>;
export type CompetitorPrice = typeof competitorPrices.$inferSelect;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;
export type MatchResult = typeof matchResults.$inferSelect;

// AI Module Types
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiModelMetric = z.infer<typeof insertAiModelMetricSchema>;
export type AiModelMetric = typeof aiModelMetrics.$inferSelect;

// POS Request Schemas - for API endpoints
export const openSessionRequestSchema = z.object({
  terminalId: z.string().min(1, "Terminal is required"),
  startingCash: z.coerce.number().min(0, "Starting cash must be positive"),
});

export const closeSessionRequestSchema = z.object({
  actualCash: z.coerce.number().min(0, "Actual cash must be positive"),
  notes: z.string().optional(),
});

export const createPosSaleRequestSchema = z.object({
  sessionId: z.string(),
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    inventoryId: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'mobile_money', 'bank_transfer', 'check', 'credit']),
    amount: z.number().min(0),
    cardTransactionId: z.string().optional(),
    cardLast4: z.string().optional(),
    cardType: z.string().optional(),
    mobileMoneyNumber: z.string().optional(),
    mobileMoneyProvider: z.string().optional(),
    checkNumber: z.string().optional(),
    bankName: z.string().optional(),
    referenceNumber: z.string().optional(),
  })).min(1),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
});

// POS Request Types
export type OpenSessionRequest = z.infer<typeof openSessionRequestSchema>;
export type CloseSessionRequest = z.infer<typeof closeSessionRequestSchema>;
export type CreatePosSaleRequest = z.infer<typeof createPosSaleRequestSchema>;
