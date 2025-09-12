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
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
