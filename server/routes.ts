import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
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
  insertInvoiceSchema,
  insertStockMovementSchema,
  insertPosTerminalSchema,
  insertPosSessionSchema,
  insertCashMovementSchema,
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

  // Purchase order routes
  app.get("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const orders = await storage.getPurchaseOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const orderData = insertPurchaseOrderSchema.parse(req.body);
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      res.status(400).json({ message: "Failed to create purchase order", error: error.message });
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
      const sessionData = insertPosSessionSchema.parse({
        ...req.body,
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
      const closeSessionSchema = z.object({
        actualCash: z.number().min(0),
        notes: z.string().optional(),
      });
      
      const { actualCash, notes } = closeSessionSchema.parse(req.body);
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
      const saleSchema = z.object({
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

      const saleData = saleSchema.parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}
