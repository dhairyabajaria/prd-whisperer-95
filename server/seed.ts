import { getDb } from "./db";
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
  quotations,
  quotationItems,
  leads,
  commissionEntries,
  employees,
  posTerminals,
  campaigns,
  fxRates,
  systemSettings,
} from "@shared/schema";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  
  try {
    const db = await getDb();
    
    // 1. Seed Users
    console.log("👥 Seeding users...");
    const seedUsers = await db.insert(users).values([
      {
        id: "admin-user-001",
        email: "admin@pharmaerp.com",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        isActive: true,
      },
      {
        id: "sales-user-001",
        email: "john.sales@pharmaerp.com",
        firstName: "John",
        lastName: "Sales",
        role: "sales",
        isActive: true,
      },
      {
        id: "sales-user-002",
        email: "maria.santos@pharmaerp.com",
        firstName: "Maria",
        lastName: "Santos",
        role: "sales",
        isActive: true,
      },
      {
        id: "inventory-user-001",
        email: "carlos.inventory@pharmaerp.com",
        firstName: "Carlos",
        lastName: "Stock",
        role: "inventory",
        isActive: true,
      },
      {
        id: "finance-user-001", 
        email: "ana.finance@pharmaerp.com",
        firstName: "Ana",
        lastName: "Finance",
        role: "finance",
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedUsers.length} users`);

    // 2. Seed System Settings
    console.log("⚙️ Seeding system settings...");
    const seedSettings = await db.insert(systemSettings).values([
      {
        key: "ai_enabled",
        value: "true",
        category: "ai",
        description: "Enable AI features and recommendations",
        isPublic: true,
      },
      {
        key: "default_currency",
        value: "USD",
        category: "general",
        description: "Default currency for the system",
        isPublic: true,
      },
      {
        key: "expiry_warning_days",
        value: "90",
        category: "general", 
        description: "Days ahead to warn about product expiry",
        isPublic: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedSettings.length} system settings`);

    // 3. Seed Warehouses
    console.log("🏢 Seeding warehouses...");
    const seedWarehouses = await db.insert(warehouses).values([
      {
        id: "warehouse-main-001",
        name: "Main Distribution Center",
        location: "Luanda, Angola",
        type: "standard",
        capacity: 10000,
        isActive: true,
      },
      {
        id: "warehouse-cold-001",
        name: "Cold Storage Facility",
        location: "Luanda, Angola",
        type: "cold_storage",
        capacity: 2000,
        isActive: true,
      },
      {
        id: "warehouse-branch-001",
        name: "Benguela Branch",
        location: "Benguela, Angola",
        type: "branch",
        capacity: 5000,
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedWarehouses.length} warehouses`);

    // 4. Seed Customers
    console.log("👥 Seeding customers...");
    const seedCustomers = await db.insert(customers).values([
      {
        id: "customer-hospital-001",
        name: "Hospital Central de Luanda",
        email: "procurement@hcl.ao",
        phone: "+244 222 123 456",
        address: "Rua 17 de Setembro, Luanda, Angola",
        taxId: "AO123456789",
        creditLimit: "50000.00",
        paymentTerms: 30,
        assignedSalesRep: "sales-user-001",
        isActive: true,
      },
      {
        id: "customer-pharmacy-001",
        name: "Farmácia São Paulo",
        email: "compras@farmaciasaopaulo.ao",
        phone: "+244 222 987 654",
        address: "Rua da Missão, Luanda, Angola",
        taxId: "AO987654321",
        creditLimit: "25000.00",
        paymentTerms: 15,
        assignedSalesRep: "sales-user-002",
        isActive: true,
      },
      {
        id: "customer-clinic-001",
        name: "Clínica Sagrada Esperança",
        email: "admin@clinicasagrada.ao",
        phone: "+244 222 555 123",
        address: "Talatona, Luanda, Angola", 
        taxId: "AO555123789",
        creditLimit: "35000.00",
        paymentTerms: 30,
        assignedSalesRep: "sales-user-001",
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedCustomers.length} customers`);

    // 5. Seed Suppliers
    console.log("🏭 Seeding suppliers...");
    const seedSuppliers = await db.insert(suppliers).values([
      {
        id: "supplier-pharma-001",
        name: "Novartis International AG",
        email: "orders@novartis.com",
        phone: "+41 61 324 1111",
        address: "Basel, Switzerland",
        country: "Switzerland",
        creditDays: 45,
        currency: "EUR",
        isActive: true,
      },
      {
        id: "supplier-pharma-002", 
        name: "Pfizer Inc.",
        email: "procurement@pfizer.com",
        phone: "+1 212 733 2323",
        address: "New York, NY, USA",
        country: "United States",
        creditDays: 30,
        currency: "USD",
        isActive: true,
      },
      {
        id: "supplier-local-001",
        name: "Distribuidora Farmacêutica Angolana",
        email: "vendas@dfa.ao",
        phone: "+244 222 444 555",
        address: "Zona Industrial, Luanda, Angola",
        country: "Angola",
        creditDays: 15,
        currency: "USD",
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedSuppliers.length} suppliers`);

    // 6. Seed Products
    console.log("💊 Seeding products...");
    const seedProducts = await db.insert(products).values([
      {
        id: "product-paracetamol-001",
        name: "Paracetamol 500mg",
        description: "Pain relief and fever reducer tablets",
        sku: "PARA500-001",
        category: "Analgesics",
        brand: "PharmaBrand",
        unitPrice: "2.50",
        unitCost: "1.20",
        unit: "tablet",
        batchTracking: true,
        expiryTracking: true,
        reorderLevel: 500,
        maxLevel: 5000,
        isActive: true,
      },
      {
        id: "product-amoxicillin-001",
        name: "Amoxicillin 250mg",
        description: "Antibiotic capsules",
        sku: "AMOX250-001", 
        category: "Antibiotics",
        brand: "PharmaBrand",
        unitPrice: "8.75",
        unitCost: "4.20",
        unit: "capsule",
        batchTracking: true,
        expiryTracking: true,
        reorderLevel: 200,
        maxLevel: 2000,
        isActive: true,
      },
      {
        id: "product-insulin-001",
        name: "Insulin Glargine 100IU/ml",
        description: "Long-acting insulin injection",
        sku: "INS100-001",
        category: "Diabetes Care",
        brand: "InsulinCorp",
        unitPrice: "45.00",
        unitCost: "22.50",
        unit: "vial",
        batchTracking: true,
        expiryTracking: true,
        reorderLevel: 50,
        maxLevel: 500,
        temperatureControlled: true,
        isActive: true,
      },
      {
        id: "product-mask-001",
        name: "Surgical Face Mask",
        description: "Disposable 3-layer surgical masks",
        sku: "MASK3L-001",
        category: "Medical Supplies",
        brand: "MedSupply",
        unitPrice: "0.75",
        unitCost: "0.35",
        unit: "piece",
        batchTracking: false,
        expiryTracking: false,
        reorderLevel: 1000,
        maxLevel: 50000,
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedProducts.length} products`);

    // 7. Seed Inventory
    console.log("📦 Seeding inventory...");
    const seedInventory = await db.insert(inventory).values([
      {
        id: "inv-para-main-001",
        productId: "product-paracetamol-001",
        warehouseId: "warehouse-main-001",
        quantity: 2500,
        batchNumber: "PARA2024001",
        expiryDate: new Date("2025-12-31"),
        costPerUnit: "1.20",
        location: "A-001-01",
      },
      {
        id: "inv-amox-main-001",
        productId: "product-amoxicillin-001",
        warehouseId: "warehouse-main-001", 
        quantity: 800,
        batchNumber: "AMOX2024001",
        expiryDate: new Date("2025-06-30"),
        costPerUnit: "4.20",
        location: "A-002-01",
      },
      {
        id: "inv-insulin-cold-001",
        productId: "product-insulin-001",
        warehouseId: "warehouse-cold-001",
        quantity: 150,
        batchNumber: "INS2024001",
        expiryDate: new Date("2025-03-31"),
        costPerUnit: "22.50",
        location: "C-001-01",
      },
      {
        id: "inv-mask-main-001",
        productId: "product-mask-001",
        warehouseId: "warehouse-main-001",
        quantity: 25000,
        location: "B-001-01",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedInventory.length} inventory records`);

    // 8. Seed Sales Orders
    console.log("🛒 Seeding sales orders...");
    const seedSalesOrders = await db.insert(salesOrders).values([
      {
        id: "so-2024-001",
        orderNumber: "SO-2024-001",
        customerId: "customer-hospital-001",
        salesRepId: "sales-user-001",
        orderDate: new Date("2024-09-10"),
        deliveryDate: new Date("2024-09-17"),
        status: "confirmed",
        subtotal: "12500.00",
        taxAmount: "1875.00",
        totalAmount: "14375.00",
        notes: "Urgent order for hospital supplies",
      },
      {
        id: "so-2024-002",
        orderNumber: "SO-2024-002",
        customerId: "customer-pharmacy-001",
        salesRepId: "sales-user-002",
        orderDate: new Date("2024-09-12"),
        deliveryDate: new Date("2024-09-19"),
        status: "draft",
        subtotal: "3250.00",
        taxAmount: "487.50", 
        totalAmount: "3737.50",
        notes: "Regular pharmacy stock replenishment",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedSalesOrders.length} sales orders`);

    // 9. Seed Sales Order Items
    console.log("📋 Seeding sales order items...");
    const seedOrderItems = await db.insert(salesOrderItems).values([
      {
        id: "soi-001",
        orderId: "so-2024-001",
        productId: "product-paracetamol-001",
        quantity: 2000,
        unitPrice: "2.50",
        totalPrice: "5000.00",
      },
      {
        id: "soi-002",
        orderId: "so-2024-001", 
        productId: "product-amoxicillin-001",
        quantity: 500,
        unitPrice: "8.75",
        totalPrice: "4375.00",
      },
      {
        id: "soi-003",
        orderId: "so-2024-001",
        productId: "product-insulin-001",
        quantity: 70,
        unitPrice: "45.00",
        totalPrice: "3150.00",
      },
      {
        id: "soi-004",
        orderId: "so-2024-002",
        productId: "product-paracetamol-001",
        quantity: 1000,
        unitPrice: "2.50",
        totalPrice: "2500.00",
      },
      {
        id: "soi-005",
        orderId: "so-2024-002",
        productId: "product-mask-001",
        quantity: 1000,
        unitPrice: "0.75",
        totalPrice: "750.00",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedOrderItems.length} sales order items`);

    // 10. Seed Purchase Orders
    console.log("🛍️ Seeding purchase orders...");
    const seedPurchaseOrders = await db.insert(purchaseOrders).values([
      {
        id: "po-2024-001",
        orderNumber: "PO-2024-001",
        supplierId: "supplier-pharma-001",
        createdBy: "finance-user-001",
        orderDate: new Date("2024-09-05"),
        expectedDate: new Date("2024-09-25"),
        status: "sent",
        subtotal: "25000.00",
        taxAmount: "3750.00",
        totalAmount: "28750.00",
        currency: "EUR",
        notes: "Quarterly stock replenishment from Novartis",
      },
      {
        id: "po-2024-002",
        orderNumber: "PO-2024-002",
        supplierId: "supplier-local-001",
        createdBy: "inventory-user-001",
        orderDate: new Date("2024-09-08"),
        expectedDate: new Date("2024-09-15"),
        status: "confirmed",
        subtotal: "8500.00",
        taxAmount: "1275.00",
        totalAmount: "9775.00",
        currency: "USD",
        notes: "Local supplier order for medical supplies",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedPurchaseOrders.length} purchase orders`);

    // 11. Seed Purchase Order Items  
    console.log("📦 Seeding purchase order items...");
    const seedPurchaseOrderItems = await db.insert(purchaseOrderItems).values([
      {
        id: "poi-001",
        orderId: "po-2024-001",
        productId: "product-paracetamol-001",
        quantity: 10000,
        unitPrice: "1.00",
        totalPrice: "10000.00",
      },
      {
        id: "poi-002",
        orderId: "po-2024-001",
        productId: "product-amoxicillin-001", 
        quantity: 3000,
        unitPrice: "3.50",
        totalPrice: "10500.00",
      },
      {
        id: "poi-003",
        orderId: "po-2024-001",
        productId: "product-insulin-001",
        quantity: 100,
        unitPrice: "20.00",
        totalPrice: "2000.00",
      },
      {
        id: "poi-004",
        orderId: "po-2024-002",
        productId: "product-mask-001",
        quantity: 20000,
        unitPrice: "0.30",
        totalPrice: "6000.00",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedPurchaseOrderItems.length} purchase order items`);

    // 12. Seed Quotations
    console.log("💰 Seeding quotations...");
    const seedQuotations = await db.insert(quotations).values([
      {
        id: "quote-2024-001",
        quotationNumber: "QT-2024-001",
        customerId: "customer-clinic-001",
        salesRepId: "sales-user-001",
        createdBy: "sales-user-001",
        quotationDate: new Date("2024-09-13"),
        validityDate: new Date("2024-10-13"),
        status: "sent",
        subtotal: "15750.00",
        taxAmount: "2362.50",
        totalAmount: "18112.50",
        notes: "Initial quote for clinic equipment and supplies",
      },
      {
        id: "quote-2024-002",
        quotationNumber: "QT-2024-002",
        customerId: "customer-pharmacy-001",
        salesRepId: "sales-user-002",
        createdBy: "sales-user-002",
        quotationDate: new Date("2024-09-14"),
        validityDate: new Date("2024-09-28"),
        status: "draft",
        subtotal: "8900.00",
        taxAmount: "1335.00",
        totalAmount: "10235.00",
        notes: "Bulk discount quote for pharmacy chain",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedQuotations.length} quotations`);

    // 13. Seed Quotation Items
    console.log("📄 Seeding quotation items...");
    const seedQuotationItems = await db.insert(quotationItems).values([
      {
        id: "qi-001",
        quotationId: "quote-2024-001",
        productId: "product-paracetamol-001",
        quantity: 3000,
        unitPrice: "2.25",
        lineTotal: "6750.00",
      },
      {
        id: "qi-002",
        quotationId: "quote-2024-001",
        productId: "product-amoxicillin-001",
        quantity: 1000,
        unitPrice: "8.00",
        lineTotal: "8000.00",
      },
      {
        id: "qi-003",
        quotationId: "quote-2024-001",
        productId: "product-insulin-001",
        quantity: 50,
        unitPrice: "40.00",
        lineTotal: "2000.00",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedQuotationItems.length} quotation items`);

    // 14. Seed Leads
    console.log("🎯 Seeding leads...");
    const seedLeads = await db.insert(leads).values([
      {
        id: "lead-001",
        companyName: "Hospital Militar Central",
        contactName: "Dr. Fernando Silva",
        email: "fernando.silva@hmc.ao",
        phone: "+244 222 678 901",
        status: "qualified",
        stage: "needs_analysis",
        source: "referral",
        estimatedValue: "75000.00",
        probability: 65,
        assignedTo: "sales-user-001",
        notes: "Interested in complete pharmaceutical inventory management system",
      },
      {
        id: "lead-002", 
        companyName: "Rede de Farmácias Popular",
        contactName: "Ana Costa",
        email: "ana.costa@farmacpopular.ao",
        phone: "+244 222 345 678",
        status: "new",
        stage: "initial_contact",
        source: "website",
        estimatedValue: "45000.00",
        probability: 25,
        assignedTo: "sales-user-002",
        notes: "Chain of 5 pharmacies looking for inventory management solution",
      },
      {
        id: "lead-003",
        companyName: "Centro Médico Girassol",
        contactName: "Dr. Paulo Mendes",
        email: "paulo.mendes@cmgirassol.ao", 
        phone: "+244 222 456 789",
        status: "qualified",
        stage: "proposal_sent",
        source: "cold_call",
        estimatedValue: "28000.00",
        probability: 80,
        assignedTo: "sales-user-001",
        notes: "Ready to move forward pending final approval from board",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedLeads.length} leads`);

    // 15. Seed Commission Entries
    console.log("💰 Seeding commission entries...");
    const seedCommissions = await db.insert(commissionEntries).values([
      {
        id: "comm-001",
        salesRepId: "sales-user-001",
        orderId: "so-2024-001",
        orderAmount: "14375.00",
        commissionRate: "3.00",
        commissionAmount: "431.25",
        status: "accrued",
        calculatedAt: new Date("2024-09-10"),
      },
      {
        id: "comm-002",
        salesRepId: "sales-user-002",
        orderId: "so-2024-002",
        orderAmount: "3737.50",
        commissionRate: "2.50",
        commissionAmount: "93.44",
        status: "accrued", 
        calculatedAt: new Date("2024-09-12"),
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedCommissions.length} commission entries`);

    // 16. Seed Employees
    console.log("👨‍💼 Seeding employees...");
    const seedEmployees = await db.insert(employees).values([
      {
        id: "emp-001",
        userId: "sales-user-001",
        employeeNumber: "EMP001",
        department: "Sales",
        position: "Senior Sales Representative",
        hireDate: new Date("2023-01-15"),
        salary: "2500.00",
        currency: "USD",
        status: "active",
      },
      {
        id: "emp-002",
        userId: "sales-user-002",
        employeeNumber: "EMP002", 
        department: "Sales",
        position: "Sales Representative",
        hireDate: new Date("2023-06-01"),
        salary: "2000.00",
        currency: "USD",
        status: "active",
      },
      {
        id: "emp-003",
        userId: "inventory-user-001",
        employeeNumber: "EMP003",
        department: "Warehouse",
        position: "Inventory Manager",
        hireDate: new Date("2022-09-01"),
        salary: "2200.00", 
        currency: "USD",
        status: "active",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedEmployees.length} employees`);

    // 17. Seed POS Terminals
    console.log("🏪 Seeding POS terminals...");
    const seedTerminals = await db.insert(posTerminals).values([
      {
        id: "pos-terminal-001",
        name: "Main Counter Terminal",
        location: "Main Distribution Center - Counter 1",
        warehouseId: "warehouse-main-001",
        isActive: true,
      },
      {
        id: "pos-terminal-002",
        name: "Benguela Branch Terminal",
        location: "Benguela Branch - Sales Counter",
        warehouseId: "warehouse-branch-001",
        isActive: true,
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedTerminals.length} POS terminals`);

    // 18. Seed Marketing Campaigns
    console.log("📢 Seeding marketing campaigns...");
    const seedCampaigns = await db.insert(campaigns).values([
      {
        id: "campaign-001",
        name: "Q4 Hospital Outreach",
        description: "Targeted campaign for hospital procurement departments",
        type: "email",
        status: "active",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2024-12-31"),
        budget: "5000.00",
        targetAudience: "Hospital procurement managers",
        createdBy: "sales-user-001",
      },
      {
        id: "campaign-002",
        name: "Pharmacy Partnership Program",
        description: "Promotional campaign for independent pharmacies",
        type: "promotional",
        status: "active", 
        startDate: new Date("2024-08-15"),
        endDate: new Date("2024-11-15"),
        budget: "3500.00",
        targetAudience: "Independent pharmacy owners",
        createdBy: "sales-user-002",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedCampaigns.length} marketing campaigns`);

    // 19. Seed FX Rates
    console.log("💱 Seeding FX rates...");
    const seedFxRates = await db.insert(fxRates).values([
      {
        id: "fx-usd-eur-001",
        fromCurrency: "USD",
        toCurrency: "EUR",
        rate: "0.85",
        date: new Date("2024-09-15"),
        source: "ECB",
      },
      {
        id: "fx-eur-usd-001",
        fromCurrency: "EUR", 
        toCurrency: "USD",
        rate: "1.18",
        date: new Date("2024-09-15"),
        source: "ECB",
      },
      {
        id: "fx-usd-aoa-001", 
        fromCurrency: "USD",
        toCurrency: "AOA",
        rate: "825.50",
        date: new Date("2024-09-15"),
        source: "BNA",
      },
      {
        id: "fx-aoa-usd-001",
        fromCurrency: "AOA",
        toCurrency: "USD", 
        rate: "0.0012",
        date: new Date("2024-09-15"),
        source: "BNA",
      }
    ]).onConflictDoNothing().returning();
    console.log(`✅ Created ${seedFxRates.length} FX rates`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("📊 Summary of seeded data:");
    console.log(`   • ${seedUsers.length} users`);
    console.log(`   • ${seedSettings.length} system settings`);
    console.log(`   • ${seedWarehouses.length} warehouses`);
    console.log(`   • ${seedCustomers.length} customers`);
    console.log(`   • ${seedSuppliers.length} suppliers`);
    console.log(`   • ${seedProducts.length} products`);
    console.log(`   • ${seedInventory.length} inventory records`);
    console.log(`   • ${seedSalesOrders.length} sales orders`);
    console.log(`   • ${seedOrderItems.length} sales order items`);
    console.log(`   • ${seedPurchaseOrders.length} purchase orders`);
    console.log(`   • ${seedPurchaseOrderItems.length} purchase order items`);
    console.log(`   • ${seedQuotations.length} quotations`);
    console.log(`   • ${seedQuotationItems.length} quotation items`);
    console.log(`   • ${seedLeads.length} leads`);
    console.log(`   • ${seedCommissions.length} commission entries`);
    console.log(`   • ${seedEmployees.length} employees`);
    console.log(`   • ${seedTerminals.length} POS terminals`);
    console.log(`   • ${seedCampaigns.length} marketing campaigns`);
    console.log(`   • ${seedFxRates.length} FX rates`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seeding script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };