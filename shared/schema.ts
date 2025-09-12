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
});

// Sales orders table
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  status: varchar("status").default('draft'), // draft, confirmed, shipped, delivered, cancelled
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
});

// Purchase orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: varchar("status").default('draft'), // draft, sent, confirmed, received, closed
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default('0'),
  notes: text("notes"),
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
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: varchar("status").default('draft'), // draft, sent, paid, overdue, cancelled
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  salesOrders: many(salesOrders),
  stockMovements: many(stockMovements),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedSalesRep: one(users, {
    fields: [customers.assignedSalesRep],
    references: [users.id],
  }),
  salesOrders: many(salesOrders),
  invoices: many(invoices),
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

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
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
