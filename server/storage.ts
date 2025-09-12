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
} from "@shared/schema";
import { db } from "./db";
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
    return await db
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .limit(limit)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.isActive, true)));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  // Supplier operations
  async getSuppliers(limit = 100): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .limit(limit)
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.isActive, true)));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db
      .insert(suppliers)
      .values(supplier)
      .returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(suppliers.id, id));
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.isActive, true))
      .orderBy(asc(warehouses.name));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, id), eq(warehouses.isActive, true)));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [newWarehouse] = await db
      .insert(warehouses)
      .values(warehouse)
      .returning();
    return newWarehouse;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(warehouse)
      .where(eq(warehouses.id, id))
      .returning();
    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db
      .update(warehouses)
      .set({ isActive: false })
      .where(eq(warehouses.id, id));
  }

  // Product operations
  async getProducts(limit = 100): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(limit)
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  // Inventory operations
  async getInventory(warehouseId?: string): Promise<(Inventory & { product: Product })[]> {
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
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .orderBy(asc(inventory.expiryDate)); // FEFO ordering
  }

  async createInventory(inventoryData: InsertInventory): Promise<Inventory> {
    const [newInventory] = await db
      .insert(inventory)
      .values(inventoryData)
      .returning();
    return newInventory;
  }

  async updateInventory(id: string, inventoryData: Partial<InsertInventory>): Promise<Inventory> {
    const [updatedInventory] = await db
      .update(inventory)
      .set({ ...inventoryData, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return updatedInventory;
  }

  async getExpiringProducts(daysAhead: number): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]> {
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
        salesRep: users as User | undefined,
      })
      .from(salesOrders)
      .innerJoin(customers, eq(salesOrders.customerId, customers.id))
      .leftJoin(users, eq(salesOrders.salesRepId, users.id))
      .limit(limit)
      .orderBy(desc(salesOrders.createdAt));
  }

  async getSalesOrder(id: string): Promise<(SalesOrder & { customer: Customer; items: (SalesOrderItem & { product: Product })[] }) | undefined> {
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
    const [newOrder] = await db
      .insert(salesOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateSalesOrder(id: string, order: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const [updatedOrder] = await db
      .update(salesOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const [newItem] = await db
      .insert(salesOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Purchase operations
  async getPurchaseOrders(limit = 50): Promise<(PurchaseOrder & { supplier: Supplier })[]> {
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
    const [newOrder] = await db
      .insert(purchaseOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [newItem] = await db
      .insert(purchaseOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Invoice operations
  async getInvoices(limit = 50): Promise<(Invoice & { customer: Customer })[]> {
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
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  // Stock movement operations
  async getStockMovements(limit = 100): Promise<(StockMovement & { product: Product; warehouse: Warehouse; user?: User })[]> {
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
        user: users as User | undefined,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .innerJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .limit(limit)
      .orderBy(desc(stockMovements.createdAt));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
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
}

export const storage = new DatabaseStorage();
