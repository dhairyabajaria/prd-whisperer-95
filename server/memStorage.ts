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
  PurchaseRequest,
  InsertPurchaseRequest,
  PurchaseRequestItem,
  InsertPurchaseRequestItem,
  Approval,
  InsertApproval,
  ApprovalRule,
  InsertApprovalRule,
  PurchaseRequestApproval,
  InsertPurchaseRequestApproval,
  Notification,
  InsertNotification,
  GoodsReceipt,
  InsertGoodsReceipt,
  GoodsReceiptItem,
  InsertGoodsReceiptItem,
  VendorBill,
  InsertVendorBill,
  VendorBillItem,
  InsertVendorBillItem,
  CompetitorPrice,
  InsertCompetitorPrice,
  Quotation,
  InsertQuotation,
  QuotationItem,
  InsertQuotationItem,
  CommissionEntry,
  InsertCommissionEntry,
  Lead,
  InsertLead,
  LeadActivity,
  InsertLeadActivity,
  LeadScoringHistory,
  InsertLeadScoringHistory,
  LeadStageHistory,
  InsertLeadStageHistory,
  LeadScoringRule,
  InsertLeadScoringRule,
  PipelineConfiguration,
  InsertPipelineConfiguration,
  Communication,
  InsertCommunication,
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
  
  // Purchase Request workflow collections
  private purchaseRequests = new Map<string, PurchaseRequest>();
  private purchaseRequestItems = new Map<string, PurchaseRequestItem>();
  private approvals = new Map<string, Approval>();
  private approvalRules = new Map<string, ApprovalRule>();
  private purchaseRequestApprovals = new Map<string, PurchaseRequestApproval>();
  private notifications = new Map<string, Notification>();
  
  // Additional purchase workflow collections
  private goodsReceipts = new Map<string, GoodsReceipt>();
  private goodsReceiptItems = new Map<string, GoodsReceiptItem>();
  private vendorBills = new Map<string, VendorBill>();
  private vendorBillItems = new Map<string, VendorBillItem>();
  private competitorPrices = new Map<string, CompetitorPrice>();
  
  // CRM quotation collections
  private quotations = new Map<string, Quotation>();
  private quotationItems = new Map<string, QuotationItem>();
  
  // CRM commission collections
  private commissionEntries = new Map<string, CommissionEntry>();

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

    // Seed development user with admin role for testing
    const devUser: User = {
      id: "dev-user-1",
      email: "dev@pharma.com",
      firstName: "Dev",
      lastName: "User",
      profileImageUrl: null,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(devUser.id, devUser);

    // Seed sales rep user
    const salesUser: User = {
      id: "sales-1",
      email: "sales@pharma.com",
      firstName: "John",
      lastName: "Smith",
      profileImageUrl: null,
      role: "sales",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(salesUser.id, salesUser);

    // Seed finance user
    const financeUser: User = {
      id: "finance-1",
      email: "finance@pharma.com",
      firstName: "Jane",
      lastName: "Doe",
      profileImageUrl: null,
      role: "finance",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(financeUser.id, financeUser);

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

    // Seed approval rules for purchase requests
    const approvalRules = [
      {
        id: "rule-1",
        entityType: "purchase_request" as const,
        amountRangeMin: "0",
        amountRangeMax: "1000",
        currency: "USD",
        level: 1,
        approverRole: "admin" as const,
        specificApproverId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "rule-2", 
        entityType: "purchase_request" as const,
        amountRangeMin: "1000.01",
        amountRangeMax: "5000",
        currency: "USD",
        level: 1,
        approverRole: "finance" as const,
        specificApproverId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "rule-3",
        entityType: "purchase_request" as const,
        amountRangeMin: "5000.01",
        amountRangeMax: null,
        currency: "USD", 
        level: 1,
        approverRole: "admin" as const,
        specificApproverId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "rule-4",
        entityType: "purchase_request" as const,
        amountRangeMin: "5000.01",
        amountRangeMax: null,
        currency: "USD",
        level: 2,
        approverRole: "finance" as const, 
        specificApproverId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    approvalRules.forEach(rule => this.approvalRules.set(rule.id, rule));

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

    // Seed commission entries
    const commission1: CommissionEntry = {
      id: "comm-1",
      invoiceId: invoice1.id,
      salesRepId: salesUser.id,
      basisAmount: "550.00",
      commissionPercent: "5.00",
      commissionAmount: "27.50",
      currency: "USD",
      status: "accrued",
      approvedBy: null,
      approvedAt: null,
      paidAt: null,
      notes: "Commission for City Hospital order",
      createdAt: new Date(),
    };
    this.commissionEntries.set(commission1.id, commission1);

    const commission2: CommissionEntry = {
      id: "comm-2",
      invoiceId: "inv-2",
      salesRepId: salesUser.id,
      basisAmount: "1200.00",
      commissionPercent: "4.50",
      commissionAmount: "54.00",
      currency: "USD",
      status: "approved",
      approvedBy: financeUser.id,
      approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      paidAt: null,
      notes: "Approved commission entry",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    };
    this.commissionEntries.set(commission2.id, commission2);

    const commission3: CommissionEntry = {
      id: "comm-3",
      invoiceId: "inv-3",
      salesRepId: salesUser.id,
      basisAmount: "800.00",
      commissionPercent: "3.75",
      commissionAmount: "30.00",
      currency: "USD",
      status: "paid",
      approvedBy: financeUser.id,
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      notes: "Paid commission entry",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    };
    this.commissionEntries.set(commission3.id, commission3);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    if (!user.id) throw new Error('User ID is required');
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
    
    this.users.set(newUser.id, newUser);
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
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
    
    const activeProducts = Array.from(this.products.values())
      .filter(p => p.isActive).length;
    
    const openOrders = Array.from(this.salesOrders.values())
      .filter(o => ['draft', 'confirmed'].includes(o.status!)).length;
    
    const outstandingAmount = Array.from(this.invoices.values())
      .reduce((sum, inv) => {
        const outstanding = parseFloat(inv.totalAmount || '0') - parseFloat(inv.paidAmount || '0');
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
        amount: parseFloat(order.totalAmount || '0'),
        status: order.status || 'draft',
        reference: order.orderNumber,
      });
    }

    // Add invoices as payment transactions
    for (const invoice of Array.from(this.invoices.values())) {
      const customer = this.customers.get(invoice.customerId);
      if (parseFloat(invoice.paidAmount || '0') > 0) {
        transactions.push({
          id: invoice.id,
          date: invoice.invoiceDate,
          type: 'payment',
          customerOrSupplier: customer?.name || 'Unknown Customer',
          amount: parseFloat(invoice.paidAmount || '0'),
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
      if (!inv.expiryDate) continue;
      const expiryDate = new Date(inv.expiryDate);
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
    for (const inv of Array.from(this.inventory.values())) {
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
  
  // CRM Module - Quotation operations
  async getQuotations(limit = 100, status?: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] })[]> {
    let quotationsArray = Array.from(this.quotations.values());
    
    if (status) {
      quotationsArray = quotationsArray.filter(q => q.status === status);
    }
    
    quotationsArray = quotationsArray.slice(0, limit);
    
    return quotationsArray.map(quotation => {
      const customer = this.customers.get(quotation.customerId)!;
      const salesRep = quotation.salesRepId ? this.users.get(quotation.salesRepId) : undefined;
      const items = Array.from(this.quotationItems.values())
        .filter(item => item.quotationId === quotation.id)
        .map(item => ({
          ...item,
          product: this.products.get(item.productId)!
        }));
      
      return {
        ...quotation,
        customer,
        salesRep,
        items
      };
    });
  }

  async getQuotation(id: string): Promise<(Quotation & { customer: Customer; salesRep?: User; items: (QuotationItem & { product: Product })[] }) | undefined> {
    const quotation = this.quotations.get(id);
    if (!quotation) return undefined;
    
    const customer = this.customers.get(quotation.customerId)!;
    const salesRep = quotation.salesRepId ? this.users.get(quotation.salesRepId) : undefined;
    const items = Array.from(this.quotationItems.values())
      .filter(item => item.quotationId === quotation.id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));
    
    return {
      ...quotation,
      customer,
      salesRep,
      items
    };
  }

  async createQuotation(quotationData: InsertQuotation): Promise<Quotation> {
    const quotation: Quotation = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      convertedToOrderId: null,
      convertedAt: null,
      ...quotationData,
      salesRepId: quotationData.salesRepId ?? null,
      status: quotationData.status ?? null,
      currency: quotationData.currency ?? null,
      fxRate: quotationData.fxRate ?? null,
      subtotal: quotationData.subtotal ?? null,
      discountAmount: quotationData.discountAmount ?? null,
      taxAmount: quotationData.taxAmount ?? null,
      totalAmount: quotationData.totalAmount ?? null,
      notes: quotationData.notes ?? null
    };
    
    this.quotations.set(quotation.id, quotation);
    return quotation;
  }

  async updateQuotation(id: string, quotationData: Partial<InsertQuotation>): Promise<Quotation> {
    const quotation = this.quotations.get(id);
    if (!quotation) throw new Error("Quotation not found");
    
    const updated = {
      ...quotation,
      ...quotationData,
      updatedAt: new Date()
    };
    
    this.quotations.set(id, updated);
    return updated;
  }

  async deleteQuotation(id: string): Promise<void> {
    // Delete all quotation items first
    Array.from(this.quotationItems.values())
      .filter(item => item.quotationId === id)
      .forEach(item => this.quotationItems.delete(item.id));
    
    this.quotations.delete(id);
  }

  async createQuotationItem(itemData: InsertQuotationItem): Promise<QuotationItem> {
    const item: QuotationItem = {
      id: this.generateId(),
      createdAt: new Date(),
      ...itemData,
      discount: itemData.discount ?? null,
      tax: itemData.tax ?? null
    };
    
    this.quotationItems.set(item.id, item);
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<(QuotationItem & { product: Product })[]> {
    return Array.from(this.quotationItems.values())
      .filter(item => item.quotationId === quotationId)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));
  }

  async updateQuotationItem(id: string, itemData: Partial<InsertQuotationItem>): Promise<QuotationItem> {
    const item = this.quotationItems.get(id);
    if (!item) throw new Error("Quotation item not found");
    
    const updated = {
      ...item,
      ...itemData
    };
    
    this.quotationItems.set(id, updated);
    return updated;
  }

  async deleteQuotationItem(id: string): Promise<void> {
    this.quotationItems.delete(id);
  }

  async convertQuotationToOrder(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReceipts(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async allocateReceiptToInvoice(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getCommissionEntries(salesRepId?: string, status?: string, limit = 100): Promise<(CommissionEntry & { invoice: Invoice & { customer: Customer }; salesRep: User; approvedByUser?: User })[]> {
    let entries = Array.from(this.commissionEntries.values());
    
    // Apply filters
    if (salesRepId) {
      entries = entries.filter(entry => entry.salesRepId === salesRepId);
    }
    if (status) {
      entries = entries.filter(entry => entry.status === status);
    }
    
    // Limit results
    entries = entries.slice(0, limit);
    
    // Enrich with related data
    return entries.map(entry => {
      const invoice = this.invoices.get(entry.invoiceId);
      const customer = invoice ? this.customers.get("cust-1") : null; // Simplified for demo
      const salesRep = this.users.get(entry.salesRepId)!;
      const approvedByUser = entry.approvedBy ? this.users.get(entry.approvedBy) : undefined;
      
      return {
        ...entry,
        invoice: {
          ...invoice!,
          customer: customer!
        },
        salesRep,
        approvedByUser
      };
    });
  }

  async getCommissionEntry(id: string): Promise<(CommissionEntry & { invoice: Invoice & { customer: Customer }; salesRep: User; approvedByUser?: User }) | undefined> {
    const entry = this.commissionEntries.get(id);
    if (!entry) return undefined;
    
    const invoice = this.invoices.get(entry.invoiceId);
    const customer = invoice ? this.customers.get("cust-1") : null; // Simplified for demo
    const salesRep = this.users.get(entry.salesRepId)!;
    const approvedByUser = entry.approvedBy ? this.users.get(entry.approvedBy) : undefined;
    
    return {
      ...entry,
      invoice: {
        ...invoice!,
        customer: customer!
      },
      salesRep,
      approvedByUser
    };
  }

  async createCommissionEntry(commission: InsertCommissionEntry): Promise<CommissionEntry> {
    const id = this.generateId();
    const newCommission: CommissionEntry = {
      id,
      ...commission,
      status: commission.status ?? null,
      notes: commission.notes ?? null,
      approvedBy: commission.approvedBy ?? null,
      approvedAt: commission.approvedAt ?? null,
      paidAt: commission.paidAt ?? null,
      currency: commission.currency ?? null,
      createdAt: new Date()
    };
    
    this.commissionEntries.set(id, newCommission);
    return newCommission;
  }

  async updateCommissionEntry(id: string, commission: Partial<InsertCommissionEntry>): Promise<CommissionEntry> {
    const existing = this.commissionEntries.get(id);
    if (!existing) throw new Error("Commission entry not found");
    
    const updated: CommissionEntry = {
      ...existing,
      ...commission
    };
    
    this.commissionEntries.set(id, updated);
    return updated;
  }

  async approveCommission(id: string, approverId: string): Promise<CommissionEntry> {
    const commission = this.commissionEntries.get(id);
    if (!commission) throw new Error("Commission entry not found");
    if (commission.status !== 'accrued') throw new Error("Commission must be in accrued status to approve");
    
    const approved: CommissionEntry = {
      ...commission,
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date()
    };
    
    this.commissionEntries.set(id, approved);
    return approved;
  }

  async getSalesRepCommissionSummary(salesRepId: string, startDate?: string, endDate?: string): Promise<{
    totalAccrued: number;
    totalApproved: number;
    totalPaid: number;
    entries: (CommissionEntry & { invoice: Invoice })[];
  }> {
    let entries = Array.from(this.commissionEntries.values())
      .filter(entry => entry.salesRepId === salesRepId);
    
    // Apply date filters if provided
    if (startDate) {
      const start = new Date(startDate);
      entries = entries.filter(entry => entry.createdAt && entry.createdAt >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      entries = entries.filter(entry => entry.createdAt && entry.createdAt <= end);
    }
    
    // Calculate totals
    const totalAccrued = entries
      .filter(entry => entry.status === 'accrued')
      .reduce((sum, entry) => sum + parseFloat(entry.commissionAmount), 0);
    
    const totalApproved = entries
      .filter(entry => entry.status === 'approved')
      .reduce((sum, entry) => sum + parseFloat(entry.commissionAmount), 0);
    
    const totalPaid = entries
      .filter(entry => entry.status === 'paid')
      .reduce((sum, entry) => sum + parseFloat(entry.commissionAmount), 0);
    
    // Enrich entries with invoice data
    const enrichedEntries = entries.map(entry => {
      const invoice = this.invoices.get(entry.invoiceId)!;
      return { ...entry, invoice };
    });
    
    return {
      totalAccrued,
      totalApproved,
      totalPaid,
      entries: enrichedEntries
    };
  }
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
  
  // Purchase Request CRUD operations
  async getPurchaseRequests(limit = 50, status?: string, requesterId?: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] })[]> {
    let prs = Array.from(this.purchaseRequests.values());
    
    // Apply filters
    if (status) {
      prs = prs.filter(pr => pr.status === status);
    }
    if (requesterId) {
      prs = prs.filter(pr => pr.requesterId === requesterId);
    }
    
    // Limit results
    prs = prs.slice(0, limit);
    
    // Enrich with related data
    return prs.map(pr => {
      const requester = this.users.get(pr.requesterId)!;
      const supplier = pr.supplierId ? this.suppliers.get(pr.supplierId) : undefined;
      const items = Array.from(this.purchaseRequestItems.values())
        .filter(item => item.prId === pr.id)
        .map(item => ({
          ...item,
          product: this.products.get(item.productId)!
        }));
      
      return {
        ...pr,
        requester,
        supplier,
        items
      };
    });
  }

  async getPurchaseRequest(id: string): Promise<(PurchaseRequest & { requester: User; supplier?: Supplier; items: (PurchaseRequestItem & { product: Product })[] }) | undefined> {
    const pr = this.purchaseRequests.get(id);
    if (!pr) return undefined;
    
    const requester = this.users.get(pr.requesterId)!;
    const supplier = pr.supplierId ? this.suppliers.get(pr.supplierId) : undefined;
    const items = Array.from(this.purchaseRequestItems.values())
      .filter(item => item.prId === pr.id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));
    
    return {
      ...pr,
      requester,
      supplier,
      items
    };
  }

  async createPurchaseRequest(prData: InsertPurchaseRequest): Promise<PurchaseRequest> {
    const id = this.generateId();
    const now = new Date();
    
    const pr: PurchaseRequest = {
      id,
      prNumber: prData.prNumber,
      requesterId: prData.requesterId,
      supplierId: prData.supplierId || null,
      totalAmount: prData.totalAmount || "0",
      currency: prData.currency || "USD",
      status: prData.status || "draft",
      notes: prData.notes || null,
      submittedAt: null,
      approvedAt: null,
      convertedToPo: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.purchaseRequests.set(id, pr);
    return pr;
  }

  async updatePurchaseRequest(id: string, prData: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest> {
    const pr = this.purchaseRequests.get(id);
    if (!pr) throw new Error('Purchase request not found');
    
    const updatedPr: PurchaseRequest = {
      ...pr,
      ...prData,
      updatedAt: new Date(),
    };
    
    this.purchaseRequests.set(id, updatedPr);
    return updatedPr;
  }

  async deletePurchaseRequest(id: string): Promise<void> {
    // Delete items first
    Array.from(this.purchaseRequestItems.values())
      .filter(item => item.prId === id)
      .forEach(item => this.purchaseRequestItems.delete(item.id));
    
    // Delete approvals
    Array.from(this.purchaseRequestApprovals.values())
      .filter(approval => approval.prId === id)
      .forEach(approval => this.purchaseRequestApprovals.delete(approval.id));
    
    // Delete the PR
    this.purchaseRequests.delete(id);
  }

  async createPurchaseRequestItem(item: InsertPurchaseRequestItem): Promise<PurchaseRequestItem> {
    const id = this.generateId();
    const now = new Date();
    
    const prItem: PurchaseRequestItem = {
      id,
      prId: item.prId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice || null,
      lineTotal: item.lineTotal || null,
      notes: item.notes || null,
      createdAt: now,
    };
    
    this.purchaseRequestItems.set(id, prItem);
    return prItem;
  }

  // Legacy methods (kept for backward compatibility)
  async submitPurchaseRequest(id: string): Promise<PurchaseRequest> {
    return this.submitPurchaseRequestWithApproval(id, 'system').then(result => result.pr);
  }

  async approvePurchaseRequest(id: string, approverId: string): Promise<PurchaseRequest> {
    return this.approvePurchaseRequestLevel(id, 1, approverId).then(result => result.pr);
  }

  async rejectPurchaseRequest(id: string, approverId: string, comment: string): Promise<PurchaseRequest> {
    return this.rejectPurchaseRequestLevel(id, 1, approverId, comment).then(result => result.pr);
  }

  // Enhanced PR workflow methods
  async submitPurchaseRequestWithApproval(id: string, submitterId: string): Promise<{ pr: PurchaseRequest; approvals: PurchaseRequestApproval[] }> {
    const pr = this.purchaseRequests.get(id);
    if (!pr) throw new Error('Purchase request not found');
    if (pr.status !== 'draft') throw new Error('Only draft PRs can be submitted');

    // Update PR status to submitted
    const updatedPr: PurchaseRequest = {
      ...pr,
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    };
    this.purchaseRequests.set(id, updatedPr);

    // Find applicable approval rules based on amount and currency
    const amount = parseFloat(pr.totalAmount || '0');
    const applicableRules = Array.from(this.approvalRules.values())
      .filter(rule => 
        rule.entityType === 'purchase_request' && 
        rule.isActive &&
        rule.currency === (pr.currency || 'USD') &&
        amount >= parseFloat(rule.amountRangeMin || '0') &&
        (rule.amountRangeMax === null || amount <= parseFloat(rule.amountRangeMax || '0'))
      )
      .sort((a, b) => a.level - b.level);

    if (applicableRules.length === 0) {
      throw new Error('No approval rules configured for this amount range');
    }

    // Create approval entries for each required level
    const approvals: PurchaseRequestApproval[] = [];
    for (const rule of applicableRules) {
      const approvalId = this.generateId();
      
      // Find approver - either specific approver or find user with required role
      let approverId = rule.specificApproverId;
      if (!approverId) {
        const approverUser = Array.from(this.users.values()).find(user => 
          user.role === rule.approverRole && user.isActive
        );
        if (approverUser) {
          approverId = approverUser.id;
        }
      }

      if (!approverId) {
        throw new Error(`No available approver found for role: ${rule.approverRole}`);
      }

      const approval: PurchaseRequestApproval = {
        id: approvalId,
        prId: id,
        ruleId: rule.id,
        level: rule.level,
        approverId,
        status: 'pending',
        decidedAt: null,
        comment: null,
        notifiedAt: new Date(),
        createdAt: new Date(),
      };

      this.purchaseRequestApprovals.set(approvalId, approval);
      approvals.push(approval);

      // Create notification for the approver
      await this.createNotification({
        userId: approverId,
        type: 'pr_submitted',
        title: 'New Purchase Request Awaiting Approval',
        message: `Purchase Request ${pr.prNumber} (${pr.currency} ${pr.totalAmount}) requires your approval.`,
        entityType: 'purchase_request',
        entityId: id,
        isRead: false,
      });
    }

    return { pr: updatedPr, approvals };
  }

  async approvePurchaseRequestLevel(prId: string, level: number, approverId: string, comment?: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval; isFullyApproved: boolean }> {
    const pr = this.purchaseRequests.get(prId);
    if (!pr) throw new Error('Purchase request not found');
    if (pr.status !== 'submitted') throw new Error('Only submitted PRs can be approved');

    // Find the pending approval for this level and approver
    const approval = Array.from(this.purchaseRequestApprovals.values())
      .find(a => a.prId === prId && a.level === level && a.approverId === approverId && a.status === 'pending');
    
    if (!approval) {
      throw new Error('No pending approval found for this level and approver');
    }

    // Update the approval
    const updatedApproval: PurchaseRequestApproval = {
      ...approval,
      status: 'approved',
      decidedAt: new Date(),
      comment: comment || null,
    };
    this.purchaseRequestApprovals.set(approval.id, updatedApproval);

    // Check if all approvals are completed
    const allApprovals = Array.from(this.purchaseRequestApprovals.values())
      .filter(a => a.prId === prId);
    
    const pendingApprovals = allApprovals.filter(a => a.status === 'pending');
    const isFullyApproved = pendingApprovals.length === 0;

    let updatedPr = pr;
    if (isFullyApproved) {
      // All approvals completed - mark PR as approved
      updatedPr = {
        ...pr,
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date(),
      };
      this.purchaseRequests.set(prId, updatedPr);

      // Notify requester
      await this.createNotification({
        userId: pr.requesterId,
        type: 'pr_approved',
        title: 'Purchase Request Approved',
        message: `Your Purchase Request ${pr.prNumber} has been fully approved and can now be converted to a Purchase Order.`,
        entityType: 'purchase_request',
        entityId: prId,
        isRead: false,
      });
    }

    return { pr: updatedPr, approval: updatedApproval, isFullyApproved };
  }

  async rejectPurchaseRequestLevel(prId: string, level: number, approverId: string, comment: string): Promise<{ pr: PurchaseRequest; approval: PurchaseRequestApproval }> {
    const pr = this.purchaseRequests.get(prId);
    if (!pr) throw new Error('Purchase request not found');
    if (pr.status !== 'submitted') throw new Error('Only submitted PRs can be rejected');

    // Find the pending approval for this level and approver
    const approval = Array.from(this.purchaseRequestApprovals.values())
      .find(a => a.prId === prId && a.level === level && a.approverId === approverId && a.status === 'pending');
    
    if (!approval) {
      throw new Error('No pending approval found for this level and approver');
    }

    // Update the approval
    const updatedApproval: PurchaseRequestApproval = {
      ...approval,
      status: 'rejected',
      decidedAt: new Date(),
      comment,
    };
    this.purchaseRequestApprovals.set(approval.id, updatedApproval);

    // Reject the entire PR
    const updatedPr: PurchaseRequest = {
      ...pr,
      status: 'rejected',
      updatedAt: new Date(),
    };
    this.purchaseRequests.set(prId, updatedPr);

    // Cancel all other pending approvals
    Array.from(this.purchaseRequestApprovals.values())
      .filter(a => a.prId === prId && a.status === 'pending')
      .forEach(a => {
        const cancelledApproval = { ...a, status: 'rejected' as const, decidedAt: new Date(), comment: 'Cancelled due to rejection at earlier level' };
        this.purchaseRequestApprovals.set(a.id, cancelledApproval);
      });

    // Notify requester
    await this.createNotification({
      userId: pr.requesterId,
      type: 'pr_rejected',
      title: 'Purchase Request Rejected',
      message: `Your Purchase Request ${pr.prNumber} has been rejected. Reason: ${comment}`,
      entityType: 'purchase_request',
      entityId: prId,
      isRead: false,
    });

    return { pr: updatedPr, approval: updatedApproval };
  }

  async convertPRtoPO(prId: string, poData: Partial<InsertPurchaseOrder>): Promise<{ pr: PurchaseRequest; po: PurchaseOrder }> {
    const pr = this.purchaseRequests.get(prId);
    if (!pr) throw new Error('Purchase request not found');
    if (pr.status !== 'approved') throw new Error('Only approved PRs can be converted to POs');

    // Get PR items
    const prItems = Array.from(this.purchaseRequestItems.values()).filter(item => item.prId === prId);
    if (prItems.length === 0) throw new Error('No items found in purchase request');

    // Create the PO
    const poId = this.generateId();
    const now = new Date();
    
    const po: PurchaseOrder = {
      id: poId,
      orderNumber: poData.orderNumber || `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      prId: prId,
      supplierId: pr.supplierId || poData.supplierId!,
      orderDate: poData.orderDate || now.toISOString().split('T')[0],
      expectedDeliveryDate: poData.expectedDeliveryDate || null,
      deliveryDate: null,
      status: 'draft',
      incoterm: poData.incoterm || null,
      paymentTerms: poData.paymentTerms || 30,
      currency: pr.currency,
      fxRate: poData.fxRate || "1",
      subtotal: pr.totalAmount,
      taxAmount: poData.taxAmount || "0",
      totalAmount: pr.totalAmount,
      notes: poData.notes || `Converted from PR ${pr.prNumber}`,
      createdBy: poData.createdBy!,
      createdAt: now,
      updatedAt: now,
    };

    this.purchaseOrders.set(poId, po);

    // Create PO items from PR items
    for (const prItem of prItems) {
      const poItemId = this.generateId();
      const poItem: PurchaseOrderItem = {
        id: poItemId,
        orderId: poId,
        productId: prItem.productId,
        quantity: prItem.quantity,
        unitPrice: prItem.unitPrice || "0",
        totalPrice: prItem.lineTotal || "0",
        createdAt: now,
      };
      this.purchaseOrderItems.set(poItemId, poItem);
    }

    // Update PR to mark as converted
    const updatedPr: PurchaseRequest = {
      ...pr,
      status: 'converted',
      convertedToPo: poId,
      updatedAt: now,
    };
    this.purchaseRequests.set(prId, updatedPr);

    // Notify requester
    await this.createNotification({
      userId: pr.requesterId,
      type: 'pr_converted',
      title: 'Purchase Request Converted to PO',
      message: `Your Purchase Request ${pr.prNumber} has been converted to Purchase Order ${po.orderNumber}.`,
      entityType: 'purchase_request',
      entityId: prId,
      isRead: false,
    });

    return { pr: updatedPr, po };
  }

  // Approval Rules Management
  async getApprovalRules(entityType?: string, currency?: string): Promise<ApprovalRule[]> {
    let rules = Array.from(this.approvalRules.values());
    
    if (entityType) {
      rules = rules.filter(rule => rule.entityType === entityType);
    }
    if (currency) {
      rules = rules.filter(rule => rule.currency === currency);
    }
    
    return rules.sort((a, b) => a.level - b.level);
  }

  async createApprovalRule(rule: InsertApprovalRule): Promise<ApprovalRule> {
    const id = this.generateId();
    const now = new Date();
    
    const approvalRule: ApprovalRule = {
      id,
      entityType: rule.entityType,
      amountRangeMin: rule.amountRangeMin || "0",
      amountRangeMax: rule.amountRangeMax || null,
      currency: rule.currency || "USD",
      level: rule.level,
      approverRole: rule.approverRole || null,
      specificApproverId: rule.specificApproverId || null,
      isActive: rule.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    
    this.approvalRules.set(id, approvalRule);
    return approvalRule;
  }

  async updateApprovalRule(id: string, rule: Partial<InsertApprovalRule>): Promise<ApprovalRule> {
    const existingRule = this.approvalRules.get(id);
    if (!existingRule) throw new Error('Approval rule not found');
    
    const updatedRule: ApprovalRule = {
      ...existingRule,
      ...rule,
      updatedAt: new Date(),
    };
    
    this.approvalRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteApprovalRule(id: string): Promise<void> {
    this.approvalRules.delete(id);
  }

  // Purchase Request Approval Queries
  async getPurchaseRequestApprovals(prId: string): Promise<(PurchaseRequestApproval & { approver: User; rule: ApprovalRule })[]> {
    const approvals = Array.from(this.purchaseRequestApprovals.values())
      .filter(approval => approval.prId === prId)
      .sort((a, b) => a.level - b.level);
    
    return approvals.map(approval => ({
      ...approval,
      approver: this.users.get(approval.approverId)!,
      rule: this.approvalRules.get(approval.ruleId)!,
    }));
  }

  async getPendingApprovalsForUser(userId: string, limit = 50): Promise<(PurchaseRequestApproval & { purchaseRequest: PurchaseRequest & { requester: User; items: (PurchaseRequestItem & { product: Product })[] }; rule: ApprovalRule })[]> {
    const pendingApprovals = Array.from(this.purchaseRequestApprovals.values())
      .filter(approval => approval.approverId === userId && approval.status === 'pending')
      .slice(0, limit);
    
    return pendingApprovals.map(approval => {
      const pr = this.purchaseRequests.get(approval.prId)!;
      const requester = this.users.get(pr.requesterId)!;
      const items = Array.from(this.purchaseRequestItems.values())
        .filter(item => item.prId === pr.id)
        .map(item => ({
          ...item,
          product: this.products.get(item.productId)!
        }));
      
      return {
        ...approval,
        purchaseRequest: {
          ...pr,
          requester,
          items
        },
        rule: this.approvalRules.get(approval.ruleId)!,
      };
    });
  }

  // Notification System Operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.generateId();
    const now = new Date();
    
    const notif: Notification = {
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message || null,
      entityType: notification.entityType || null,
      entityId: notification.entityId || null,
      isRead: notification.isRead ?? false,
      createdAt: now,
    };
    
    this.notifications.set(id, notif);
    return notif;
  }

  async getUserNotifications(userId: string, limit = 50, unreadOnly = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId);
    
    if (unreadOnly) {
      notifications = notifications.filter(notif => !notif.isRead);
    }
    
    return notifications
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) throw new Error('Notification not found');
    
    const updatedNotification: Notification = {
      ...notification,
      isRead: true,
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId && !notif.isRead)
      .forEach(notif => {
        const updatedNotif = { ...notif, isRead: true };
        this.notifications.set(notif.id, updatedNotif);
      });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId && !notif.isRead)
      .length;
  }

  // Approval workflow operations (enhanced)
  async getApprovals(entityType?: string, entityId?: string, approverId?: string): Promise<(Approval & { approver: User })[]> {
    let approvals = Array.from(this.approvals.values());
    
    if (entityType) {
      approvals = approvals.filter(approval => approval.entityType === entityType);
    }
    if (entityId) {
      approvals = approvals.filter(approval => approval.entityId === entityId);
    }
    if (approverId) {
      approvals = approvals.filter(approval => approval.approverId === approverId);
    }
    
    return approvals.map(approval => ({
      ...approval,
      approver: this.users.get(approval.approverId)!,
    }));
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const id = this.generateId();
    const now = new Date();
    
    const newApproval: Approval = {
      id,
      entityType: approval.entityType,
      entityId: approval.entityId,
      step: approval.step,
      approverId: approval.approverId,
      status: approval.status || 'pending',
      decidedAt: approval.decidedAt || null,
      comment: approval.comment || null,
      createdAt: now,
    };
    
    this.approvals.set(id, newApproval);
    return newApproval;
  }

  async processApproval(id: string, status: 'approved' | 'rejected', comment?: string): Promise<Approval> {
    const approval = this.approvals.get(id);
    if (!approval) throw new Error('Approval not found');
    
    const updatedApproval: Approval = {
      ...approval,
      status,
      decidedAt: new Date(),
      comment: comment || approval.comment,
    };
    
    this.approvals.set(id, updatedApproval);
    return updatedApproval;
  }
  async getGoodsReceipts(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteGoodsReceipt(id: string): Promise<void> {
    // Delete associated items first
    const itemsToDelete = Array.from(this.goodsReceiptItems.values()).filter(item => item.grId === id);
    itemsToDelete.forEach(item => this.goodsReceiptItems.delete(item.id));
    
    // Delete the goods receipt
    this.goodsReceipts.delete(id);
  }
  async postGoodsReceipt(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getVendorBills(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async getVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async createVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async updateVendorBill(): Promise<any> { throw new Error("Not implemented in memory storage"); }
  async deleteVendorBill(id: string): Promise<void> {
    // Delete associated items first
    const itemsToDelete = Array.from(this.vendorBillItems.values()).filter(item => item.billId === id);
    itemsToDelete.forEach(item => this.vendorBillItems.delete(item.id));
    
    // Delete the vendor bill
    this.vendorBills.delete(id);
  }
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
  async deleteCompetitorPrice(id: string): Promise<void> {
    this.competitorPrices.delete(id);
  }
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

}