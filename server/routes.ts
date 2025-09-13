import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { externalIntegrationsService } from "./external-integrations";
import { 
  insertCustomerSchema,
  insertSupplierSchema,
  insertWarehouseSchema,
  insertProductSchema,
  insertInventorySchema,
  insertSalesOrderSchema,
  insertSalesOrderItemSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertPurchaseRequestSchema,
  insertPurchaseRequestItemSchema,
  insertApprovalSchema,
  insertGoodsReceiptSchema,
  insertGoodsReceiptItemSchema,
  insertVendorBillSchema,
  insertVendorBillItemSchema,
  insertFxRateSchema,
  insertCompetitorPriceSchema,
  insertMatchResultSchema,
  insertInvoiceSchema,
  insertStockMovementSchema,
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertReceiptSchema,
  insertCommissionEntrySchema,
  insertCreditOverrideSchema,
  insertLeadSchema,
  insertCommunicationSchema,
  insertPosTerminalSchema,
  insertPosSessionSchema,
  insertCashMovementSchema,
  insertEmployeeSchema,
  insertTimeEntrySchema,
  insertPayrollRunSchema,
  insertPayrollItemSchema,
  insertPerformanceReviewSchema,
  openSessionRequestSchema,
  closeSessionRequestSchema,
  createPosSaleRequestSchema,
} from "@shared/schema";
import { z } from "zod";
import type { RequestHandler } from "express";

// RBAC middleware to check user roles
const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.role || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Access denied. Required roles: " + allowedRoles.join(", ") + ". Your role: " + (user.role || 'none')
        });
      }

      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

// POS access middleware (admin, pos, sales roles only)
const requirePosAccess = requireRole(['admin', 'pos', 'sales']);

// HR access middleware (admin, hr roles only)
const requireHrAccess = requireRole(['admin', 'hr']);

// Sales access middleware (admin, sales roles only)
const requireSalesAccess = requireRole(['admin', 'sales']);

// Finance access middleware (admin, finance roles only)
const requireFinanceAccess = requireRole(['admin', 'finance']);

// Purchase access middleware (admin, finance, inventory roles only)
const requirePurchaseAccess = requireRole(['admin', 'finance', 'inventory']);

// Purchase approval middleware (admin, finance roles with management level)
const requirePurchaseApproval = requireRole(['admin', 'finance']);

