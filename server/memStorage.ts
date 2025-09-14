import { IStorage } from "./storage";
import type {
  User,
  UpsertUser,
  Customer,
  InsertCustomer,
  Supplier,
  InsertSupplier,
  Warehouse,
  InsertWarehouse,
  Product,
  InsertProduct,
  Inventory,
  InsertInventory,
  SalesOrder,
  InsertSalesOrder,
  SalesOrderItem,
  InsertSalesOrderItem,
  PurchaseOrder,
  InsertPurchaseOrder,
  PurchaseOrderItem,
  InsertPurchaseOrderItem,
  Invoice,
  InsertInvoice,
  StockMovement,
  InsertStockMovement,
} from "@shared/schema";

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private customers = new Map<string, Customer>();
  private suppliers = new Map<string, Supplier>();
  private warehouses = new Map<string, Warehouse>();
  private products = new Map<string, Product>();
  private inventory = new Map<string, Inventory>();
  private salesOrders = new Map<string, SalesOrder>();
  private salesOrderItems = new Map<string, SalesOrderItem>();
  private purchaseOrders = new Map<string, PurchaseOrder>();
  private purchaseOrderItems = new Map<string, PurchaseOrderItem>();
  private invoices = new Map<string, Invoice>();
  private stockMovements = new Map<string, StockMovement>();

  constructor() {
    this.seedData();
  }

  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private seedData() {
    // Seed users
    const adminUser: User = {
      id: "admin-1",
      email: "admin@pharma.com",
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: null,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Seed warehouses
    const mainWarehouse: Warehouse = {
      id: "wh-1",
      name: "Main Warehouse",
      location: "Luanda, Angola",
      type: "standard",
      capacity: 10000,
      isActive: true,
      createdAt: new Date(),
    };
    this.warehouses.set(mainWarehouse.id, mainWarehouse);

    // Seed suppliers
    const supplier1: Supplier = {
      id: "sup-1",
      name: "Pharma Supply Co.",
      email: "orders@pharmasupply.com",
      phone: "+244-123-456-789",
      address: "123 Medical District, Luanda",
      country: "Angola",
      creditDays: 30,
      currency: "USD",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.suppliers.set(supplier1.id, supplier1);

    // Seed customers
    const customer1: Customer = {
      id: "cust-1",
      name: "City Hospital",
      email: "procurement@cityhospital.ao",
      phone: "+244-987-654-321",
      address: "456 Healthcare Ave, Luanda",
      taxId: "AO123456789",
      creditLimit: "50000.00",
      paymentTerms: 30,
      assignedSalesRep: adminUser.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(customer1.id, customer1);

    // Seed products
    const products = [
      {
        id: "prod-1",
        sku: "PARA-500",
        name: "Paracetamol 500mg",
        description: "Pain relief medication",
        category: "Analgesics",
        manufacturer: "PharmaCorp",
        unitPrice: "0.25",
        minStockLevel: 1000,
        requiresBatchTracking: true,
        shelfLifeDays: 1095,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-2",
        sku: "AMOX-250",
        name: "Amoxicillin 250mg",
        description: "Antibiotic medication",
        category: "Antibiotics",
        manufacturer: "MediLab",
        unitPrice: "0.75",
        minStockLevel: 500,
        requiresBatchTracking: true,
        shelfLifeDays: 730,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    products.forEach(product => this.products.set(product.id, product));

    // Seed inventory
    const inventoryItems = [
      {
        id: "inv-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        batchNumber: "PAR001",
        quantity: 2500,
        manufactureDate: "2024-01-15",
        expiryDate: "2025-12-31",
        costPerUnit: "0.20",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "inv-2",
        productId: "prod-2",
        warehouseId: "wh-1",
        batchNumber: "AMX001",
        quantity: 800,
        manufactureDate: "2024-03-10",
        expiryDate: "2025-03-10",
        costPerUnit: "0.65",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    inventoryItems.forEach(item => this.inventory.set(item.id, item));

    // Seed sales orders
    const salesOrder1: SalesOrder = {
      id: "so-1",
      orderNumber: "SO-2024-001",
      customerId: "cust-1",
      salesRepId: adminUser.id,
      orderDate: "2024-09-10",
      deliveryDate: null,
      status: "confirmed",
      subtotal: "500.00",
      taxAmount: "50.00",
      totalAmount: "550.00",
      notes: "Urgent order for hospital",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.salesOrders.set(salesOrder1.id, salesOrder1);

    // Seed invoices
    const invoice1: Invoice = {
      id: "inv-1",
      invoiceNumber: "INV-2024-001",
      customerId: "cust-1",
      salesOrderId: "so-1",
      invoiceDate: "2024-09-10",
      dueDate: "2024-10-10",
      status: "sent",
      subtotal: "500.00",
      taxAmount: "50.00",
      totalAmount: "550.00",
      paidAmount: "200.00",
      notes: "Invoice for SO-2024-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(invoice1.id, invoice1);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    const now = new Date();
    
    const newUser: User = {
      id: user.id,
      email: user.email ?? existingUser?.email ?? null,
      firstName: user.firstName ?? existingUser?.firstName ?? null,
      lastName: user.lastName ?? existingUser?.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? existingUser?.profileImageUrl ?? null,
      role: existingUser?.role ?? "sales",
      isActive: existingUser?.isActive ?? true,
      createdAt: existingUser?.createdAt ?? now,
      updatedAt: now,
    };
    
    this.users.set(user.id, newUser);
    return newUser;
  }

  // Customer operations
  async getCustomers(limit = 100): Promise<Customer[]> {
    return Array.from(this.customers.values()).slice(0, limit);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.generateId();
    const now = new Date();
    const newCustomer: Customer = {
      id,
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      taxId: customer.taxId ?? null,
      creditLimit: customer.creditLimit ?? null,
      paymentTerms: customer.paymentTerms ?? null,
      assignedSalesRep: customer.assignedSalesRep ?? null,
      isActive: customer.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const existing = this.customers.get(id);
    if (!existing) throw new Error("Customer not found");
    
    const updated: Customer = {
      ...existing,
      ...customer,
      id,
      updatedAt: new Date(),
    };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    this.customers.delete(id);
  }

  // Supplier operations
  async getSuppliers(limit = 100): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).slice(0, limit);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.generateId();
    const now = new Date();
    const newSupplier: Supplier = {
      id,
      name: supplier.name,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      address: supplier.address ?? null,
      country: supplier.country ?? null,
      creditDays: supplier.creditDays ?? null,
      currency: supplier.currency ?? null,
      isActive: supplier.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const existing = this.suppliers.get(id);
    if (!existing) throw new Error("Supplier not found");
    
    const updated: Supplier = {
      ...existing,
      ...supplier,
      id,
      updatedAt: new Date(),
    };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    this.suppliers.delete(id);
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.generateId();
    const newWarehouse: Warehouse = {
      id,
      name: warehouse.name,
      location: warehouse.location ?? null,
      type: warehouse.type ?? null,
      capacity: warehouse.capacity ?? null,
      isActive: warehouse.isActive ?? true,
      createdAt: new Date(),
    };
    this.warehouses.set(id, newWarehouse);
    return newWarehouse;
  }

  async updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse> {
    const existing = this.warehouses.get(id);
    if (!existing) throw new Error("Warehouse not found");
    
    const updated: Warehouse = {
      ...existing,
      ...warehouse,
      id,
    };
    this.warehouses.set(id, updated);
    return updated;
  }

  async deleteWarehouse(id: string): Promise<void> {
    this.warehouses.delete(id);
  }

  // Product operations
  async getProducts(limit = 100): Promise<Product[]> {
    return Array.from(this.products.values()).slice(0, limit);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.generateId();
    const now = new Date();
    const newProduct: Product = {
      id,
      name: product.name,
      sku: product.sku,
      description: product.description ?? null,
      category: product.category ?? null,
      manufacturer: product.manufacturer ?? null,
      unitPrice: product.unitPrice ?? null,
      minStockLevel: product.minStockLevel ?? null,
      requiresBatchTracking: product.requiresBatchTracking ?? null,
      shelfLifeDays: product.shelfLifeDays ?? null,
      isActive: product.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Product not found");
    
    const updated: Product = {
      ...existing,
      ...product,
      id,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    activeProducts: number;
    openOrders: number;
    outstandingAmount: number;
    expiringProductsCount: number;
  }> {
    const totalRevenue = Array.from(this.invoices.values())
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    
    const activeProducts = Array.from(this.products.values())
      .filter(p => p.isActive).length;
    
    const openOrders = Array.from(this.salesOrders.values())
      .filter(o => ['draft', 'confirmed'].includes(o.status!)).length;
    
    const outstandingAmount = Array.from(this.invoices.values())
      .reduce((sum, inv) => {
        const outstanding = parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount);
        return sum + outstanding;
      }, 0);
    
    const expiringProducts = await this.getExpiringProducts(90);
    
    return {
      totalRevenue,
      activeProducts,
      openOrders,
      outstandingAmount,
      expiringProductsCount: expiringProducts.length,
    };
  }

  async getRecentTransactions(limit = 10): Promise<Array<{
    id: string;
    date: string;
    type: 'sale' | 'purchase' | 'payment';
    customerOrSupplier: string;
    amount: number;
    status: string;
    reference: string;
  }>> {
    const transactions: Array<{
      id: string;
      date: string;
      type: 'sale' | 'purchase' | 'payment';
      customerOrSupplier: string;
      amount: number;
      status: string;
      reference: string;
    }> = [];

    // Add sales orders as transactions
    for (const order of Array.from(this.salesOrders.values())) {
      const customer = this.customers.get(order.customerId);
      transactions.push({
        id: order.id,
        date: order.orderDate,
        type: 'sale',
        customerOrSupplier: customer?.name || 'Unknown Customer',
        amount: parseFloat(order.totalAmount),
        status: order.status || 'draft',
        reference: order.orderNumber,
      });
    }

    // Add invoices as payment transactions
    for (const invoice of Array.from(this.invoices.values())) {
      const customer = this.customers.get(invoice.customerId);
      if (parseFloat(invoice.paidAmount) > 0) {
        transactions.push({
          id: invoice.id,
          date: invoice.invoiceDate,
          type: 'payment',
          customerOrSupplier: customer?.name || 'Unknown Customer',
          amount: parseFloat(invoice.paidAmount),
          status: 'paid',
          reference: invoice.invoiceNumber,
        });
      }
    }

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getExpiringProducts(daysAhead: number): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    const expiringInventory: (Inventory & { product: Product; warehouse: Warehouse })[] = [];
    
    for (const inv of Array.from(this.inventory.values())) {
      const expiryDate = new Date(inv.expiryDate!);
      if (expiryDate <= cutoffDate && inv.quantity > 0) {
        const product = this.products.get(inv.productId);
        const warehouse = this.warehouses.get(inv.warehouseId);
        if (product && warehouse) {
          expiringInventory.push({
            ...inv,
            product,
            warehouse,
          });
        }
      }
    }
    
    return expiringInventory.sort((a, b) => 
      new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
    );
  }

  // Placeholder implementations for other required methods
  async getInventory(warehouseId?: string): Promise<(Inventory & { product: Product })[]> {
    const results: (Inventory & { product: Product })[] = [];
    for (const inv of this.inventory.values()) {
      if (!warehouseId || inv.warehouseId === warehouseId) {
        const product = this.products.get(inv.productId);
        if (product) {
          results.push({ ...inv, product });
        }
      }
    }
    return results;
  }

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(inv => inv.productId === productId);
  }

  async createInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = this.generateId();
    const now = new Date();
    const newInventory: Inventory = {
      id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      batchNumber: inventory.batchNumber ?? null,
      quantity: inventory.quantity ?? 0,
      manufactureDate: inventory.manufactureDate ?? null,
      expiryDate: inventory.expiryDate ?? null,
      costPerUnit: inventory.costPerUnit ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.inventory.set(id, newInventory);
    return newInventory;
  }

  async updateInventory(id: string, inventory: Partial<InsertInventory>): Promise<Inventory> {
    const existing = this.inventory.get(id);
    if (!existing) throw new Error("Inventory not found");
    
    const updated: Inventory = {
      ...existing,
      ...inventory,
      id,
      updatedAt: new Date(),
    };
    this.inventory.set(id, updated);
    return updated;
  }

  // Sales operations
  async getSalesOrders(limit = 50): Promise<(SalesOrder & { customer: Customer; salesRep?: User })[]> {
    const results: (SalesOrder & { customer: Customer; salesRep?: User })[] = [];
    
    for (const order of Array.from(this.salesOrders.values()).slice(0, limit)) {
      const customer = this.customers.get(order.customerId);
      const salesRep = order.salesRepId ? this.users.get(order.salesRepId) : undefined;
      
      if (customer) {
        results.push({
          ...order,
          customer,
          salesRep,
        });
      }
    }
    
    return results.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getSalesOrder(id: string): Promise<(SalesOrder & { customer: Customer; items: (SalesOrderItem & { product: Product })[] }) | undefined> {
    const order = this.salesOrders.get(id);
    const customer = order ? this.customers.get(order.customerId) : undefined;
    
    if (!order || !customer) return undefined;
    
    const items = Array.from(this.salesOrderItems.values())
      .filter(item => item.orderId === id)
      .map(item => {
        const product = this.products.get(item.productId);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean) as (SalesOrderItem & { product: Product })[];
    
    return {
      ...order,
      customer,
      items,
    };
  }

  async createSalesOrder(order: InsertSalesOrder): Promise<SalesOrder> {
    const id = this.generateId();
    const now = new Date();
    const newOrder: SalesOrder = {
      id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate ?? null,
      status: order.status ?? null,
      subtotal: order.subtotal ?? null,
      taxAmount: order.taxAmount ?? null,
      totalAmount: order.totalAmount ?? null,
      salesRepId: order.salesRepId ?? null,
      notes: order.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.salesOrders.set(id, newOrder);
    return newOrder;
  }

  async updateSalesOrder(id: string, order: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const existing = this.salesOrders.get(id);
    if (!existing) throw new Error("Sales order not found");
    
    const updated: SalesOrder = {
      ...existing,
      ...order,
      id,
      updatedAt: new Date(),
    };
    this.salesOrders.set(id, updated);
    return updated;
  }

  async createSalesOrderItem(item: InsertSalesOrderItem): Promise<SalesOrderItem> {
    const id = this.generateId();
    const newItem: SalesOrderItem = {
      id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      inventoryId: item.inventoryId ?? null,
      createdAt: new Date(),
    };
    this.salesOrderItems.set(id, newItem);
    return newItem;
  }

  // Stub implementations for other required methods
  async confirmSalesOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async fulfillSalesOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async generateInvoiceFromSalesOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async processSalesReturn(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async cancelSalesOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPurchaseOrders(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPurchaseOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPurchaseOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updatePurchaseOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPurchaseOrderItem(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getInvoices(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getInvoice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createInvoice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateInvoice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getStockMovements(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createStockMovement(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // All other interface methods - stub implementations
  async getPosTerminals(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPosTerminal(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPosTerminal(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updatePosTerminal(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPosSessions(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPosSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getActivePosSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async openPosSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async closePosSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPosReceipts(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPosReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPosSale(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCashMovements(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createCashMovement(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // HR methods
  async getEmployees(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getEmployee(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createEmployee(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateEmployee(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteEmployee(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getEmployeeByUserId(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getTimeEntries(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getTimeEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createTimeEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateTimeEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async approveTimeEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPayrollRuns(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPayrollRun(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPayrollRun(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updatePayrollRun(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPayrollItems(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPayrollItem(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async processPayroll(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPerformanceReviews(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPerformanceReview(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPerformanceReview(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updatePerformanceReview(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async completePerformanceReview(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // AI and analytics methods
  async getSalesHistory(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getLeadTimeAnalysis(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getProductDemandAnalysis(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPriceOptimizationData(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // All other CRM and specialized methods - stub implementations
  async getQuotations(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getQuotation(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createQuotation(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateQuotation(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteQuotation(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createQuotationItem(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async convertQuotationToOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReceipts(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async allocateReceiptToInvoice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCommissionEntries(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCommissionEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createCommissionEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateCommissionEntry(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async approveCommission(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getSalesRepCommissionSummary(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCreditOverrides(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCreditOverride(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createCreditOverride(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateCreditOverride(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async approveCreditOverride(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async checkCustomerCredit(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getLeads(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getLead(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createLead(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateLead(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteLead(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async convertLeadToCustomer(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getLeadCommunications(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createLeadCommunication(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateLeadCommunication(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCrmDashboardMetrics(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // Purchase module methods - all stub implementations
  async getPurchaseRequests(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updatePurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deletePurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createPurchaseRequestItem(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async submitPurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async approvePurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async rejectPurchaseRequest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async convertPRtoPO(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // Continue with all other methods as stubs...
  async getApprovals(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createApproval(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async processApproval(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getGoodsReceipts(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async postGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getVendorBills(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async postVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async processOCRBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getMatchResults(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async performThreeWayMatch(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async resolveMatchException(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getFxRates(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getFxRateLatest(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async upsertFxRate(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async refreshFxRates(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCompetitorPrices(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async upsertCompetitorPrice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCompetitorAnalysis(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getPurchaseDashboardMetrics(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  
  // All remaining methods as stubs...
  async getAiChatSessions(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createAiChatSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateAiChatSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAiChatMessages(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createAiChatMessage(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAiInsights(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createAiInsight(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateAiInsight(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCampaigns(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCampaignMembers(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createCampaignMember(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateCampaignMember(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteCampaignMember(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getLicenses(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createLicense(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateLicense(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteLicense(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getRegulatoryReports(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAuditLogs(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createAuditLog(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getRecallNotices(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createRecallNotice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateRecallNotice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteRecallNotice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReportDefinitions(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createReportDefinition(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateReportDefinition(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteReportDefinition(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getSavedReports(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createSavedReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteSavedReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReportExports(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createReportExport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteReportExport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async generateReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async exportReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async scheduleReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing AI methods
  async getAiChatSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async closeAiChatSession(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAiInsight(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async reviewAiInsight(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async applyAiInsight(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAiModelMetrics(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createAiModelMetric(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getAiModelPerformanceStats(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing Campaign methods
  async getCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async launchCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async pauseCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async completeCampaign(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async addCampaignMember(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async removeCampaignMember(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCampaignAnalytics(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing License methods
  async getLicense(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async renewLicense(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getExpiringLicenses(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing Regulatory methods
  async getRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async submitRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async reviewRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async approveRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async rejectRegulatoryReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing Recall methods
  async getRecallNotice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async initiateRecall(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async completeRecall(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing Report methods
  async getReportDefinition(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getSavedReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateSavedReport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReportExport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateReportExport(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async markReportExportComplete(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async markReportExportFailed(): Promise<any> { throw new Error("Not implemented in memory storage"); }

  // Missing Dashboard method
  async getRecentTransactions(): Promise<any> { return []; }
}