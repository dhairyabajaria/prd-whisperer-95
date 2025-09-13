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
} from "@shared/schema";
import { getDb } from "./db";
import { eq, and, gte, lte, desc, asc, sql, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    const [updatedOrder] = await db
      .update(salesOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const db = await getDb();
    const [newItem] = await db
      .insert(salesOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Purchase operations
  async getPurchaseOrders(limit = 50): Promise<(PurchaseOrder & { supplier: Supplier })[]> {
    const db = await getDb();
    return await db
      .select({
        id: purchaseOrders.id,
        orderNumber: purchaseOrders.orderNumber,
        supplierId: purchaseOrders.supplierId,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        status: purchaseOrders.status,
        subtotal: purchaseOrders.subtotal,
        taxAmount: purchaseOrders.taxAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
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
        supplierId: purchaseOrders.supplierId,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        status: purchaseOrders.status,
        subtotal: purchaseOrders.subtotal,
        taxAmount: purchaseOrders.taxAmount,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
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
    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updatedOrder;
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

  // Dashboard analytics
  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeProducts: number;
    openOrders: number;
    outstandingAmount: number;
    expiringProductsCount: number;
  }> {
    const db = await getDb();
    // Total revenue from paid invoices
    const [revenueResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${invoices.paidAmount}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    // Active products count
    const [productsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    // Open orders count
    const [ordersResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(salesOrders)
      .where(sql`${salesOrders.status} IN ('draft', 'confirmed')`);

    // Outstanding amount from unpaid invoices
    const [outstandingResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${invoices.totalAmount} - ${invoices.paidAmount}), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.status} IN ('sent', 'overdue')`);

    // Expiring products count (90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + 90);
    const [expiringResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(inventory)
      .where(
        and(
          lte(inventory.expiryDate, cutoffDate.toISOString().split('T')[0]),
          gte(inventory.quantity, 1)
        )
      );

    return {
      totalRevenue: Number(revenueResult?.total || 0),
      activeProducts: Number(productsResult?.count || 0),
      openOrders: Number(ordersResult?.count || 0),
      outstandingAmount: Number(outstandingResult?.total || 0),
      expiringProductsCount: Number(expiringResult?.count || 0),
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

    return results;
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

    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (saleData.taxRate || 0) * subtotal / 100;
    const discountAmount = saleData.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}`;

    // Create receipt
    const [receipt] = await db
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
      const [payment] = await db
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
        const allInventoryRecords = await this.getInventoryByProduct(item.productId);
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
        const inventoryRecords = await this.getInventoryByProduct(item.productId);
        
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
        const [currentRecord] = await (await getDb())
          .select()
          .from(inventory)
          .where(eq(inventory.id, inventoryRecord.id));
          
        if (!currentRecord) {
          throw new Error(`Inventory record ${inventoryRecord.id} not found`);
        }
        
        // Update inventory
        await this.updateInventory(inventoryRecord.id, {
          quantity: currentRecord.quantity - quantityToDeduct,
        });

        // Create stock movement
        await this.createStockMovement({
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
    await db
      .update(posSessions)
      .set({
        totalSales: sql`${posSessions.totalSales} + ${totalAmount}`,
        totalTransactions: sql`${posSessions.totalTransactions} + 1`,
        expectedCash: sql`${posSessions.expectedCash} + ${saleData.payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)}`,
      })
      .where(eq(posSessions.id, saleData.sessionId));

    return { receipt, payments };
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

    // Get payroll items for totals
    const items = await db
      .select()
      .from(payrollItems)
      .where(eq(payrollItems.payrollRunId, payrollRunId));

    const totals = items.reduce((acc, item) => {
      acc.totalGrossPay += Number(item.grossPay || 0);
      acc.totalDeductions += Number(item.totalDeductions || 0);
      acc.totalNetPay += Number(item.netPay || 0);
      return acc;
    }, { totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0 });

    // Update payroll run status and totals
    const [payrollRun] = await db
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
      conditions.push(eq(performanceReviews.status, status));
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
}

export const storage = new DatabaseStorage();