// Time tracking access middleware - allows employees to manage their own entries
const requireTimeTrackingAccess: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Admin and HR have full access
    if (user.role === 'admin' || user.role === 'hr') {
      return next();
    }

    // Get employee record for current user
    const employee = await storage.getEmployeeByUserId(userId);
    if (!employee) {
      return res.status(403).json({ message: "Employee record not found" });
    }

    // For employee access, check if they're accessing their own data
    const employeeId = req.query.employeeId as string || req.body.employeeId;
    const timeEntryId = req.params.id;

    if (employeeId && employeeId !== employee.id) {
      return res.status(403).json({ message: "Access denied. You can only access your own time entries." });
    }

    if (timeEntryId) {
      // Check if the time entry belongs to this employee
      const timeEntry = await storage.getTimeEntry(timeEntryId);
      if (!timeEntry || timeEntry.employeeId !== employee.id) {
        return res.status(403).json({ message: "Access denied. You can only access your own time entries." });
      }
    }

    // Add employee info to request for convenience
    (req as any).employee = employee;
    next();
  } catch (error) {
    console.error("Error in time tracking access check:", error);
    res.status(500).json({ message: "Authorization check failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (no database required)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseConfigured: !!process.env.DATABASE_URL,
      sessionConfigured: !!process.env.SESSION_SECRET,
      openaiConfigured: !!process.env.OPENAI_API_KEY
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/transactions", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  app.get("/api/dashboard/expiring-products", isAuthenticated, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 90;
      const expiringProducts = await storage.getExpiringProducts(daysAhead);
      res.json(expiringProducts);
    } catch (error) {
      console.error("Error fetching expiring products:", error);
      res.status(500).json({ message: "Failed to fetch expiring products" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const customers = await storage.getCustomers(limit);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(400).json({ message: "Failed to create customer", error: error.message });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Failed to update customer", error: error.message });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const suppliers = await storage.getSuppliers(limit);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error: any) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ message: "Failed to create supplier", error: error.message });
    }
  });

  // Warehouse routes
  app.get("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.post("/api/warehouses", isAuthenticated, async (req, res) => {
    try {
      const warehouseData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(warehouseData);
      res.status(201).json(warehouse);
    } catch (error: any) {
      console.error("Error creating warehouse:", error);
      res.status(400).json({ message: "Failed to create warehouse", error: error.message });
    }
  });

  // Product routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const products = await storage.getProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product", error: error.message });
    }
  });

  // Inventory routes
  app.get("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const warehouseId = req.query.warehouseId as string;
      const inventory = await storage.getInventory(warehouseId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      const inventory = await storage.createInventory(inventoryData);
      res.status(201).json(inventory);
    } catch (error: any) {
      console.error("Error creating inventory:", error);
      res.status(400).json({ message: "Failed to create inventory", error: error.message });
    }
  });

  // Sales order routes
  app.get("/api/sales-orders", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const orders = await storage.getSalesOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  app.get("/api/sales-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getSalesOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching sales order:", error);
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  app.post("/api/sales-orders", isAuthenticated, async (req, res) => {
    try {
      const orderData = insertSalesOrderSchema.parse(req.body);
      const order = await storage.createSalesOrder(orderData);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      res.status(400).json({ message: "Failed to create sales order", error: error.message });
    }
  });

  app.post("/api/sales-orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const itemData = insertSalesOrderItemSchema.parse({
        ...req.body,
        orderId: req.params.id,
      });
      const item = await storage.createSalesOrderItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating sales order item:", error);
      res.status(400).json({ message: "Failed to create sales order item", error: error.message });
    }
  });

  // Comprehensive Purchases Module API Endpoints
  
  // Purchase Request routes
  app.get("/api/purchases/requests", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const requesterId = req.query.requesterId as string;
      const requests = await storage.getPurchaseRequests(limit, status, requesterId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      res.status(500).json({ message: "Failed to fetch purchase requests" });
    }
  });

  app.get("/api/purchases/requests/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const request = await storage.getPurchaseRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching purchase request:", error);
      res.status(500).json({ message: "Failed to fetch purchase request" });
    }
  });

  app.post("/api/purchases/requests", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const requestData = insertPurchaseRequestSchema.parse({
        ...req.body,
        requesterId: userId,
      });
      const request = await storage.createPurchaseRequest(requestData);
      res.status(201).json(request);
    } catch (error: any) {
      console.error("Error creating purchase request:", error);
      res.status(400).json({ message: "Failed to create purchase request", error: error.message });
    }
  });

  app.put("/api/purchases/requests/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const requestData = insertPurchaseRequestSchema.partial().parse(req.body);
      const request = await storage.updatePurchaseRequest(req.params.id, requestData);
      res.json(request);
    } catch (error: any) {
      console.error("Error updating purchase request:", error);
      res.status(400).json({ message: "Failed to update purchase request", error: error.message });
    }
  });

  app.delete("/api/purchases/requests/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      await storage.deletePurchaseRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase request:", error);
      res.status(500).json({ message: "Failed to delete purchase request" });
    }
  });

  app.post("/api/purchases/requests/:id/items", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const itemData = insertPurchaseRequestItemSchema.parse({
        ...req.body,
        prId: req.params.id,
      });
      const item = await storage.createPurchaseRequestItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating purchase request item:", error);
      res.status(400).json({ message: "Failed to create purchase request item", error: error.message });
    }
  });

  app.post("/api/purchases/requests/:id/submit", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const request = await storage.submitPurchaseRequest(req.params.id);
      res.json(request);
    } catch (error) {
      console.error("Error submitting purchase request:", error);
      res.status(500).json({ message: "Failed to submit purchase request" });
    }
  });

  app.post("/api/purchases/requests/:id/approve", isAuthenticated, requirePurchaseApproval, async (req, res) => {
    try {
      const approverId = (req as any).user?.claims?.sub;
      const request = await storage.approvePurchaseRequest(req.params.id, approverId);
      res.json(request);
    } catch (error) {
      console.error("Error approving purchase request:", error);
      res.status(500).json({ message: "Failed to approve purchase request" });
    }
  });

  app.post("/api/purchases/requests/:id/reject", isAuthenticated, requirePurchaseApproval, async (req, res) => {
    try {
      const approverId = (req as any).user?.claims?.sub;
      const { comment } = req.body;
      const request = await storage.rejectPurchaseRequest(req.params.id, approverId, comment);
      res.json(request);
    } catch (error) {
      console.error("Error rejecting purchase request:", error);
      res.status(500).json({ message: "Failed to reject purchase request" });
    }
  });

  app.post("/api/purchases/requests/:id/convert", isAuthenticated, requirePurchaseApproval, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const poData = req.body;
      const result = await storage.convertPRtoPO(req.params.id, { ...poData, createdBy: userId });
      res.json(result);
    } catch (error) {
      console.error("Error converting purchase request to PO:", error);
      res.status(500).json({ message: "Failed to convert purchase request to PO" });
    }
  });

  // Enhanced Purchase Order routes
  app.get("/api/purchases/orders", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const orders = await storage.getPurchaseOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchases/orders/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchases/orders", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const orderData = insertPurchaseOrderSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      res.status(400).json({ message: "Failed to create purchase order", error: error.message });
    }
  });

  app.put("/api/purchases/orders/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const orderData = insertPurchaseOrderSchema.partial().parse(req.body);
      const order = await storage.updatePurchaseOrder(req.params.id, orderData);
      res.json(order);
    } catch (error: any) {
      console.error("Error updating purchase order:", error);
      res.status(400).json({ message: "Failed to update purchase order", error: error.message });
    }
  });

  app.post("/api/purchases/orders/:id/items", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const itemData = insertPurchaseOrderItemSchema.parse({
        ...req.body,
        orderId: req.params.id,
      });
      const item = await storage.createPurchaseOrderItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating purchase order item:", error);
      res.status(400).json({ message: "Failed to create purchase order item", error: error.message });
    }
  });

  // Goods Receipt routes
  app.get("/api/purchases/receipts", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const poId = req.query.poId as string;
      const receipts = await storage.getGoodsReceipts(limit, poId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching goods receipts:", error);
      res.status(500).json({ message: "Failed to fetch goods receipts" });
    }
  });

  app.get("/api/purchases/receipts/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const receipt = await storage.getGoodsReceipt(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Goods receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching goods receipt:", error);
      res.status(500).json({ message: "Failed to fetch goods receipt" });
    }
  });

  app.post("/api/purchases/receipts", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const { items, ...receiptData } = req.body;
      const receipt = await storage.createGoodsReceipt({
        ...receiptData,
        receivedBy: userId,
        receivedAt: new Date(),
      }, items || []);
      res.status(201).json(receipt);
    } catch (error: any) {
      console.error("Error creating goods receipt:", error);
      res.status(400).json({ message: "Failed to create goods receipt", error: error.message });
    }
  });

  app.post("/api/purchases/receipts/:id/post", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const receipt = await storage.postGoodsReceipt(req.params.id);
      res.json(receipt);
    } catch (error) {
      console.error("Error posting goods receipt:", error);
      res.status(500).json({ message: "Failed to post goods receipt" });
    }
  });

  // Vendor Bill routes
  app.get("/api/purchases/bills", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const supplierId = req.query.supplierId as string;
      const bills = await storage.getVendorBills(limit, supplierId);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching vendor bills:", error);
      res.status(500).json({ message: "Failed to fetch vendor bills" });
    }
  });

  app.get("/api/purchases/bills/:id", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const bill = await storage.getVendorBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Vendor bill not found" });
      }
      res.json(bill);
    } catch (error) {
      console.error("Error fetching vendor bill:", error);
      res.status(500).json({ message: "Failed to fetch vendor bill" });
    }
  });

  app.post("/api/purchases/bills", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const { items, ...billData } = req.body;
      const bill = await storage.createVendorBill({
        ...billData,
        createdBy: userId,
      }, items || []);
      res.status(201).json(bill);
    } catch (error: any) {
      console.error("Error creating vendor bill:", error);
      res.status(400).json({ message: "Failed to create vendor bill", error: error.message });
    }
  });

  app.post("/api/purchases/bills/:id/post", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const bill = await storage.postVendorBill(req.params.id);
      res.json(bill);
    } catch (error) {
      console.error("Error posting vendor bill:", error);
      res.status(500).json({ message: "Failed to post vendor bill" });
    }
  });

  app.post("/api/purchases/bills/:id/ocr", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const { ocrRaw, ocrExtract } = req.body;
      const bill = await storage.processOCRBill(req.params.id, ocrRaw, ocrExtract);
      res.json(bill);
    } catch (error) {
      console.error("Error processing OCR for bill:", error);
      res.status(500).json({ message: "Failed to process OCR" });
    }
  });

  // Three-Way Matching routes
  app.get("/api/purchases/match", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const poId = req.query.poId as string;
      const status = req.query.status as string;
      const matches = await storage.getMatchResults(poId, status);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching match results:", error);
      res.status(500).json({ message: "Failed to fetch match results" });
    }
  });

  app.post("/api/purchases/match/:poId", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const matchResult = await storage.performThreeWayMatch(req.params.poId);
      res.json(matchResult);
    } catch (error) {
      console.error("Error performing three-way match:", error);
      res.status(500).json({ message: "Failed to perform three-way match" });
    }
  });

  app.post("/api/purchases/match/:id/resolve", isAuthenticated, requirePurchaseApproval, async (req, res) => {
    try {
      const resolvedBy = (req as any).user?.claims?.sub;
      const { notes } = req.body;
      const matchResult = await storage.resolveMatchException(req.params.id, resolvedBy, notes);
      res.json(matchResult);
    } catch (error) {
      console.error("Error resolving match exception:", error);
      res.status(500).json({ message: "Failed to resolve match exception" });
    }
  });

  // FX Rate routes
  app.get("/api/fx/rates", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const baseCurrency = req.query.baseCurrency as string;
      const quoteCurrency = req.query.quoteCurrency as string;
      const rates = await storage.getFxRates(baseCurrency, quoteCurrency);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching FX rates:", error);
      res.status(500).json({ message: "Failed to fetch FX rates" });
    }
  });

  app.get("/api/fx/latest", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const baseCurrency = req.query.baseCurrency as string;
      const quoteCurrency = req.query.quoteCurrency as string;
      
      if (!baseCurrency || !quoteCurrency) {
        return res.status(400).json({ message: "baseCurrency and quoteCurrency are required" });
      }
      
      const rate = await storage.getFxRateLatest(baseCurrency, quoteCurrency);
      res.json(rate);
    } catch (error) {
      console.error("Error fetching latest FX rate:", error);
      res.status(500).json({ message: "Failed to fetch latest FX rate" });
    }
  });

  app.post("/api/fx/refresh", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const rates = await storage.refreshFxRates();
      res.json(rates);
    } catch (error) {
      console.error("Error refreshing FX rates:", error);
      res.status(500).json({ message: "Failed to refresh FX rates" });
    }
  });

  // Competitor Price routes
  app.get("/api/purchases/competitor-prices", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const competitor = req.query.competitor as string;
      const prices = await storage.getCompetitorPrices(productId, competitor);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching competitor prices:", error);
      res.status(500).json({ message: "Failed to fetch competitor prices" });
    }
  });

  app.post("/api/purchases/competitor-prices", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const priceData = insertCompetitorPriceSchema.parse(req.body);
      const price = await storage.upsertCompetitorPrice(priceData);
      res.status(201).json(price);
    } catch (error: any) {
      console.error("Error upserting competitor price:", error);
      res.status(400).json({ message: "Failed to upsert competitor price", error: error.message });
    }
  });

  app.get("/api/purchases/competitor-analysis", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const analysis = await storage.getCompetitorAnalysis(productId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching competitor analysis:", error);
      res.status(500).json({ message: "Failed to fetch competitor analysis" });
    }
  });

  // Purchase Dashboard routes
  app.get("/api/purchases/dashboard", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const metrics = await storage.getPurchaseDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching purchase dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch purchase dashboard metrics" });
    }
  });

  // Approval workflow routes
  app.get("/api/purchases/approvals", isAuthenticated, requirePurchaseAccess, async (req, res) => {
    try {
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const approverId = req.query.approverId as string;
      const approvals = await storage.getApprovals(entityType, entityId, approverId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  app.post("/api/purchases/approvals/:id/process", isAuthenticated, requirePurchaseApproval, async (req, res) => {
    try {
      const { status, comment } = req.body;
      const approval = await storage.processApproval(req.params.id, status, comment);
      res.json(approval);
    } catch (error) {
      console.error("Error processing approval:", error);
      res.status(500).json({ message: "Failed to process approval" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const invoices = await storage.getInvoices(limit);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice", error: error.message });
    }
  });

  // Stock movement routes
  app.get("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const movements = await storage.getStockMovements(limit);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const movementData = insertStockMovementSchema.parse({
        ...req.body,
        userId: (req as any).user?.claims?.sub,
      });
      const movement = await storage.createStockMovement(movementData);
      res.status(201).json(movement);
    } catch (error: any) {
      console.error("Error creating stock movement:", error);
      res.status(400).json({ message: "Failed to create stock movement", error: error.message });
    }
  });

  // AI routes
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      // Get business context
      const metrics = await storage.getDashboardMetrics();
      const expiringProducts = await storage.getExpiringProducts(90);
      const recentTransactions = await storage.getRecentTransactions(10);

      const businessContext = {
        metrics,
        expiringProducts: expiringProducts.slice(0, 5), // Limit for context
        recentTransactions: recentTransactions.slice(0, 5),
      };

      const response = await aiService.processChatQuery(query, businessContext);
      res.json(response);
    } catch (error) {
      console.error("Error processing AI chat:", error);
      res.status(500).json({ message: "Failed to process AI query" });
    }
  });

  app.get("/api/ai/recommendations", isAuthenticated, async (req, res) => {
    try {
      // Get inventory data for recommendations
      const inventory = await storage.getInventory();
      const products = await storage.getProducts();
      
      // Prepare data for AI analysis
      const inventoryAnalysis = inventory.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        currentStock: item.quantity,
        salesHistory: [100, 120, 95, 110, 130], // Mock data - would come from sales analysis
        leadTimeDays: 7, // Mock data - would come from supplier data
        minStockLevel: item.product.minStockLevel || 0,
      }));

      const recommendations = await aiService.generateInventoryRecommendations(inventoryAnalysis);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      res.status(500).json({ message: "Failed to generate AI recommendations" });
    }
  });

  app.get("/api/ai/insights", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      const recentTransactions = await storage.getRecentTransactions(20);
      const inventory = await storage.getInventory();

      const businessData = {
        salesMetrics: {
          totalRevenue: metrics.totalRevenue,
          recentTransactions: recentTransactions.filter(t => t.type === 'sale'),
        },
        inventoryMetrics: {
          activeProducts: metrics.activeProducts,
          expiringProductsCount: metrics.expiringProductsCount,
          totalItems: inventory.length,
        },
        customerMetrics: {
          // Would include customer data analysis
        },
        financialMetrics: {
          outstandingAmount: metrics.outstandingAmount,
          openOrders: metrics.openOrders,
        },
      };

      const insights = await aiService.generateBusinessInsights(businessData);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // POS Terminal routes
  app.get("/api/pos/terminals", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const terminals = await storage.getPosTerminals();
      res.json(terminals);
    } catch (error) {
      console.error("Error fetching POS terminals:", error);
      res.status(500).json({ message: "Failed to fetch POS terminals" });
    }
  });

  app.post("/api/pos/terminals", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const terminalData = insertPosTerminalSchema.parse(req.body);
      const terminal = await storage.createPosTerminal(terminalData);
      res.status(201).json(terminal);
    } catch (error: any) {
      console.error("Error creating POS terminal:", error);
      res.status(400).json({ message: "Failed to create POS terminal", error: error.message });
    }
  });

  app.patch("/api/pos/terminals/:id", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const terminalData = insertPosTerminalSchema.partial().parse(req.body);
      const terminal = await storage.updatePosTerminal(req.params.id, terminalData);
      res.json(terminal);
    } catch (error: any) {
      console.error("Error updating POS terminal:", error);
      res.status(400).json({ message: "Failed to update POS terminal", error: error.message });
    }
  });

  // POS Session routes
  app.get("/api/pos/sessions", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await storage.getPosSessions(limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching POS sessions:", error);
      res.status(500).json({ message: "Failed to fetch POS sessions" });
    }
  });

  app.get("/api/pos/sessions/active/:terminalId", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const session = await storage.getActivePosSession(req.params.terminalId);
      if (!session) {
        return res.status(404).json({ message: "No active session found for terminal" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching active POS session:", error);
      res.status(500).json({ message: "Failed to fetch active POS session" });
    }
  });

  app.post("/api/pos/sessions/open", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      // Validate request using proper request schema
      const requestData = openSessionRequestSchema.parse(req.body);
      
      // Build full session data with computed fields
      const sessionData = insertPosSessionSchema.parse({
        terminalId: requestData.terminalId,
        startingCash: requestData.startingCash,
        expectedCash: requestData.startingCash, // Initial expected cash equals starting cash
        actualCash: 0, // Will be set when session is closed
        totalSales: 0, // Initial sales is 0
        totalTransactions: 0, // Initial transactions is 0
        cashierId: (req as any).user?.claims?.sub,
        sessionNumber: `SES-${Date.now()}`,
        startTime: new Date(),
        status: 'open',
      });
      const session = await storage.openPosSession(sessionData);
      res.status(201).json(session);
    } catch (error: any) {
      console.error("Error opening POS session:", error);
      res.status(400).json({ message: "Failed to open POS session", error: error.message });
    }
  });

  app.patch("/api/pos/sessions/:id/close", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      // Use shared close session request schema
      const { actualCash, notes } = closeSessionRequestSchema.parse(req.body);
      const session = await storage.closePosSession(req.params.id, actualCash, notes);
      res.json(session);
    } catch (error: any) {
      console.error("Error closing POS session:", error);
      res.status(400).json({ message: "Failed to close POS session", error: error.message });
    }
  });

  // POS Sales/Receipt routes
  app.get("/api/pos/receipts", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const receipts = await storage.getPosReceipts(sessionId, limit);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching POS receipts:", error);
      res.status(500).json({ message: "Failed to fetch POS receipts" });
    }
  });

  app.get("/api/pos/receipts/:id", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const receipt = await storage.getPosReceipt(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching POS receipt:", error);
      res.status(500).json({ message: "Failed to fetch POS receipt" });
    }
  });

  app.post("/api/pos/sales", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      // Use shared sale request schema
      const saleData = createPosSaleRequestSchema.parse(req.body);
      const result = await storage.createPosSale(saleData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating POS sale:", error);
      res.status(400).json({ message: "Failed to create POS sale", error: error.message });
    }
  });

  // Cash movement routes
  app.get("/api/pos/sessions/:sessionId/cash-movements", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const movements = await storage.getCashMovements(req.params.sessionId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching cash movements:", error);
      res.status(500).json({ message: "Failed to fetch cash movements" });
    }
  });

  app.post("/api/pos/cash-movements", isAuthenticated, requirePosAccess, async (req, res) => {
    try {
      const movementData = insertCashMovementSchema.parse({
        ...req.body,
        userId: (req as any).user?.claims?.sub,
      });
      const movement = await storage.createCashMovement(movementData);
      res.status(201).json(movement);
    } catch (error: any) {
      console.error("Error creating cash movement:", error);
      res.status(400).json({ message: "Failed to create cash movement", error: error.message });
    }
  });

  // ==== HR MODULE ROUTES ====
  
  // Employee Management Routes
  app.get("/api/hr/employees", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const department = req.query.department as string;
      const employees = await storage.getEmployees(limit, department);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/hr/employees/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/hr/employees", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee", error: error.message });
    }
  });

  app.patch("/api/hr/employees/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, employeeData);
      res.json(employee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee", error: error.message });
    }
  });

  app.delete("/api/hr/employees/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Time Tracking Routes - with query parameter validation
  app.get("/api/hr/time-entries", isAuthenticated, requireTimeTrackingAccess, async (req, res) => {
    try {
      // Query parameter validation
      const querySchema = z.object({
        employeeId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
      });

      const { employeeId, startDate, endDate, limit } = querySchema.parse(req.query);
      
      // For non-admin/hr users, ensure they can only see their own entries
      const finalEmployeeId = employeeId || (req as any).employee?.id;
      
      const timeEntries = await storage.getTimeEntries(finalEmployeeId, startDate, endDate, limit);
      res.json(timeEntries);
    } catch (error: any) {
      console.error("Error fetching time entries:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch time entries" });
      }
    }
  });

  app.get("/api/hr/time-entries/:id", isAuthenticated, requireTimeTrackingAccess, async (req, res) => {
    try {
      const timeEntry = await storage.getTimeEntry(req.params.id);
      if (!timeEntry) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      res.json(timeEntry);
    } catch (error) {
      console.error("Error fetching time entry:", error);
      res.status(500).json({ message: "Failed to fetch time entry" });
    }
  });

  app.post("/api/hr/time-entries", isAuthenticated, requireTimeTrackingAccess, async (req, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.parse(req.body);
      
      // For non-admin/hr users, ensure they can only create entries for themselves
      const employee = (req as any).employee;
      if (employee && timeEntryData.employeeId !== employee.id) {
        return res.status(403).json({ message: "You can only create time entries for yourself" });
      }

      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error: any) {
      console.error("Error creating time entry:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create time entry", error: error.message });
      }
    }
  });

  app.patch("/api/hr/time-entries/:id", isAuthenticated, requireTimeTrackingAccess, async (req, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.partial().parse(req.body);
      const timeEntry = await storage.updateTimeEntry(req.params.id, timeEntryData);
      res.json(timeEntry);
    } catch (error: any) {
      console.error("Error updating time entry:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid time entry data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update time entry", error: error.message });
      }
    }
  });

  app.patch("/api/hr/time-entries/:id/approve", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const approverId = (req as any).user?.claims?.sub;
      if (!approverId) {
        return res.status(401).json({ message: "Unable to identify approving user" });
      }
      
      const timeEntry = await storage.approveTimeEntry(req.params.id, approverId);
      res.json(timeEntry);
    } catch (error: any) {
      console.error("Error approving time entry:", error);
      res.status(400).json({ message: "Failed to approve time entry", error: error.message });
    }
  });

  // Payroll Management Routes
  app.get("/api/hr/payroll-runs", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const payrollRuns = await storage.getPayrollRuns();
      res.json(payrollRuns);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      res.status(500).json({ message: "Failed to fetch payroll runs" });
    }
  });

  app.get("/api/hr/payroll-runs/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const payrollRun = await storage.getPayrollRun(req.params.id);
      if (!payrollRun) {
        return res.status(404).json({ message: "Payroll run not found" });
      }
      res.json(payrollRun);
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      res.status(500).json({ message: "Failed to fetch payroll run" });
    }
  });

  app.post("/api/hr/payroll-runs", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const payrollData = insertPayrollRunSchema.parse({
        ...req.body,
        processedBy: (req as any).user?.claims?.sub,
      });
      const payrollRun = await storage.createPayrollRun(payrollData);
      res.status(201).json(payrollRun);
    } catch (error: any) {
      console.error("Error creating payroll run:", error);
      res.status(400).json({ message: "Failed to create payroll run", error: error.message });
    }
  });

  app.patch("/api/hr/payroll-runs/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const payrollData = insertPayrollRunSchema.partial().parse(req.body);
      const payrollRun = await storage.updatePayrollRun(req.params.id, payrollData);
      res.json(payrollRun);
    } catch (error: any) {
      console.error("Error updating payroll run:", error);
      res.status(400).json({ message: "Failed to update payroll run", error: error.message });
    }
  });

  app.patch("/api/hr/payroll-runs/:id/process", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const processedBy = (req as any).user?.claims?.sub;
      if (!processedBy) {
        return res.status(401).json({ message: "Unable to identify processing user" });
      }
      
      const payrollRun = await storage.processPayroll(req.params.id, processedBy);
      res.json(payrollRun);
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      res.status(400).json({ message: "Failed to process payroll", error: error.message });
    }
  });

  app.get("/api/hr/payroll-items", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      // Query parameter validation
      const querySchema = z.object({
        payrollRunId: z.string().optional(),
        employeeId: z.string().optional(),
      });

      const { payrollRunId, employeeId } = querySchema.parse(req.query);
      const payrollItems = await storage.getPayrollItems(payrollRunId, employeeId);
      res.json(payrollItems);
    } catch (error: any) {
      console.error("Error fetching payroll items:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch payroll items" });
      }
    }
  });

  app.post("/api/hr/payroll-items", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const payrollItemData = insertPayrollItemSchema.parse(req.body);
      const payrollItem = await storage.createPayrollItem(payrollItemData);
      res.status(201).json(payrollItem);
    } catch (error: any) {
      console.error("Error creating payroll item:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid payroll item data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create payroll item", error: error.message });
      }
    }
  });

  // Performance Review Routes
  app.get("/api/hr/performance-reviews", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      // Query parameter validation
      const querySchema = z.object({
        employeeId: z.string().optional(),
        reviewerId: z.string().optional(),
        status: z.string().optional(),
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
      });

      const { employeeId, reviewerId, status, limit } = querySchema.parse(req.query);
      const reviews = await storage.getPerformanceReviews(employeeId, reviewerId, status, limit);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching performance reviews:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch performance reviews" });
      }
    }
  });

  app.get("/api/hr/performance-reviews/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const review = await storage.getPerformanceReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Performance review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error fetching performance review:", error);
      res.status(500).json({ message: "Failed to fetch performance review" });
    }
  });

  app.post("/api/hr/performance-reviews", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const reviewData = insertPerformanceReviewSchema.parse(req.body);
      const review = await storage.createPerformanceReview(reviewData);
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating performance review:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid performance review data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create performance review", error: error.message });
      }
    }
  });

  app.patch("/api/hr/performance-reviews/:id", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const reviewData = insertPerformanceReviewSchema.partial().parse(req.body);
      const review = await storage.updatePerformanceReview(req.params.id, reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error updating performance review:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid performance review data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update performance review", error: error.message });
      }
    }
  });

  app.patch("/api/hr/performance-reviews/:id/complete", isAuthenticated, requireHrAccess, async (req, res) => {
    try {
      const review = await storage.completePerformanceReview(req.params.id);
      res.json(review);
    } catch (error: any) {
      console.error("Error completing performance review:", error);
      res.status(400).json({ message: "Failed to complete performance review", error: error.message });
    }
  });

  // =============================================================================
  // CRM MODULE ROUTES
  // =============================================================================

  // Quotation Management Routes
  app.get("/api/crm/quotations", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 100),
        status: z.string().optional(),
      });

      const { limit, status } = querySchema.parse(req.query);
      const quotations = await storage.getQuotations(limit, status);
      res.json(quotations);
    } catch (error: any) {
      console.error("Error fetching quotations:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch quotations" });
      }
    }
  });

  app.get("/api/crm/quotations/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/crm/quotations", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const quotationData = insertQuotationSchema.parse(req.body);
      const quotation = await storage.createQuotation(quotationData);
      res.status(201).json(quotation);
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create quotation", error: error.message });
      }
    }
  });

  app.patch("/api/crm/quotations/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const quotationData = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(req.params.id, quotationData);
      res.json(quotation);
    } catch (error: any) {
      console.error("Error updating quotation:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update quotation", error: error.message });
      }
    }
  });

  app.delete("/api/crm/quotations/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      await storage.deleteQuotation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  app.post("/api/crm/quotations/:id/items", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const itemData = insertQuotationItemSchema.parse(req.body);
      const item = await storage.createQuotationItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating quotation item:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid quotation item data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create quotation item", error: error.message });
      }
    }
  });

  app.post("/api/crm/quotations/:id/convert", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const orderData = req.body.orderData || {};
      const order = await storage.convertQuotationToOrder(req.params.id, orderData);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error converting quotation to order:", error);
      res.status(400).json({ message: "Failed to convert quotation to order", error: error.message });
    }
  });

  // Receipt Management Routes
  app.get("/api/crm/receipts", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 100),
        customerId: z.string().optional(),
      });

      const { limit, customerId } = querySchema.parse(req.query);
      const receipts = await storage.getReceipts(limit, customerId);
      res.json(receipts);
    } catch (error: any) {
      console.error("Error fetching receipts:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch receipts" });
      }
    }
  });

  app.get("/api/crm/receipts/:id", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const receipt = await storage.getReceipt(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });

  app.post("/api/crm/receipts", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const receiptData = insertReceiptSchema.parse(req.body);
      const receipt = await storage.createReceipt(receiptData);
      res.status(201).json(receipt);
    } catch (error: any) {
      console.error("Error creating receipt:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid receipt data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create receipt", error: error.message });
      }
    }
  });

  app.patch("/api/crm/receipts/:id", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const receiptData = insertReceiptSchema.partial().parse(req.body);
      const receipt = await storage.updateReceipt(req.params.id, receiptData);
      res.json(receipt);
    } catch (error: any) {
      console.error("Error updating receipt:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid receipt data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update receipt", error: error.message });
      }
    }
  });

  app.post("/api/crm/receipts/:receiptId/allocate/:invoiceId", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      const result = await storage.allocateReceiptToInvoice(req.params.receiptId, req.params.invoiceId, amount);
      res.json(result);
    } catch (error: any) {
      console.error("Error allocating receipt to invoice:", error);
      res.status(400).json({ message: "Failed to allocate receipt to invoice", error: error.message });
    }
  });

  // Commission Management Routes
  app.get("/api/crm/commissions", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        salesRepId: z.string().optional(),
        status: z.string().optional(),
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 100),
      });

      const { salesRepId, status, limit } = querySchema.parse(req.query);
      const commissions = await storage.getCommissionEntries(salesRepId, status, limit);
      res.json(commissions);
    } catch (error: any) {
      console.error("Error fetching commissions:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch commissions" });
      }
    }
  });

  app.get("/api/crm/commissions/:id", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const commission = await storage.getCommissionEntry(req.params.id);
      if (!commission) {
        return res.status(404).json({ message: "Commission entry not found" });
      }
      res.json(commission);
    } catch (error) {
      console.error("Error fetching commission:", error);
      res.status(500).json({ message: "Failed to fetch commission" });
    }
  });

  app.post("/api/crm/commissions", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const commissionData = insertCommissionEntrySchema.parse(req.body);
      const commission = await storage.createCommissionEntry(commissionData);
      res.status(201).json(commission);
    } catch (error: any) {
      console.error("Error creating commission:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid commission data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create commission", error: error.message });
      }
    }
  });

  app.patch("/api/crm/commissions/:id/approve", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unable to identify approving user" });
      }
      
      const commission = await storage.approveCommission(req.params.id, userId);
      res.json(commission);
    } catch (error: any) {
      console.error("Error approving commission:", error);
      res.status(400).json({ message: "Failed to approve commission", error: error.message });
    }
  });

  app.get("/api/crm/commissions/summary/:salesRepId", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      });

      const { startDate, endDate } = querySchema.parse(req.query);
      const summary = await storage.getSalesRepCommissionSummary(req.params.salesRepId, startDate, endDate);
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching commission summary:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch commission summary" });
      }
    }
  });

  // Credit Override Management Routes
  app.get("/api/crm/credit-overrides", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        customerId: z.string().optional(),
        status: z.string().optional(),
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 100),
      });

      const { customerId, status, limit } = querySchema.parse(req.query);
      const overrides = await storage.getCreditOverrides(customerId, status, limit);
      res.json(overrides);
    } catch (error: any) {
      console.error("Error fetching credit overrides:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch credit overrides" });
      }
    }
  });

  app.get("/api/crm/credit-overrides/:id", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const override = await storage.getCreditOverride(req.params.id);
      if (!override) {
        return res.status(404).json({ message: "Credit override not found" });
      }
      res.json(override);
    } catch (error) {
      console.error("Error fetching credit override:", error);
      res.status(500).json({ message: "Failed to fetch credit override" });
    }
  });

  app.post("/api/crm/credit-overrides", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const overrideData = insertCreditOverrideSchema.parse(req.body);
      const override = await storage.createCreditOverride(overrideData);
      res.status(201).json(override);
    } catch (error: any) {
      console.error("Error creating credit override:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid credit override data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create credit override", error: error.message });
      }
    }
  });

  app.patch("/api/crm/credit-overrides/:id/approve", isAuthenticated, requireFinanceAccess, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unable to identify approving user" });
      }

      const { approvedAmount } = req.body;
      if (!approvedAmount || approvedAmount <= 0) {
        return res.status(400).json({ message: "Valid approved amount is required" });
      }
      
      const override = await storage.approveCreditOverride(req.params.id, userId, approvedAmount);
      res.json(override);
    } catch (error: any) {
      console.error("Error approving credit override:", error);
      res.status(400).json({ message: "Failed to approve credit override", error: error.message });
    }
  });

  app.get("/api/crm/customers/:customerId/credit-check", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const { orderAmount } = req.query;
      if (!orderAmount) {
        return res.status(400).json({ message: "Order amount is required" });
      }

      const amount = parseFloat(orderAmount as string);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Valid order amount is required" });
      }

      const creditCheck = await storage.checkCustomerCredit(req.params.customerId, amount);
      res.json(creditCheck);
    } catch (error: any) {
      console.error("Error checking customer credit:", error);
      res.status(400).json({ message: "Failed to check customer credit", error: error.message });
    }
  });

  // Lead Management Routes
  app.get("/api/crm/leads", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 100),
        status: z.string().optional(),
        assignedTo: z.string().optional(),
      });

      const { limit, status, assignedTo } = querySchema.parse(req.query);
      const leads = await storage.getLeads(limit, status, assignedTo);
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch leads" });
      }
    }
  });

  app.get("/api/crm/leads/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/crm/leads", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create lead", error: error.message });
      }
    }
  });

  app.patch("/api/crm/leads/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const leadData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, leadData);
      res.json(lead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update lead", error: error.message });
      }
    }
  });

  app.delete("/api/crm/leads/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  app.post("/api/crm/leads/:id/convert", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const result = await storage.convertLeadToCustomer(req.params.id, customerData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error converting lead to customer:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to convert lead to customer", error: error.message });
      }
    }
  });

  // Lead Communication Routes
  app.get("/api/crm/leads/:leadId/communications", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const querySchema = z.object({
        limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
      });

      const { limit } = querySchema.parse(req.query);
      const communications = await storage.getLeadCommunications(req.params.leadId, limit);
      res.json(communications);
    } catch (error: any) {
      console.error("Error fetching lead communications:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch lead communications" });
      }
    }
  });

  app.post("/api/crm/leads/:leadId/communications", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const communicationData = insertCommunicationSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
      });
      const communication = await storage.createLeadCommunication(communicationData);
      res.status(201).json(communication);
    } catch (error: any) {
      console.error("Error creating lead communication:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid communication data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create lead communication", error: error.message });
      }
    }
  });

  app.patch("/api/crm/communications/:id", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const communicationData = insertCommunicationSchema.partial().parse(req.body);
      const communication = await storage.updateLeadCommunication(req.params.id, communicationData);
      res.json(communication);
    } catch (error: any) {
      console.error("Error updating communication:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid communication data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update communication", error: error.message });
      }
    }
  });

  // CRM Dashboard Metrics
  app.get("/api/crm/dashboard", isAuthenticated, requireSalesAccess, async (req, res) => {
    try {
      const metrics = await storage.getCrmDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching CRM dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch CRM dashboard metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
