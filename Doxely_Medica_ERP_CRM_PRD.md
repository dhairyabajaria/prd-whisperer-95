# Pharma ERP/CRM - Master Product Requirements Document (PRD)

This document outlines the detailed functional and non-functional requirements for the Pharma ERP/CRM system. Each module is specified with its business rules, user flows, data fields, and security permissions.

---

## PRD – Module 1: Core System & Settings

This module serves as the backbone of the entire Pharma ERP/CRM.

### 1. Functional Requirements (FRs)

#### FR-1: Multi-language Support
* System must support **English** and **Portuguese** (default for Angola).
* All screens, forms, error messages, and reports must be available in both languages.
* Users can select their preferred language at login or from their profile settings.
* Admin can define the default system language.

#### FR-2: Role-Based Access Control (RBAC)
* **Roles:** Admin, Manager, Accountant, Sales Agent, Purchase Officer, HR, Warehouse Manager, etc.
* Each role must have:
    * A role-specific dashboard (KPIs, shortcuts).
    * Access to only authorized modules.
    * Restrictions on exports (only senior roles).
* Admin can create, edit, and delete roles.
* Admin can assign users to roles.

#### FR-3: Authentication & Security
* Login with email/username + password.
* **Two-Factor Authentication (2FA)** (via email OTP, SMS, or authenticator app).
* Password policy: minimum 8 characters, with uppercase, number, and symbol.
* Session timeout after 15 minutes of inactivity.

#### FR-4: Settings Management
* Central “Settings Page” for Admin:
    * Company info (name, logo, address, tax numbers).
    * Financial year, currency, taxation rules.
    * Commission structures (rules tied to sales realization).
    * Backup settings (frequency, locations, email).
    * Email/WhatsApp integration settings.
    * AI integration keys (Google/OpenAI).
    * Report scheduling preferences (daily, weekly, etc.).
    * Export permissions (define which roles can export).
* All settings must be changeable only by the **Admin**.

#### FR-5: Audit Trail
* Every user action must be logged: login, create, update, delete, export.
* The audit log must include: date, time, user, role, action performed, and affected record ID.
* Logs must be exportable (admin only).

#### FR-6: Export & Import (Global Functionality)
* Every module must allow the export of data in **Excel & PDF**.
* Exports must include:
    * Filters applied (date range, customer name, supplier name, etc.).
    * Metadata (date/time stamp, “exported by [User Name]”).
* Export access is restricted to senior roles.
* Import functionality:
    * Accept bulk data via Excel/CSV upload (customers, suppliers, products).
    * Barcode/QR file import (from supplier).
    * Validation checks (duplicate, incorrect formats).

#### FR-7: Backup & Restore
* Auto-backup daily to:
    * Cloud storage (AWS, Azure, GCP).
    * Local server (if configured).
    * A copy sent via email to a pre-defined Admin email.
* Restore functionality:
    * Admin can restore from any backup file.
    * The system must confirm the restore action with 2FA approval.
* Backup logs must be maintained.

#### FR-8: Notifications & Alerts
* System notifications for important events (purchase approval pending, low stock, payment overdue).
* Configurable via settings (Admin defines which alerts go to which roles).
* Alerts can be sent via email & WhatsApp.

#### FR-9: AI Integration
* Admin can enter a Google API key or OpenAI API key.
* AI should provide:
    * Smart search across the system (natural language queries).
    * Auto-summarization of MIS reports.
    * Anomaly detection in sales/purchases (e.g., sudden unusual discounts).
    * AI-driven reminders (e.g., “Stock of X expiring in 15 days”).
* AI usage should be optimized for token efficiency (concise prompts/data exchange).

### 2. Business Rules
* **Exports:** Only users with export rights can generate files. All exports must contain a watermark and metadata.
* **Backups:** Must run automatically at midnight daily. If failed, the system sends an alert to the Admin.
* **Role Access:**
    * **Sales Agents:** can create/update sales, but cannot export or delete records.
    * **Managers:** can approve, export, and view MIS.
    * **Admin:** has full control over the system.
* **Commission Rule:** Commissions are payable only when payment is realized. The system must check the status before calculating.
* **AI Queries:** Must always respect role permissions (e.g., an agent cannot ask the AI for financial reports if not allowed).

### 3. User Flows & Processes
**Flow 1: User Login**
1.  User enters email + password.
2.  If correct → system sends OTP (if 2FA is enabled).
3.  User enters OTP → is redirected to a role-based dashboard.

**Flow 2: Data Export**
1.  User applies filters (date range, customer, supplier).
2.  System validates role permissions.
    * If allowed → generate export.
    * If not → show error “You do not have export rights.”
3.  Export file is generated with filters used, date/time, and "Exported by".
4.  An export log entry is created in the Audit Trail.

**Flow 3: Backup**
1.  At midnight, the system runs an auto-backup.
2.  It stores in the cloud, locally, and sends the file to the admin's email.
3.  Logs the entry “Backup successful” with a timestamp.
4.  If it fails → sends an error notification.

**Flow 4: AI Query**
1.  User types: “Show me sales for Customer X last 3 months.”
2.  AI validates role permission → retrieves sales data.
3.  AI generates a summary + chart.
4.  If the query requires an export → the system checks if the user has rights.

### 4. Data Fields & Validations
* **User Table:** UserID, Name, Role, Email, Phone, PasswordHash, Status, LastLogin.
* **Audit Log Table:** LogID, UserID, Role, Action, RecordID, Timestamp, IPAddress.
* **Settings Table:** SettingID, Category, Key, Value, LastUpdatedBy.
* **Export Log Table:** ExportID, Module, FiltersApplied, ExportedBy, DateTime.
* **Backup Table:** BackupID, Type (cloud/local/email), Status, DateTime.

**Validations:**
* No duplicate usernames.
* Strong password enforcement.
* Export requests must always check role access before execution.
* Backup restore requires 2FA approval.

### 5. Reports & Exports
* **User Activity Report:** Filter by user/date, exportable.
* **Audit Trail Report:** Complete history of changes.
* **Backup Report:** Log of all backups, status, file path.
* **Export Report:** Which user exported what and when.

### 6. Security & Permissions
* **Admin:** Full rights (all modules, settings, exports, restore).
* **Manager:** Approvals, view/export MIS, reports.
* **Sales Agent:** Create sales, quotations; no export rights.
* **Accountant:** Finance & MIS, limited exports.
* **Warehouse Manager:** Inventory control, QR/barcode input; no exports.

---

## PRD – Module 2: Purchases & Procurement

### 1. Functional Requirements (FRs)

#### FR-1: Supplier Management
* Add/Edit/Delete suppliers.
* Supplier details: Name, Address, Contact Person, Phone, Email, Tax ID, Bank Details.
* Ability to attach documents (e.g., registration, compliance certificates).
* Supplier classification: Local / International.
* Import suppliers via Excel/CSV.

#### FR-2: Purchase Requisition (PR)
* Internal staff can raise a PR when stock is needed.
* Fields: Item, Quantity, Required by Date, Justification.
* PR workflow: Draft → Submit → Approval (by Manager/Admin).
* PR must auto-check stock levels → suggest reorder only if below the minimum.

#### FR-3: Purchase Order (PO)
* Create PO directly or from an approved PR.
* Fields: Supplier, Products (with Batch #, MFG Date, Expiry), Quantity, Rate, Terms.
* Auto-assign a unique sequential PO Number.
* Status: Draft → Pending Approval → Approved → Sent to Supplier.
* Export PO as PDF (with company header, logo, signature).
* Email PO directly to the supplier from the system.

#### FR-4: Goods Receipt Note (GRN)
* Record goods received against a PO.
* Scan/Import Barcode/QR file from the supplier to auto-fill product & batch details.
* Enter Received Qty, Rejected Qty, Damage Notes.
* Validate received batch → MFG Date ≤ today, Expiry ≥ today.
* GRN auto-updates stock in the Inventory module.
* If partial delivery → GRN is marked as “Partially Received.”

#### FR-5: Purchase Invoice
* Record supplier invoice details.
* Match invoice against PO + GRN (**3-way matching**).
* Fields: Invoice Number, Date, Amount, Tax, Payment Terms.
* Upload a scanned invoice copy.
* Link to the Accounts Payable module.

#### FR-6: Payment to Supplier
* Support both cash and credit purchases.
* Payment workflow: Pending → Approved → Paid.
* Partial payments are allowed.
* Record mode: Bank Transfer, Cheque, Cash, LC.
* Payment realization date is recorded.

#### FR-7: Returns to Supplier
* Record purchase returns (damaged/expired/extra).
* Generate a debit note.
* Auto-adjusts inventory.

#### FR-8: Purchase Reports & Analytics
* Reports must include:
    * Purchase Register (date/supplier/item).
    * Pending POs.
    * Goods Receipt Status.
    * Supplier Payment Status.
    * Supplier Performance (on-time delivery, quality issues).
* All reports are exportable in Excel/PDF with filters (date, supplier, product, batch).

### 2. Business Rules
* **PO Number** must be unique and sequential.
* **Batch Validation:**
    * Cannot accept items with an expiry date ≤ the current date.
    * MFG date must always be ≤ the current date.
* **Invoice Matching:** The system must check PO vs GRN vs Invoice.
    * If mismatch > 5% → send an approval request to the Manager.
* **Payment Rule:**
    * Payment can only be processed after the GRN is approved.
    * Commission (if applicable to purchase agents) is only calculated when payment is cleared.
* **Returns:** Must reduce stock immediately and adjust the payable amount.
* **Exports:** Only Manager/Admin can export purchase documents. Exports are logged with date/time & "exported by".

### 3. User Flows & Processes
**Flow 1: Create Purchase Order**
1.  Purchase Officer logs in → goes to “Create PO.”
2.  Selects supplier.
3.  Adds products (the system suggests items with low stock).
4.  Enters batch details, rates, and terms.
5.  Saves draft.
6.  Submits for approval → Manager/Admin approves.
7.  PO auto-generates a PDF with a watermark → can be emailed directly to the supplier.

**Flow 2: Goods Receipt Note (GRN)**
1.  Warehouse Manager receives goods.
2.  Opens “GRN” → scans barcode/QR file.
3.  System auto-fills product details.
4.  Verifies received vs ordered qty.
5.  Records damages/rejections.
6.  Saves GRN → stock is auto-updated in Inventory.

**Flow 3: Payment Processing**
1.  Accountant reviews the Purchase Invoice.
2.  Matches it with the PO + GRN.
3.  If matched → marks “Approved for Payment.”
4.  Records payment details.
5.  Marks as “Paid.”
6.  The audit log is updated.

### 4. Data Fields & Validations
* **Supplier Table:** SupplierID, Name, Type, TaxID, Address, Phone, Email, BankDetails, Status.
* **PO Table:** POID, SupplierID, Date, Items[], Terms, Status, CreatedBy, ApprovedBy.
* **GRN Table:** GRNID, POID, BatchNumber, MFGDate, ExpiryDate, ReceivedQty, RejectedQty.
* **Invoice Table:** InvoiceID, POID, GRNID, InvoiceNo, Date, Amount, Tax, FileUpload.
* **Payments Table:** PaymentID, InvoiceID, Mode, Amount, Date, Status, ClearedDate.
* **Returns Table:** ReturnID, GRNID, ProductID, Qty, Reason.

**Validations:**
* Supplier TaxID must be unique.
* PO Date ≤ today.
* GRN Qty cannot exceed PO Qty.
* Payment cannot exceed Invoice Amount.

### 5. Reports & Exports
* Purchase Register (filter by date/supplier/product).
* Pending Purchase Orders.
* Supplier Payment Status (Paid/Pending/Partial).
* Supplier Performance Report (OTD %, Rejections %).
* GRN Summary.

**Exports:**
* Excel/PDF with filters at the top (e.g., “Filtered by: Supplier = ABC Pharma, Date = Jan 2025”).
* The export file must include a date/time stamp + "exported by [username]".
* Export is restricted to senior roles.

### 6. Security & Permissions
* **Admin:** Full access (create, approve, export, delete).
* **Manager:** Approve PR/PO/Payments, export reports.
* **Purchase Officer:** Create PR/PO, cannot export.
* **Warehouse Manager:** Create GRN, record returns.
* **Accountant:** Record invoices, process payments.

---

## PRD – Module 3: Sales & Distribution

### 1. Functional Requirements (FRs)

#### FR-1: Customer Management
* Add/Edit/Delete customers.
* Fields: Name, Address, Contact Person, Phone, Email, Tax ID, Credit Limit, Payment Terms.
* Classification: Retail / Wholesale / Institutional.
* Attach documents (licenses, compliance certificates).
* Import customers via Excel/CSV.

#### FR-2: Sales Quotation (SQ)
* Create sales quotations for customers.
* Fields: Customer, Products (with batch #, MFG/Expiry), Quantity, Rate, Discount, Tax.
* Auto-generate a sequential Quotation Number.
* Status: Draft → Submitted → Approved → Converted to Invoice.
* Exportable as PDF with company logo, signature.
* Email quote directly to the customer.

#### FR-3: Sales Order (SO)
* Create SO from an approved quotation or directly.
* Must validate available stock before confirming.
* Auto-assign a sequential SO Number.
* Status: Draft → Approved → Fulfilled.

#### FR-4: Sales Invoice (SI)
* Generate an invoice from a Sales Order.
* Fields: Invoice Number, Customer, Products (batch #, expiry), Qty, Rate, Discounts, Taxes, Payment Terms.
* Support cash or credit sales.
* For credit sales → the system checks the customer’s credit limit.
* PDF invoice generation (with watermark, tax info, and signature).
* Email invoice to the customer.

#### FR-5: Delivery Note (DN)
* Record delivery details for each invoice.
* Fields: Delivery Note No, Invoice No, Vehicle No, Driver Name, Date, Products Delivered.
* Option to scan a barcode/QR code during dispatch.
* Exportable as PDF.

#### FR-6: Sales Returns
* Record returns from customers (damaged/expired/incorrect supply).
* Auto-adjust inventory.
* Generate a Credit Note against the original invoice.

#### FR-7: Commission Management
* Commission rules are configurable in Settings.
* Commission is payable only after the realization of payment (not on invoice creation).
* Commission can be a % of sales or fixed per unit.
* Reports: Commission Earned, Commission Paid, Pending Commissions.

#### FR-8: Payments & Collections
* Record customer payments (Cash / Bank / Cheque / Online).
* Partial payments are allowed.
* Payment is linked to invoices.
* Realization date is recorded.
* Overdue payments are flagged on the dashboard.

#### FR-9: Reports & Analytics
* Sales Register (filter by customer, date, product, batch).
* Outstanding Receivables.
* Credit Limit Utilization.
* Commission Reports (per agent, per customer).
* Product Performance (Top-selling items).
* Sales Trend Analysis (Daily/Weekly/Monthly).

### 2. Business Rules
* **Quotation/Invoice Numbering:** Must be unique and sequential.
* **Stock Check:** Sales Orders cannot exceed available stock (batch-wise).
* **Expiry Validation:** The system must prevent selling expired products.
* **Credit Sales Rule:**
    * A credit sale is allowed only if the customer’s outstanding + new invoice ≤ credit limit.
    * If exceeded → manager approval is required.
* **Commission Rule:** Commission is locked until payment is marked as realized.
* **Returns:** Must reference the original Invoice ID. Only approved returns adjust commissions.
* **Exports:** Restricted to Managers/Admin, with metadata (date, time, exported by).

### 3. User Flows & Processes
**Flow 1: Create Quotation**
1.  Sales Agent logs in → “New Quotation.”
2.  Selects Customer.
3.  Adds Products (with batch & expiry pulled from inventory).
4.  Applies discount & taxes.
5.  Saves draft.
6.  Submits → Manager approves.
7.  The system generates a PDF → can email to the customer.

**Flow 2: Convert Quotation to Invoice**
1.  Open Approved Quotation.
2.  Click “Convert to Invoice.”
3.  The system validates stock & credit limit.
4.  Invoice is generated → a sequential number is assigned.
5.  The invoice is exported or emailed to the customer.

**Flow 3: Commission Payment**
1.  Sales invoice is created → commission is pending.
2.  When payment is marked as “realized,” the system unlocks the commission.
3.  The HR/Finance module calculates the payable commission in payroll.

**Flow 4: Customer Payment**
1.  Accountant opens “Receivables.”
2.  Selects customer invoice → records payment (mode + reference).
3.  If partial → the remaining balance is updated.
4.  The realization date is logged.

**Flow 5: Sales Return**
1.  Customer requests a return.
2.  Sales Agent records the return against the Invoice.
3.  Manager approves the return.
4.  Inventory is auto-updated.
5.  A Credit Note is issued to the customer.

### 4. Data Fields & Validations
* **Customer Table:** CustomerID, Name, Address, Contact, TaxID, CreditLimit, Terms, Status.
* **Quotation Table:** QuoteID, CustomerID, Date, Items[], Status, CreatedBy.
* **SalesOrder Table:** SOID, QuoteID, CustomerID, Date, Items[], Status.
* **Invoice Table:** InvoiceID, SOID, CustomerID, Date, Items[], Total, Tax, Terms, Status.
* **Payments Table:** PaymentID, InvoiceID, Mode, Amount, Date, RealizationDate.
* **Commission Table:** CommissionID, AgentID, InvoiceID, Amount, Status, ReleaseDate.
* **Returns Table:** ReturnID, InvoiceID, ProductID, Qty, Reason.

**Validations:**
* Customer TaxID must be unique.
* Invoice Date ≤ current date.
* Payment Amount ≤ Invoice Outstanding.
* Return Qty ≤ Sold Qty.

### 5. Reports & Exports
* **Sales Register:** Filter by Customer, Date, Product, Agent.
* **Outstanding Receivables:** Aging buckets (0–30, 31–60, 61–90 days).
* **Commission Report:** Pending/Approved/Paid.
* **Customer Statement of Account.**
* **Sales vs Targets Report.**

**Exports:**
* All reports are exportable to Excel/PDF.
* Each export includes applied filters at the top.
* Metadata: Export Date/Time, Exported By.
* Export rights are restricted to senior roles.

### 6. Security & Permissions
* **Admin:** Full access (create, approve, export, delete).
* **Manager:** Approve quotations, invoices, exports, view commission reports.
* **Sales Agent:** Create quotations/orders/invoices, no export rights.
* **Accountant:** Record payments, manage collections.
* **HR/Finance:** Process commissions.

---

## PRD – Module 4: Inventory & Warehouse

### 1. Functional Requirements (FRs)

#### FR-1: Product Master Setup
* Define product attributes: Name, Generic Name, Category, Unit of Measure (UOM), HSN Code, Tax, Packaging details.
* Add variants: e.g., different strengths (250mg / 500mg), pack sizes (10s, 30s, 100s).
* Define product type: Storable / Consumable / Service.
* Attach product documents (drug approval, CoA, MSDS).

#### FR-2: Batch & Expiry Management
* Each stock entry must capture: **Batch Number, Manufacturing Date, Expiry Date**.
* **FEFO (First Expiry First Out)** rule is enforced during sales/delivery.
* Alerts: Notify before 90 / 60 / 30 days of expiry.
* Expired stock is auto-blocked from sales.

#### FR-3: Barcode & QR Code Integration
* Ability to scan items using external barcode/QR scanner machines.
* Support for GS1, EAN13, EAN14.
* Option to import a supplier-provided barcode/QR code file.
* Generate internal barcodes for repackaged items.
* Print barcode labels.

#### FR-4: Multi-Warehouse & Locations
* Manage multiple warehouses (e.g., Angola, UAE, India).
* Each warehouse can have multiple locations (aisles, shelves, cold rooms, quarantine).
* Stock transfers between warehouses.
* Role-based access: warehouse staff can only view their warehouse.

#### FR-5: Stock Operations
* **Receipts (Inbound):** Record vendor deliveries, capture batch/expiry, verify quantities.
* **Internal Transfers:** Move stock between locations/warehouses.
* **Delivery Orders (Outbound):** Stock is deducted batch-wise.
* **Returns:** Customer/supplier returns adjust stock automatically.
* **Scrap:** Damaged/expired stock is scrapped with reasons logged.

#### FR-6: Stock Counting & Adjustments
* Schedule cycle counts or full stock counts.
* Reconcile system stock with the physical count.
* Approval workflow for adjustments.
* An audit trail is maintained.

#### FR-7: Advanced Routes & Rules
* **Putaway Rules:** Automatically place incoming stock into the correct storage location.
* **Removal Strategies:** FIFO, FEFO, LEFO.
* **Cross Docking:** Direct transfer of incoming goods to outbound without storage.
* **Drop-Ship:** Deliver directly from the supplier to the customer.

#### FR-8: Replenishment & Reordering
* Minimum/Maximum stock rules per product/warehouse.
* Auto-generate Purchase Requisitions when stock falls below the threshold.
* Forecast demand based on historical sales.

#### FR-9: Traceability & Compliance
* Track every product movement: Supplier → Warehouse → Customer.
* View lot/serial number traceability reports.
* Audit logs for all stock operations.
* Regulatory compliance (WHO GDP, pharma best practices).

#### FR-10: Reports & Analytics
* Stock Ledger (all movements).
* Expiry Report (products expiring soon).
* Stock Aging Report (time in the warehouse).
* Inventory Valuation (FIFO/Weighted Avg).
* Stock Availability (by warehouse/location).
* Reorder Suggestions.

### 2. Business Rules
* **Batch Mandatory:** Every inbound stock must have a batch number, MFG date, and Expiry date.
* **FEFO Rule:** When fulfilling orders, the system automatically suggests batches with the nearest expiry.
* **Barcode Uniqueness:** A product cannot share the same barcode with another SKU.
* **Stock Adjustment Rule:** Adjustments require Manager approval and a reason code.
* **Scrap Rule:** Expired or damaged stock must be scrapped and logged.
* **Multi-Warehouse Transfers:** Must create both an Outbound from the source and an Inbound in the destination.
* **Auto Backup Rule:** All stock transactions are auto-backed up daily.

### 3. User Flows & Processes
**Flow 1: Inbound Stock (Purchase Receipt)**
1.  Storekeeper scans the supplier invoice/barcode file.
2.  The system imports product details, batch #, and expiry.
3.  Verifies with the Purchase Order.
4.  Stock is added to the correct warehouse location.
5.  Barcode labels are printed (if required).

**Flow 2: Outbound Stock (Sales Delivery)**
1.  Sales Order is confirmed.
2.  The warehouse receives a pick list.
3.  The picker scans the barcode/QR.
4.  The system enforces the FEFO rule.
5.  A delivery note is generated.

**Flow 3: Stock Transfer**
1.  Warehouse Manager creates a transfer request.
2.  Source warehouse stock is deducted.
3.  Destination warehouse receives stock.
4.  Both transactions are logged.

**Flow 4: Cycle Count**
1.  Warehouse Manager schedules a cycle count.
2.  Staff scan stock using a barcode device.
3.  Discrepancies are logged.
4.  An adjustment entry is created with approval.

**Flow 5: Expiry Alerts**
1.  The system runs a nightly check.
2.  Sends email/WhatsApp alerts for items nearing expiry.
3.  Expired items are moved to a “Blocked” location automatically.

### 4. Data Fields & Validations
* **Product Table:** ProductID, Name, Category, UOM, Barcode, Tax, Type.
* **Batch Table:** BatchID, ProductID, BatchNo, MFGDate, ExpiryDate, Qty.
* **Warehouse Table:** WarehouseID, LocationID, Address, Manager.
* **Stock Movement Table:** MovementID, ProductID, BatchID, Source, Destination, Qty, Date.
* **Scrap Table:** ScrapID, ProductID, BatchID, Reason, Qty, Date.

**Validations:**
* Expiry Date > Manufacturing Date.
* BatchNo is unique per product.
* Qty > 0 for inbound.
* Outbound qty ≤ available qty.

### 5. Reports & Exports
* Stock Ledger Report (filters: product, batch, warehouse, date).
* Expiry Report (with auto color coding: <30 days red, <60 yellow, <90 orange).
* Stock Valuation (FIFO, Weighted Average, Standard Cost).
* Export to Excel/PDF with filters at the top + metadata (date, time, exported by).
* Export rights are restricted to senior roles.

### 6. Security & Permissions
* **Admin:** Full control (create, adjust, export).
* **Warehouse Manager:** Manage stock ops, approve adjustments, run reports.
* **Storekeeper:** Perform receipts, deliveries, transfers.
* **Auditor:** View-only access, export restricted.

**Extra Security:**
* Barcode scans are logged with the user & timestamp.
* All exports are watermarked & logged.
* Sensitive adjustments require Manager approval.

---

## PRD – Module 5: Finance & Accounting

### 1. Functional Requirements (FRs)

#### FR-1: Chart of Accounts (CoA)
* Pre-configured CoA with pharma-specific categories (Sales, Purchases, Inventory, Commissions, Marketing, etc.).
* Customizable by Admin.
* Multi-level accounts: Group → Ledger → Sub-ledger.
* Support for multiple currencies (Angolan Kwanza AOA, USD, EUR).

#### FR-2: Journals & Transactions
* Auto journal entry creation from operations:
    * Sales Order → Customer Invoice → Journal → Accounts Receivable.
    * Purchase Order → Vendor Bill → Journal → Accounts Payable.
    * Payment → Bank Reconciliation.
* Manual Journal Entries with validation rules.
* Recurring Journal templates (rent, utilities).

#### FR-3: Accounts Receivable (AR)
* Generate Customer Invoices (linked with the Sales Module).
* Payment terms (immediate, 30 days, 60 days).
* Partial payments are allowed.
* Track overdue invoices with automatic reminders.
* Commission calculation is linked to realized payments (not on invoice issue).

#### FR-4: Accounts Payable (AP)
* Vendor Bills are generated from Purchase Orders.
* Payment scheduling.
* Early payment discount tracking.
* Debit Note management for returns.

#### FR-5: Payments & Bank Integration
* Cash & Bank ledgers.
* Payment Modes: Cash, Bank Transfer, Cheque, Mobile Money.
* Integration with banking APIs (optional).
* Bank Reconciliation: Match bank statement vs system ledger.

#### FR-6: Commissions Module
* Commission rules are definable per sales agent (% of net sales, per product, or slab-based).
* Commission is payable only on payment realization.
* Reports per agent: Sales, Commission Earned, Pending Commission.
* Option to deduct advances/penalties.

#### FR-7: Taxation & Compliance
* Angola VAT compliance.
* Configurable tax rates (5%, 14% etc).
* Tax reports for filing.
* Withholding tax management.

#### FR-8: Financial Reports
* Profit & Loss (P&L) – by date, warehouse, customer group.
* Balance Sheet – auto-updated.
* Cash Flow Statement – direct & indirect method.
* Accounts Receivable Aging.
* Accounts Payable Aging.
* Commission Payable Report.

#### FR-9: Auto-Reporting & Notifications
* Daily, Weekly, Monthly, Quarterly report scheduling.
* Reports are automatically emailed & sent to WhatsApp groups.
* Export to PDF/Excel (with filters applied & metadata: date, time, exported by).
* Auto-generated MIS dashboards for management.

#### FR-10: Budgeting & Forecasting (Optional)
* Set budgets per department.
* Compare actual vs budget.
* Forecast based on historical sales/purchases.

### 2. Business Rules
* **Double-Entry Accounting Rule:** Every transaction must balance Debit = Credit.
* **Commission Payment Rule:** Commission is payable only after the customer payment is realized.
* **Currency Conversion Rule:** The system fetches the daily exchange rate (or manual entry).
* **Approval Rule:** Large transactions (> predefined limit) require Manager approval.
* **Auto-Lock Period Rule:** The previous month's books are locked after the 7th of the next month unless unlocked by Admin.
* **Tax Rule:** Tax is auto-calculated per invoice as per Angola VAT laws.
* **Audit Trail Rule:** Every journal entry is logged with the user, timestamp, and IP.

### 3. User Flows & Processes
**Flow 1: Customer Invoice → Payment → Commission**
1.  A sales invoice is created from the Sales Module.
2.  The invoice is posted to Accounts Receivable.
3.  The customer makes a payment (cash/bank/credit).
4.  The system reconciles the payment.
5.  Commission is auto-calculated for the sales agent.
6.  The commission payable is shown in the agent’s report.

**Flow 2: Vendor Bill → Payment**
1.  A purchase order is confirmed.
2.  A vendor bill is created.
3.  The bill is verified against the GRN (goods receipt note).
4.  Payment is scheduled (cash/bank).
5.  A payment entry is created in Accounts Payable.

**Flow 3: Bank Reconciliation**
1.  The bank statement is imported/uploaded.
2.  The system auto-matches transactions.
3.  Unmatched items are flagged for manual review.
4.  A reconciliation report is generated.

**Flow 4: Period Closing**
1.  At the end of the month → the system runs a trial balance.
2.  Discrepancies are highlighted.
3.  Admin approves the closing.
4.  Books are locked for further posting.

### 4. Data Fields & Validations
* **Invoice Table:** InvoiceID, CustomerID, Date, Amount, Tax, DueDate, Status.
* **Payment Table:** PaymentID, InvoiceID, Mode, Amount, Date, Reference.
* **Journal Table:** JournalID, DebitAccount, CreditAccount, Amount, Date.
* **Commission Table:** AgentID, InvoiceID, %Rate, RealizedAmount, CommissionAmount, Status.
* **Vendor Bill Table:** BillID, VendorID, Date, Amount, DueDate, Status.

**Validations**
* Invoice total = Line Item Sum + Taxes.
* Debit = Credit in every Journal.
* Commission = % of Paid Amount (not invoiced amount).
* Payment Date ≥ Invoice Date.

### 5. Reports & Exports
* P&L Report (filters: date, warehouse, customer).
* Balance Sheet (with drill-down).
* Cash Flow Report (auto-generated).
* Commission Payable Report (per agent).
* AR Aging (30, 60, 90 days).
* AP Aging (30, 60, 90 days).
* Export PDF/Excel with metadata:
    * Parameters used for the filter.
    * Exported By (User Name).
    * Date & Timestamp.
* Only Senior Roles are allowed to export.

### 6. Security & Permissions
* **Admin:** Full rights, can configure CoA, close books, approve large transactions.
* **Finance Manager:** Approve payments, reconcile, run reports.
* **Accountant:** Post journals, manage invoices/bills, process payments.
* **Sales Agent:** View own commissions, no access to books.
* **Auditor:** Read-only access to reports, no exports.

**Additional Security:**
* 2-Factor Authentication for Admin & Finance Manager.
* Export permissions are restricted to senior roles.
* Audit log for all financial operations.

### 7. AI Assistance (Optional)
* AI-driven cash flow forecasting based on past trends.
* AI-generated expense categorization (auto-tag entries).
* AI-based fraud detection (flagging abnormal transactions).
* Natural language queries: e.g., “Show me commission payable for Q2”.

---

## PRD – Module 6: Sales & CRM

### 1. Functional Requirements (FRs)

#### FR-1: Customer Management
* Maintain a database of customers (Hospitals, Pharmacies, Distributors, Clinics).
* Fields: Name, Type, Contact Person, Phone, Email, Address, Tax ID, Credit Limit, Payment Terms.
* Customer classification: Retail / Wholesale / Distributor.
* Ability to attach KYC/compliance docs.
* Import customers via Excel/CSV.

#### FR-2: Quotation / Proforma Invoice
* Sales reps can create quotations for customers.
* Fields: Customer, Products (Batch No, MFG Date, Expiry Date), Qty, Rate, Discount, Tax.
* Auto-generate a unique Quote Number.
* Status: Draft → Submitted → Approved → Sent.
* Convert Quote → Sales Order in one click.
* Export Quotation as PDF with company header/logo.
* Email/WhatsApp quotation directly to the customer.

#### FR-3: Sales Order (SO)
* Created from an approved quotation OR directly.
* Fields: Customer, Products, Qty, Price, Delivery Terms.
* Auto-generate a unique SO Number.
* Approval workflow: Draft → Pending Approval → Approved.
* SO status: Open, Partially Delivered, Closed.

#### FR-4: Delivery & Dispatch
* Link Sales Order with Inventory → create Delivery Note.
* Scan Barcode/QR for batch allocation.
* Track delivery status: Pending, In-Transit, Delivered.
* Generate delivery challan / invoice for dispatch.
* Multi-warehouse delivery is supported.

#### FR-5: Sales Invoice
* Generated from Sales Order / Delivery Note.
* Auto-assign Invoice Number.
* Supports multiple payment terms (Cash, Credit, Installment).
* Fields: Customer, Product, Batch, Expiry, Qty, Rate, Discount, Tax.
* Auto-posts to Accounts Receivable in the Finance Module.

#### FR-6: Payments (Cash & Credit)
* Record payments against invoices.
* Payment modes: Cash, Bank Transfer, Cheque, Mobile Money.
* Partial payments are allowed.
* Overdue invoices trigger auto-reminders via Email/WhatsApp.
* Payment realization date = commission trigger date.

#### FR-7: Commission Management
* Commission is linked to the sales agent and territory.
* Commission types: % of realized sales, per-product slab, or fixed.
* Commission is payable only upon payment realization.
* Commission reports: Per agent, per product, per period.

#### FR-8: Competitor Price Tracking
* Input competitor product, price, date, and source.
* Store multiple competitor entries per product.
* Generate competitor vs our price reports.
* AI can analyze competitor pricing trends.

#### FR-9: Customer Sentiment Analysis (AI)
* Integrate feedback collection (survey, rating, free-text feedback).
* The AI NLP model processes feedback → categorizes it as Positive/Negative/Neutral.
* Dashboard: Sentiment % per customer / product.
* Alerts if a key customer’s sentiment turns negative.

#### FR-10: Internal Chat & Task Management
* Chat system for Sales → Purchase → Accounts coordination.
* Create tasks linked to quotations, orders, or payments.
* Task workflow: Assigned → In Progress → Done.
* Notifications for pending approvals or delayed tasks.

#### FR-11: Reports & Analytics
* Quotation Status Report (open/converted/lost).
* Sales Register (by date, customer, product).
* Pending Orders & Deliveries.
* Customer Outstanding Report.
* Commission Report (realized vs pending).
* Competitor Pricing Report.
* Customer Sentiment Trends.
* All reports are exportable in PDF/Excel with filters applied.

### 2. Business Rules
* **Quotation Validity Rule:** A quotation auto-expires after X days (configurable).
* **SO Approval Rule:** Sales Orders above a predefined credit limit need Manager approval.
* **Batch Rule:** An invoice must include Batch No, MFG Date, and Expiry Date.
* **Payment Rule:** Sales commission is payable only after payment realization, not on invoice issue.
* **Credit Rule:** Customers cannot place new orders if their outstanding balance > credit limit.
* **Export Rule:** Only Managers/Admin can export sales reports. Export logs must show the date, time, and user.
* **Customer Rating Rule:** Customer performance rating is auto-calculated (on-time payments, volume, sentiment).

### 3. User Flows & Processes
**Flow 1: Quotation → Sales Order → Invoice**
1.  A sales rep creates a quotation.
2.  The customer accepts.
3.  It is converted to a Sales Order.
4.  The manager approves (if required).
5.  A Delivery Note is created, and stock is allocated.
6.  An invoice is generated and auto-posted to Finance.

**Flow 2: Payment Realization → Commission**
1.  The customer makes a payment (full/partial).
2.  The accountant records the payment.
3.  The payment is reconciled with the invoice.
4.  Commission is auto-calculated for the sales agent.
5.  The report is updated in the agent’s dashboard.

**Flow 3: Competitor Price Tracking**
1.  A sales rep inputs the competitor price for a product.
2.  The system logs competitor data with the source.
3.  A report is generated for management → “Our Price vs Competitor.”
4.  AI highlights trends (e.g., a competitor lowering the price in a region).

**Flow 4: Customer Sentiment Analysis**
1.  Customer feedback is collected post-order.
2.  AI processes free text into sentiment tags.
3.  The dashboard shows a sentiment breakdown.
4.  Alerts are generated if sentiment drops below a threshold.

### 4. Data Fields & Validations
* **Customer Table:** CustomerID, Name, Type, Contact, TaxID, Address, CreditLimit, PaymentTerms.
* **Quotation Table:** QuoteID, CustomerID, Items[], Date, Status.
* **Sales Order Table:** SOID, QuoteID, CustomerID, Items[], Status.
* **Invoice Table:** InvoiceID, SOID, CustomerID, Items[], PaymentTerms, Status.
* **Payment Table:** PaymentID, InvoiceID, Amount, Mode, Date, ClearedDate.
* **Commission Table:** AgentID, InvoiceID, Rate, RealizedAmount, CommissionAmount, Status.
* **Competitor Table:** CompetitorID, ProductID, Price, Source, Date.
* **Feedback Table:** FeedbackID, CustomerID, Text, Sentiment.

**Validations:**
* Invoice amount must equal Qty × Rate + Taxes.
* Payment date ≥ Invoice date.
* Commission calculation only when Status = Paid.
* Duplicate competitor entries are not allowed for the same date/product.

### 5. Reports & Exports
* Quotation Conversion Rate Report.
* Sales Register Report.
* Commission Payable Report.
* Competitor Price vs Our Price Report.
* Customer Sentiment Dashboard Report.
* **Exports:** Excel/PDF with filters visible at the top + metadata (date, time, exported by).
* **Export permissions:** Managers/Admin only.

### 6. Security & Permissions
* **Admin:** Full rights (all sales ops + exports).
* **Sales Manager:** Approve SO, approve discounts, export reports.
* **Sales Agent:** Create Quotes/SO, view own sales/commissions, cannot export.
* **Accountant:** Record payments, reconcile, commission payouts.
* **Marketing Analyst:** View competitor & sentiment reports.

**Additional Security:**
* Role-based dashboards.
* 2FA for Managers/Admin.
* Audit log for all quotations, invoices, and exports.

### 7. AI Assistance
* AI auto-suggests discount levels based on past deals.
* AI recommends upselling opportunities (“Customer X often buys Product Y with Z”).
* AI highlights risk customers (high outstanding + negative sentiment).
* AI chatbot for natural queries:
    * “Show me sales in Luanda for Q1.”
    * “Which customers are overdue beyond 60 days?”

---

## PRD – Module 7: Inventory & Warehouse Management

### 1. Functional Requirements (FRs)

#### FR-1: Multi-Warehouse Management
* Support multiple warehouses and storage locations.
* Each warehouse has zones (e.g., Receiving, Cold Storage, Dispatch).
* Transfer stock between warehouses with approval workflows.
* Real-time visibility of stock levels across all warehouses.

#### FR-2: Product & Batch Management
* Products are tracked by Batch No, Manufacturing Date, Expiry Date, Serial/Lot Numbers.
* Auto-block expired stock from allocation.
* Batch traceability: Vendor → Warehouse → Sales Order → Customer.
* Configurable alerts before expiry (e.g., 60/30/15 days).

#### FR-3: Barcode / QR Code Integration
* Scan products via handheld scanners or a mobile app.
* Support supplier-uploaded barcode/QR code files (Excel/CSV).
* Auto-recognition of batch, product code, and expiry via scanning.
* Generate internal QR/Barcodes for labeling.

#### FR-4: Stock Operations (Inbound, Outbound, Internal)
* **Inbound (Receipts):** Record stock arrivals against Purchase Orders. Auto-update stock levels.
* **Outbound (Delivery):** Allocate stock to Sales Orders. Generate delivery note + invoice.
* **Internal Transfers:** Move stock between warehouses/zones.
* **Smart picking strategy:** FIFO, FEFO, or manual.

#### FR-5: Putaway & Storage Rules
* Define storage rules by product type (cold chain, hazardous, fragile).
* Auto-assign storage locations based on availability & product conditions.
* Location hierarchy: Warehouse → Zone → Rack → Bin.

#### FR-6: Stock Adjustments & Cycle Counting
* Physical stock verification (cycle count).
* Adjustments are logged with reason codes (damage, loss, expired).
* Approval is required for adjustments.
* A full audit trail is maintained.

#### FR-7: Returns & Reverse Logistics
* **Customer returns:** Create a Return Order linked to the original Invoice.
* **Condition check:** Restock / Scrap / Refurbish.
* **Vendor returns:** Return defective items to the supplier with a Debit Note.

#### FR-8: Scrap Management
* Mark stock as scrap with a reason (expired, damaged, recall).
* Scrap report with cost impact.

#### FR-9: Replenishment & Reordering Rules
* Define minimum and maximum stock levels.
* Auto-generate Purchase Requisitions when stock < threshold.
* Make-to-Order option (auto purchase/manufacture when sales are confirmed).
* AI forecasting based on sales trends.

#### FR-10: Shipping & Logistics Integration
* Integration with carriers (DHL, FedEx, UPS, Shiprocket, local).
* Auto-generate shipping labels with weight & dimensions.
* Track shipment status inside the system.

#### FR-11: Inventory Valuation
* Costing methods: FIFO, Weighted Average, Standard.
* Real-time stock valuation → auto-posted to Accounting.
* Landed cost calculation (tax, freight, customs).

#### FR-12: Reports & Dashboards
* Stock Ledger (movement of items by date, warehouse, product).
* Batch Expiry Report.
* Stock Aging Report.
* Warehouse Utilization Dashboard.
* Low Stock & Reorder Alerts.
* Scrap & Damage Report.
* All reports are exportable with filters (PDF/Excel).

### 2. Business Rules
* **Expiry Rule:** Expired stock cannot be sold or allocated.
* **FIFO/FEFO Rule:** Allocation follows First-In-First-Out or First-Expiry-First-Out, unless overridden by Admin.
* **Adjustment Rule:** All manual stock changes require Manager approval.
* **Return Rule:** Returned stock must undergo a condition check before restocking.
* **Reorder Rule:** Auto-purchase triggers when stock < minimum threshold.
* **Export Rule:** Only Managers/Admins can export stock reports. Exports must show the date, time, and user ID.
* **Barcode Rule:** Every product transaction (inbound, outbound, transfer) must be scanned or validated with a QR/barcode.

### 3. User Flows & Processes
**Flow 1: Inbound Shipment → Stock Update**
1.  The supplier sends a shipment.
2.  Warehouse staff scans barcodes/QR → verifies against the Purchase Order.
3.  The system updates stock levels.
4.  Putaway rules assign storage locations.
5.  A Goods Receipt Note is generated.

**Flow 2: Sales Order → Outbound Delivery**
1.  A Sales Order is confirmed.
2.  The system allocates batches based on FEFO.
3.  The warehouse picks stock (barcode scan).
4.  A Delivery Note + Invoice is generated.
5.  Stock is auto-reduced in the system.

**Flow 3: Return Handling**
1.  A customer return is logged.
2.  The product is scanned & matched to the invoice.
3.  Condition check → Restock / Scrap / Repair.
4.  Inventory + accounting are updated.

**Flow 4: Cycle Count & Adjustment**
1.  The manager schedules a cycle count.
2.  Staff scans and counts stock.
3.  Variances are logged with a reason.
4.  The manager approves the adjustment.
5.  The audit log is updated.

**Flow 5: Replenishment**
1.  The system checks reorder levels daily.
2.  If stock < minimum, it auto-creates a Purchase Requisition.
3.  The manager approves.
4.  A Purchase Order is sent to the supplier.

### 4. Data Fields & Validations
* **Product Table:** ProductID, Name, Category, UoM, Barcode, MinStock, MaxStock.
* **Batch Table:** BatchID, ProductID, MFGDate, ExpiryDate, Qty, Status.
* **Warehouse Table:** WHID, Name, Location, Zones.
* **Stock Movement Table:** MovementID, ProductID, BatchID, From, To, Qty, Type (In/Out/Internal).
* **Adjustment Table:** AdjID, ProductID, QtyDiff, Reason, ApprovedBy.
* **Return Table:** ReturnID, ProductID, Qty, Reason, Status.

**Validations:**
* Expired stock cannot be allocated to orders.
* A batch must always have an Expiry Date.
* The stock count cannot go negative.
* A return must be linked to a valid invoice.
* All adjustments require justification.

### 5. Reports & Exports
* **Stock Ledger:** Track product movements with dates and warehouses.
* **Batch Expiry Report:** A list of products expiring within X days.
* **Stock Aging Report:** Items grouped by age in the warehouse.
* **Scrap Report:** The volume & value of scrapped stock.
* **Reorder Report:** Products below the threshold.
* **Exports:** PDF/Excel with applied filters visible at the top (date range, warehouse, product).
* **Export metadata:** Date, Time, Exported By (visible on every file).

### 6. Security & Permissions
* **Admin:** Full control, export rights, approval rights.
* **Warehouse Manager:** Approve adjustments, approve transfers, export reports.
* **Warehouse Staff:** Scan, receive, issue, internal transfers (no exports).
* **Procurement Team:** Access to reorder & purchase requisition functions.

**Additional Security:**
* 2FA for Admin/Managers.
* Audit logs for all adjustments and exports.
* Daily auto-backup (cloud + offline).

### 7. AI Assistance
* **Forecasting:** Predict demand using sales + seasonality.
* **Expiry Alerts:** AI suggests clearance discounts before expiry.
* **Stock Optimization:** AI recommends the best reorder levels.
* **Anomaly Detection:** Detect unusual stock movements (e.g., theft risk).
* **Natural Query AI:**
    * “Show me all products expiring in 30 days.”
    * “Which warehouse has the highest stock of Antibiotics?”

### 8. Backup & Restore
* Daily auto-backups of inventory data (multi-location).
* Export logs are stored with metadata (date, time, user).
* Only senior managers can export stock data.
* The restore process must be simple, with a rollback option.

---

## PRD – Module 8: Purchase & Vendor Management

### 1. Functional Requirements (FRs)

#### FR-1: Vendor Master Data Management
* Maintain a vendor database with:
    * Vendor ID, Name, Contact Details, Address, Tax IDs, Bank Details.
    * Vendor type: Manufacturer, Distributor, Transporter, Customs Agent.
    * Compliance documents (license, registration, GMP/ISO certificates).
* Vendor status: Active / Inactive / Blacklisted.
* Upload and store vendor contracts.

#### FR-2: Request for Quotation (RFQ)
* Create RFQs for required products/services.
* Send RFQs to multiple vendors simultaneously (email integration).
* Vendors can respond via a portal/email import.
* Compare quotations (price, lead time, MOQ, shipping terms).
* AI-assisted vendor ranking.

#### FR-3: Purchase Requisition (PR)
* The internal team can raise a PR for stock items or services.
* PR includes: Product, Quantity, Required Date, Justification.
* Approval workflow based on thresholds (e.g., >$10,000 requires Director approval).
* Once approved, the PR converts into an RFQ or Purchase Order.

#### FR-4: Purchase Order (PO)
* Create Purchase Orders directly or from a PR/RFQ.
* PO fields: PO No, Vendor, Items, Quantity, Rate, Tax, Delivery Terms, Payment Terms.
* An electronic PO (PDF/email) is generated and sent to the vendor.
* Revision control: Track amendments and version history.
* PO status: Draft → Sent → Confirmed → Partially Received → Closed.

#### FR-5: Goods Receipt & 3-Way Matching
* On receipt, the warehouse verifies goods against the PO.
* **3-way matching:** PO vs. GRN vs. Vendor Invoice.
* Discrepancies are flagged for approval (e.g., short quantity, excess).
* Auto-update stock on successful receipt.

#### FR-6: Vendor Invoice & Payments
* The vendor submits an invoice (manual entry or upload).
* The system checks the invoice against the PO & GRN.
* Approved invoices are pushed to Accounting/ERP.
* Payment scheduling is based on the due date, discounts, or credit terms.
* Track outstanding payables.

#### FR-7: Returns to Vendor (RTV)
* Create a return order linked to the PO/GRN.
* Reason codes: Defective, Expired, Wrong Item, Short Shelf Life.
* Generate a Debit Note automatically.
* Update stock and accounts.

#### FR-8: Compliance & Document Management
* Track vendor licenses, permits, and quality certifications.
* Alerts before document expiry.
* Upload certificates during vendor onboarding.
* Block purchases if vendor compliance has expired.

#### FR-9: Procurement Rules
* Minimum vendor quotes are required before PO approval (e.g., at least 3 quotes).
* Preferred supplier selection rules.
* Blanket purchase agreements (long-term contracts).
* Auto-reorder from a preferred vendor when stock < min level.

#### FR-10: Reports & Analytics
* Vendor Performance Dashboard (on-time delivery %, defect rate, avg. lead time).
* Purchase Spend Analysis by vendor, product, or category.
* Open Purchase Orders Report.
* Payables Aging Report.
* RFQ Comparison Sheet.
* All exports must include the date, time, and exported by the user.

### 2. Business Rules
* **Vendor Rule:** Only approved vendors can receive POs.
* **RFQ Rule:** At least 3 RFQs must be issued before a PO (unless an exception is approved).
* **Approval Rule:** PR/PO must follow an approval matrix based on thresholds.
* **3-Way Match Rule:** An invoice can’t be paid unless the PO & GRN match.
* **Return Rule:** Returns to a vendor must generate a Debit Note.
* **Export Rule:** Only Managers/Admins can export procurement reports. All exports must have a timestamp + user ID.
* **Compliance Rule:** A vendor with expired compliance docs cannot be selected in new POs.

### 3. User Flows & Processes
**Flow 1: Purchase Requisition → PO**
1.  A user raises a PR for 100 units of Amoxicillin.
2.  A manager reviews & approves the PR.
3.  The procurement team issues an RFQ to 3 vendors.
4.  Vendors respond with quotes.
5.  Procurement compares and selects Vendor A.
6.  A PO is generated & sent to Vendor A.

**Flow 2: Goods Receipt & Invoice**
1.  The vendor ships the goods.
2.  The warehouse receives & scans the items.
3.  A GRN is generated and linked to the PO.
4.  The vendor sends an invoice.
5.  The system matches the Invoice vs PO vs GRN.
6.  If matched → Accounts posts the payment.
7.  If there's a mismatch → Escalation for approval.

**Flow 3: Vendor Return**
1.  The warehouse identifies defective stock.
2.  It creates an RTV linked to the original PO.
3.  A Debit Note is generated.
4.  Stock is deducted from the warehouse.
5.  Accounts adjusts payables.

**Flow 4: Compliance Management**
1.  A vendor's certificate is about to expire.
2.  The system sends a reminder 30 days prior.
3.  If expired → the block vendor in procurement.
4.  A compliance officer updates the documents → the vendor is reactivated.

### 4. Data Fields & Validations
* **Vendor Table:** VendorID, Name, Address, Contact, Bank, ComplianceDocs.
* **PR Table:** PRID, RequestedBy, ProductID, Qty, Status, ApprovalHistory.
* **RFQ Table:** RFQID, VendorID, ProductID, Qty, Price, LeadTime.
* **PO Table:** POID, VendorID, Items, Amount, Status, Version.
* **GRN Table:** GRNID, POID, Items, ReceivedQty, Date.
* **Invoice Table:** InvoiceID, VendorID, POID, GRNID, Amount, Status.
* **RTV Table:** ReturnID, POID, ProductID, Qty, Reason, DebitNoteID.

**Validations:**
* A PO cannot be created for an inactive/blacklisted vendor.
* A PR cannot be converted without approval.
* The invoice amount cannot exceed the PO amount without approval.
* A Debit Note must be linked to a valid PO/GRN.

### 5. Reports & Exports
* **RFQ Comparison Report:** Quotes vs Lead Times vs Terms.
* **Vendor Performance Report:** Delivery %, Rejection %, Avg. Lead Time.
* **Purchase Spend Report:** Spend per Vendor/Category/Month.
* **Outstanding Payables Report:** Vendor-wise payable aging.
* **PO Status Report:** Draft/Sent/Confirmed/Closed.
* All exports must include Date, Time, and Exported by User in the footer.

### 6. Security & Permissions
* **Admin:** Full access, export rights, approve exceptions.
* **Procurement Manager:** Approve PR/PO, vendor onboarding, export rights.
* **Procurement Officer:** Create PR, RFQ, PO (no exports).
* **Accounts Team:** Handle invoices, debit notes, and payments.
* **Compliance Officer:** Manage vendor certifications.

**Additional Controls:**
* Threshold-based approvals (e.g., PO > $50k requires Director approval).
* Audit logs for PR/PO/Invoice/Export actions.
* 2FA for financial approvals.

### 7. AI Assistance
* **Vendor Ranking:** Suggests the best vendor based on price + delivery history.
* **Spend Forecasting:** Predicts procurement spend based on trends.
* **Exception Alerts:** Flags invoices > PO amount or repeated delays.
* **Smart RFQ:** Suggests vendors based on past performance.
* **Natural Query AI:**
    * “Show me all POs pending receipt.”
    * “Which vendor gave the best price for Ceftriaxone in the last 6 months?”

### 8. Backup & Restore
* Daily backup of all procurement data (cloud + offline).
* Export logs are stored with a timestamp + user ID.
* Senior managers only can restore/export the full vendor/PO history.

---

## PRD – Module 9: Sales & Distribution Management

### 1. Functional Requirements (FRs)

#### FR-1: Customer Master Data Management
* Maintain a customer database with:
    * Customer ID, Name, Contact Details, Address, Credit Limit, Payment Terms.
    * Customer Category: Distributor, Pharmacy, Hospital, Wholesaler, Government Agency.
    * Compliance Docs: License, Tax ID.
* Customer Status: Active / Inactive / Blacklisted.

#### FR-2: Sales Quotation (SQ)
* Generate sales quotations for prospective customers.
* Fields: Quote No, Customer, Items, Qty, Unit Price, Tax, Discount, Validity.
* Multiple versions are allowed (Revision history).
* Convert a quotation → Sales Order on acceptance.
* Export in PDF/Excel with company branding.

#### FR-3: Sales Order (SO)
* Create an SO directly or from a quotation.
* Fields: SO No, Customer, Items, Qty, Price, Terms, Delivery Date.
* Stock check: SO cannot exceed available stock unless an override approval is given.
* SO workflow: Draft → Confirmed → Dispatched → Closed.
* Partial fulfillment is allowed.

#### FR-4: Delivery & Dispatch
* Generate a Delivery Challan/Invoice from an SO.
* Track shipments via delivery partner integration.
* Link batch/expiry to dispatched items (mandatory for medicines).
* Allow split delivery if required.
* Delivery status: Pending, In Transit, Delivered.

#### FR-5: Sales Invoice
* Auto-generate an invoice from an SO/Delivery.
* Fields: Invoice No, Date, Customer, Items, Price, Tax, Terms.
* Supports Cash Sales and Credit Sales.
* Multi-currency support (for Angola, India, UAE).
* Auto-post the invoice to the Accounting module.

#### FR-6: Returns from Customer (RFC)
* Process returns linked to an SO/Invoice.
* Return reasons: Defective, Expired, Wrong Supply.
* A Credit Note is generated automatically.
* Update stock (return to inventory/quarantine).

#### FR-7: Commissions
* Track commissions for Sales Reps and Agents.
* Commission is payable only after payment realization.
* Configurable % per product, customer, or region.
* Commission reports by agent/rep.

#### FR-8: Customer Credit Management
* Set a credit limit per customer.
* Block a new SO if a customer exceeds the limit.
* Overdue invoice alerts.
* Credit approval workflow for exceptions.

#### FR-9: Reports & Analytics
* Sales Register (date, customer, product).
* Pending SO Report.
* Top 10 Customers by Sales.
* Region-wise sales analysis.
* Commission Reports.
* All reports are exportable in PDF/Excel with the date, time, and exported by the user.

### 2. Business Rules
* **Quotation Rule:** A quotation must have validity; an expired quotation cannot be converted without approval.
* **SO Rule:** An SO cannot exceed the credit limit unless approved by a senior role.
* **Delivery Rule:** Batch and expiry must be attached to each delivery item.
* **Invoice Rule:** An invoice cannot be generated without a confirmed SO.
* **Commission Rule:** Commission is calculated only on realized payments (not on booking).
* **Return Rule:** A return must be linked to an invoice, and approval is required if it is >30 days from the sale.
* **Export Rule:** Only Managers/Admins can export sales reports. All exports are stamped with date/time/user.

### 3. User Flows & Processes
**Flow 1: Quotation → Sales Order → Delivery → Invoice**
1.  A Sales Rep creates a quotation for 500 packs of Paracetamol.
2.  The customer accepts; the quotation is converted to an SO.
3.  The warehouse confirms the stock and prepares for dispatch.
4.  A Delivery Challan is generated with batch/expiry details.
5.  An invoice is auto-generated and sent to the customer.

**Flow 2: Customer Return**
1.  A customer returns expired goods.
2.  An RFC is created and linked to the original invoice.
3.  Stock is returned to quarantine.
4.  A Credit Note is generated.
5.  Accounts adjusts the receivable balance.

**Flow 3: Commission Payment**
1.  A Sales Rep books an SO for $10,000.
2.  The customer pays the invoice after 30 days.
3.  The system calculates the commission (e.g., 5% = $500).
4.  The commission payable is shown in the Payroll/HR module.

**Flow 4: Credit Check**
1.  Customer credit limit = $50,000.
2.  Outstanding invoices = $45,000.
3.  A new SO worth $10,000 is raised.
4.  The system blocks the order; it requires Manager approval.

### 4. Data Fields & Validations
* **Customer Table:** CustomerID, Name, Contact, CreditLimit, Status.
* **Quotation Table:** QuoteID, CustomerID, Items, Price, Validity, Status.
* **SO Table:** SOID, CustomerID, Items, Qty, Status, DeliveryDate.
* **Delivery Table:** DeliveryID, SOID, BatchNo, ExpiryDate, Carrier, Status.
* **Invoice Table:** InvoiceID, SOID, Amount, Currency, PaymentTerms, Status.
* **Return Table:** ReturnID, InvoiceID, Items, Reason, CreditNoteID.
* **Commission Table:** CommissionID, SalesRepID, SOID, InvoiceID, Amount, Status.

**Validations:**
* A customer must be active to create an SO.
* A quotation must be within its validity period.
* An SO cannot be dispatched without stock allocation.
* The invoice currency must match the transaction currency.
* Returns must specify a batch number.

### 5. Reports & Exports
* **Sales Register Report:** All sales with filters (date, customer, product).
* **Outstanding SO Report:** Pending delivery orders.
* **Top Customers Report:** Ranked by revenue.
* **Commission Report:** Realized commissions by agent/rep.
* **Credit Exposure Report:** Customers nearing/exceeding their credit limit.
* All exports include Date, Time, and Exported By User.

### 6. Security & Permissions
* **Admin:** Full access, can override credit limits, can export reports.
* **Sales Manager:** Approve quotations, SOs, returns, and commissions.
* **Sales Rep:** Create quotations, SOs, view commissions (no exports).
* **Warehouse Officer:** Handle deliveries and customer returns.
* **Accounts:** Generate invoices, process payments, and adjust credit notes.

**Controls:**
* 2FA for invoice creation and credit overrides.
* Export is restricted to Managers/Admin only.
* Audit log for SO, invoice, return, and commission changes.

### 7. AI Assistance
* **Smart Quoting:** AI suggests an optimal price based on past sales & competitor data.
* **Customer Sentiment Analysis:** Analyze customer feedback for upsell opportunities.
* **Credit Risk Forecasting:** Predict the risk of customer default based on payment history.
* **Sales Rep Performance Prediction:** AI shows who is likely to close the most deals.
* **Natural Query AI:**
    * “Show me pending SOs in the Luanda region.”
    * “Which customer bought the most antibiotics last quarter?”

### 8. Backup & Restore
* Daily backup of all sales data (cloud + offline).
* Auto-backup of invoices and delivery documents.
* Restore is available only to Admin/Senior Manager.
* Export logs with date/time/user are included.

---

## PRD – Module 10: Inventory & Warehouse Management

### 1. Functional Requirements (FRs)

#### FR-1: Multi-Warehouse Setup
* Support for multiple warehouses (e.g., Angola, India, UAE).
* Define a warehouse hierarchy: Central → Regional → Local.
* The warehouse master includes: Name, Address, Contact, Capacity, Responsible Officer.
* Role-based access: A user only sees their assigned warehouse.

#### FR-2: Product Master with Batch & Expiry
* Each product is stored with:
    * Product ID, Generic Name, Brand Name, Strength, Form (Tablet, Syrup, Injection).
    * SKU, Barcode, QR Code.
    * Manufacturer, Supplier.
    * **Batch Number, Manufacturing Date, Expiry Date** (mandatory for medicines).
* Auto-block expired products from being dispatched.
* Auto-alert for products nearing expiry (configurable e.g., 90/60/30 days).

#### FR-3: Stock Management
* Real-time stock visibility by warehouse, product, and batch.
* Stock transactions are tracked: Inward (Purchase, Returns), Outward (Sales, Transfers, Adjustments).
* Support for multiple units of measure (Boxes, Packs, Tablets).
* Auto-conversion (1 box = 10 strips = 100 tablets).
* Minimum/Reorder/Maximum stock levels per product.
* FIFO (First In First Out) or FEFO (First Expiry First Out) logic is selectable.

#### FR-4: Barcode / QR Code Integration
* Support scanning via handheld devices or a mobile app.
* Accept supplier-provided barcode/QR files (CSV/Excel upload).
* Scan to receive stock, dispatch stock, or conduct a stock count.
* Each scan updates the batch, expiry, and stock count automatically.

#### FR-5: Goods Inward (Stock Receipts)
* A Goods Receipt Note (GRN) is generated on inward entry.
* Linked to a Purchase Order and Supplier.
* Mandatory fields: Batch No, Expiry Date, Manufacturing Date, Qty Received.
* The system checks against the PO and raises discrepancy alerts.

#### FR-6: Goods Outward (Dispatch / Sales / Returns)
* Goods are issued against a Sales Order, Internal Transfer, or Returns to Vendor.
* Must capture Batch No, Expiry Date, Qty, and Destination.
* The system applies FEFO (first expiry first out) by default.
* Auto-generate a Delivery Challan / Dispatch Note.

#### FR-7: Stock Transfers
* Inter-warehouse transfer requests are allowed.
* Transfer workflow: Request → Approval → Dispatch → Receipt.
* The transfer is linked to both the source and destination warehouse stock.

#### FR-8: Stock Adjustments
* Adjustment reasons: Damage, Theft, Audit Difference, Sample Usage.
* Approval is required for adjustments.
* An audit log is maintained with the user, reason, and date.

#### FR-9: Stock Counting & Audit
* Periodic stocktaking with a handheld scanner.
* Support for cycle counting (by product group).
* The system compares physical vs system stock and generates a variance report.
* An audit log is mandatory for adjustments.

#### FR-10: Reports & Analytics
* Stock Ledger by product/batch.
* Expiry Report (next 90/60/30 days).
* Slow-moving and fast-moving items.
* Stock Valuation Report (FIFO/Weighted Average).
* Stock Reconciliation Report.
* All reports are exportable to PDF/Excel with the date, time, and exported by the user.

### 2. Business Rules
* **Batch Rule:** All medicine stock must have a Batch No + Expiry Date.
* **Expiry Rule:** Expired stock is auto-blocked for sale.
* **FEFO Rule:** Dispatch follows FEFO unless overridden by a Manager.
* **Reorder Rule:** The system auto-generates a purchase requisition when stock < minimum.
* **Adjustment Rule:** All stock adjustments must be approved by a Manager.
* **Export Rule:** Only senior roles can export inventory reports (with a date/time/user stamp).

### 3. User Flows & Processes
**Flow 1: Goods Receipt**
1.  A supplier delivers 1000 strips of Amoxicillin.
2.  The warehouse scans the barcode/QR for the batch + expiry.
3.  A GRN is created and linked to the PO.
4.  Stock is updated in inventory with batch traceability.

**Flow 2: Dispatch (Sales)**
1.  A Sales Order for 500 strips is created.
2.  The warehouse selects stock → the system auto-picks the earliest expiry.
3.  Goods are packed, and a Delivery Challan is generated.
4.  Stock is deducted from the system.

**Flow 3: Stock Transfer**
1.  Warehouse A requests 200 units from Warehouse B.
2.  A manager approves the transfer.
3.  A dispatch note is generated in Warehouse B, and stock is deducted.
4.  A receipt note is generated in Warehouse A, and stock is added.

**Flow 4: Expiry Handling**
1.  A product batch expiring in 30 days is flagged.
2.  The system sends alerts to Procurement & Sales.
3.  Option to return to the vendor, run a clearance sale, or write off.

**Flow 5: Stock Audit**
1.  A warehouse officer scans 100 products physically.
2.  The system compares physical vs system stock.
3.  Variance is flagged.
4.  A manager approves adjustments.

### 4. Data Fields & Validations
* **Product Table:** ProductID, Name, Form, Strength, SKU, Barcode.
* **Batch Table:** BatchID, ProductID, BatchNo, MfgDate, ExpiryDate, Qty.
* **Warehouse Table:** WarehouseID, Name, Location, Capacity.
* **GRN Table:** GRNID, POID, BatchID, QtyReceived, Date.
* **Dispatch Table:** DispatchID, SOID, BatchID, Qty, Destination.
* **Transfer Table:** TransferID, SourceWH, DestWH, BatchID, Qty.
* **Adjustment Table:** AdjID, WarehouseID, BatchID, Qty, Reason, ApprovedBy.

**Validations:**
* Batch No + Expiry are mandatory for all medicines.
* Expired stock cannot be dispatched.
* Negative stock is not allowed (unless a Manager overrides).
* A transfer cannot exceed available stock.

### 5. Reports & Exports
* **Stock Ledger Report:** Movement of stock (In/Out/Balance).
* **Expiry Report:** Products expiring soon.
* **Stock Valuation:** Based on FIFO or Weighted Avg.
* **Fast/Slow Moving Items Report.**
* **Stock Adjustment Report.**
* **All exports:** Must have the date, time, and exported by which person (only Senior can export).

### 6. Security & Permissions
* **Admin:** Full access, can export, override rules.
* **Warehouse Manager:** Approve receipts, dispatches, adjustments, and transfers.
* **Warehouse Officer:** Scan/receive/dispatch stock (no export rights).
* **Auditor:** Read-only access to stock & variance reports.

**Controls:**
* 2FA is required for approvals of stock adjustments.
* Audit log for all stock movements.
* Export is restricted to Admin & Warehouse Manager.

### 7. AI Assistance
* **Expiry Prediction:** AI suggests products likely to expire based on sales velocity.
* **Demand Forecasting:** Predicts reorder points based on trends.
* **Theft/Diversion Detection:** Flags unusual stock movements.
* **Natural Query AI:**
    * “Show me all batches of Ceftriaxone expiring in the next 60 days.”
    * “Which products are slow-moving in the Luanda warehouse?”

### 8. Backup & Restore
* Daily auto-backup of the inventory database.
* Backups are stored in the cloud + offline + sent to a predefined email ID.
* Restore rights are limited to Admin only.
* Exported reports include a date/time/user ID stamp.

---

## PRD – Module 11: Finance & Accounting

### 1. Functional Requirements (FRs)

#### FR-1: Chart of Accounts Setup
* Preconfigured standard chart of accounts for pharmaceutical distribution (customizable).
* Supports multi-currency (INR, AED, AOA, USD, EUR).
* Accounts are grouped into Assets, Liabilities, Equity, Revenue, and Expenses.
* The fiscal year is configurable (default: Jan–Dec, option for Apr–Mar in India).

#### FR-2: Journal Entries
* Auto-journal entries are generated from all modules (sales, purchases, expenses, payroll, stock adjustments).
* Manual journal entries are allowed for adjustments (with approval).
* Journal entry validations: Debit = Credit is mandatory.

#### FR-3: Invoices & Billing
* **Customer Invoices:** Generated from sales orders, quotations → confirmed orders.
* **Supplier Invoices:** Generated from purchases, GRN entries.
* **Recurring Invoices:** Based on contract setup.
* **Credit Notes:** Issued for refunds or returns.
* All invoices include tax, batch info (if applicable), payment terms, and Incoterms®.

#### FR-4: Payments
* **Customer Payments:** Record cash, credit, bank transfer, card, or online payments.
* **Supplier Payments:** Manage payouts by the due date, and approve batch payments.
* **Partial Payments:** Support installment payments.
* **3-Way Matching:** Purchase Order ↔ GRN ↔ Invoice validation before payment.
* **Commission Rule:** Sales commissions are payable only after payment realization.

#### FR-5: Taxes
* Configurable GST/VAT rules (India, UAE, Angola).
* Automated tax calculation at the invoice level.
* Multi-country tax handling for cross-border operations.
* OSS tax management for the EU if needed.

#### FR-6: Multi-Currency & Exchange Rates
* Currency conversion is based on daily/weekly/monthly rates.
* Realized & unrealized gain/loss are auto-recorded.
* Customer invoices can be issued in a foreign currency.

#### FR-7: Financial Statements
* Profit & Loss (P&L).
* Balance Sheet.
* Cash Flow Statement.
* Trial Balance.
* Automated consolidation for multi-company/multi-branch operations.

#### FR-8: Reports & Analysis
* Aged Receivables & Payables.
* Sales Register & Purchase Register.
* Expense Reports.
* Tax Reports (country-specific).
* Ledger Report.
* Exportable to Excel/PDF (with date, time, user).

#### FR-9: Auto Report Scheduling
* Daily / Weekly / Monthly / Quarterly automatic reports:
    * P&L, Balance Sheet, Cash Flow.
    * Sales, Purchases, Payments.
* Sent automatically via Email + WhatsApp to a pre-defined management list.
* Also available for download in the system.

#### FR-10: Audit Trail & Compliance
* All financial entries are timestamped, and the user ID is logged.
* Non-editable audit logs.
* Export rights are restricted to senior finance roles only.
* Option to comply with IFRS and local GAAP.

### 2. Business Rules
* **Commission Rule:** Sales commission is payable only after payment is received (not on invoice issue).
* **Invoice Rule:** Every sales invoice must be linked to a batch if the product is medicine.
* **3-Way Match Rule:** A supplier invoice cannot be paid unless the PO + GRN + Invoice match.
* **Currency Rule:** All currency conversions must use the system-defined exchange rate.
* **Approval Rule:** All manual journal entries and large payments require Manager approval.
* **Export Rule:** Only senior roles (Finance Manager, Admin) can export financial data, with a date/time/user ID embedded in the output.

### 3. User Flows & Processes
**Flow 1: Sales Invoice & Payment**
1.  The sales team confirms a Sales Order.
2.  The system generates an invoice.
3.  The invoice is emailed to the customer with an online payment link.
4.  The customer pays via bank transfer.
5.  Payment is recorded → the system updates Accounts Receivable.
6.  Once cleared, the commission is payable to the sales rep.

**Flow 2: Supplier Invoice & Payment**
1.  A supplier delivers goods → a GRN is generated.
2.  The supplier sends an invoice.
3.  The system checks the PO, GRN, and Invoice (3-way match).
4.  A manager approves.
5.  Supplier payment is scheduled (batch payment is possible).

**Flow 3: Expense Reimbursement**
1.  An employee submits an expense (travel, marketing).
2.  A manager approves.
3.  The system generates a journal entry (Expense Dr, Cash/Bank Cr).
4.  Option to re-invoice expenses to a customer.

**Flow 4: Financial Reporting**
1.  At month-end, the system consolidates sales, purchases, expenses, and stock valuation.
2.  It auto-generates a P&L, Balance Sheet, and Cash Flow.
3.  It sends reports via Email & WhatsApp to Directors.

### 4. Data Fields & Validations
* **Invoice Table:** InvoiceID, CustomerID/SupplierID, Date, Amount, Tax, BatchID, Payment Terms, Status.
* **Payment Table:** PaymentID, InvoiceID, Mode, Amount, Date, Status.
* **Journal Table:** JournalID, EntryDate, Debit, Credit, Description, ApprovedBy.
* **Currency Table:** CurrencyID, Rate, EffectiveDate.
* **Commission Table:** SalesRepID, InvoiceID, Commission%, CommissionStatus.

**Validations:**
* Invoice total = Line items total + Tax.
* Debit = Credit in journals.
* Payment cannot exceed the invoice amount.
* No expired product can be invoiced.

### 5. Reports & Exports
* Profit & Loss (by branch, product, period).
* Balance Sheet (consolidated & individual).
* Cash Flow Statement.
* Sales Register / Purchase Register.
* Tax Reports (GST, VAT, local compliance).
* Export PDF/Excel with filters (date range, branch, customer, supplier).
* Export must include the date, time, and exported by the user in the header.

### 6. Security & Permissions
* **Admin:** Full access.
* **Finance Manager:** Approve journals, payments, and export reports.
* **Accountant:** Create invoices, record payments, and manage entries (no export).
* **Auditor:** Read-only access, can view logs and reports.

**Controls:**
* 2FA is required for approvals and report exports.
* Audit trail logs are non-editable.
* Export is only available to senior roles.

### 7. AI Assistance
* **Automated Categorization:** AI reads invoices (via OCR) and auto-fills fields.
* **Risk-Based Approvals:** AI flags high-risk transactions (large payments, unusual vendors).
* **Anomaly Detection:** AI identifies unusual expense trends or duplicate invoices.
* **Smart Queries:**
    * “Show me overdue invoices above $10,000.”
    * “What was last month’s gross margin in Angola?”

### 8. Backup & Restore
* Daily auto-backup of the financial database (cloud + offline + email).
* The backup includes journals, invoices, payments, and reports.
* Restore rights are restricted to Admin.
* All exports are stamped with date/time/user info.

---

## PRD – Module 12: Human Resources (HR & Payroll)

### 1. Functional Requirements (FRs)

#### FR-1: Employee Master Data
* Maintain detailed employee profiles:
    * Employee ID, Name, Contact Details, Email, Address, Date of Birth, Date of Joining, Designation, Department.
    * Role-based access (Admin, Manager, Sales Rep, Warehouse, Finance, etc.).
    * Reporting Manager.
    * Employment Type: Full-Time, Part-Time, Contract, Consultant.
    * Bank Details, Tax Identification, Social Security / Provident Fund ID.
* Status: Active / Inactive / Terminated.

#### FR-2: Role-Based Access & Dashboard
* Access to system modules is based on role.
* **Admin:** Full access.
* **Managers:** Approve leaves, expenses, purchase requests, and exports.
* **Sales Reps:** Access the Sales Module, commissions, and own expenses.
* **Warehouse Officers:** Access the Inventory Module only.
* **Finance:** Access the Accounting Module only.
* **HR:** Access Employee Master, Attendance, and Payroll.
* Two-Factor Authentication for sensitive operations (salary, commissions, exports).

#### FR-3: Attendance & Leave Management
* Daily attendance tracking: manual, biometric, or AI-based facial recognition.
* Leave types: Casual, Sick, Earned, Maternity, Paternity, Special.
* Leave approval workflow: Employee → Manager → HR → Final Approval.
* Real-time leave balance updates.
* Auto notifications for pending approvals.

#### FR-4: Payroll Management
* Payroll calculation is based on the salary structure: Basic, HRA, Allowances, Deductions.
* Tax computation per country (India, UAE, Angola).
* Commission integration: Realized sales commissions are included in payroll.
* Overtime and bonus computation.
* Multi-currency support for international staff.
* Payroll slips are exportable in PDF/Excel.
* Auto-post payroll journal entries in the Accounting module.

#### FR-5: Employee Expenses
* Submission of expenses via desktop or mobile.
* Attach receipts or invoices; AI OCR can auto-read amounts.
* Expense approval workflow: Employee → Manager → Finance → Payment.
* Reinvoice expenses to customers if applicable.
* Expense reports are exportable (PDF/Excel) with filters by date, employee, and department.

#### FR-6: Recruitment & Onboarding (Optional)
* Create job postings internally.
* Applicant tracking system.
* Onboarding checklist: Documents, Account Setup, Role Assignment, Training.
* Auto-create an employee record after joining.

#### FR-7: Performance & Appraisal
* Track KPIs for Sales, Warehouse, Finance, and HR.
* Managerial appraisal workflow.
* Feedback collection.
* Link performance to salary increments or bonuses.

#### FR-8: Employee Portal
* Employees can:
    * View payslips, leave balance, and attendance.
    * Submit expenses.
    * Check commissions (sales staff).
* Self-service reduces HR workload.

### 2. Business Rules
* **Commission Rule:** Only realized payments are considered for payroll commissions.
* **Leave Rule:** Leave approvals are mandatory for payroll adjustment.
* **Salary Rule:** Payroll is auto-generated on the last working day of the month.
* **Export Rule:** Only Admin/Finance can export payroll reports with date/time/user info.
* **Audit Rule:** All payroll, commission, and expense actions are logged with a user ID and timestamp.

### 3. User Flows & Processes
**Flow 1: Payroll Generation**
1.  HR/Finance confirms attendance, leave, and expenses for the month.
2.  The system calculates salary, allowances, deductions, and commissions.
3.  A payroll slip is generated for each employee.
4.  Payments are posted to bank accounts.
5.  The payroll journal is auto-updated in the Accounting Module.

**Flow 2: Expense Submission & Approval**
1.  An employee submits an expense with a receipt.
2.  A manager approves or rejects it.
3.  Finance verifies and processes the reimbursement.
4.  Auto-posts to Accounting.
5.  An exportable report is available with filters.

**Flow 3: Commission Realization**
1.  A sales rep’s invoice is paid by the customer.
2.  The system calculates the commission as per the agreement.
3.  The commission is included in the next payroll.
4.  A report is available to the manager/admin.

**Flow 4: Leave Request & Approval**
1.  An employee requests leave via the portal.
2.  A manager receives a notification.
3.  The manager approves/rejects.
4.  The system updates the leave balance and payroll adjustments automatically.

### 4. Data Fields & Validations
* **Employee Table:** EmployeeID, Name, Designation, Department, Role, SalaryStructure, BankAccount, TaxID.
* **Attendance Table:** EmployeeID, Date, CheckIn, CheckOut, Status.
* **Leave Table:** EmployeeID, LeaveType, StartDate, EndDate, Status.
* **Payroll Table:** EmployeeID, Month, Basic, Allowances, Deductions, Commission, NetPay.
* **Expenses Table:** ExpenseID, EmployeeID, Date, Amount, Receipt, Status.
* **Commissions Table:** EmployeeID, InvoiceID, Amount, RealizationStatus.

**Validations:**
* An employee must be active to process payroll.
* A commission is included only if the invoice is fully paid.
* Expense receipts are mandatory for reimbursement.
* Leave overlaps are blocked automatically.

### 5. Reports & Exports
* Monthly Payroll Report.
* Leave Summary by Employee/Department.
* Expense Reports by Employee/Department.
* Commission Report (Realized vs Pending).
* Attendance & Absentee Report.
* All reports are exportable in PDF/Excel with the date, time, and exported by the user.

### 6. Security & Permissions
* **Admin:** Full access to HR + Payroll + Expense + Commissions.
* **HR Manager:** Approve leave, expenses, create employee records, and export reports.
* **Finance:** Payroll processing, journal posting, and commission calculations.
* **Employee:** Self-service portal only (view payslip, submit leave/expenses).

**Controls:**
* 2FA for payroll approval, commission inclusion, and export.
* Audit logs are mandatory for sensitive actions.

### 7. AI Assistance
* **Expense OCR:** Auto-read invoices/receipts.
* **Payroll Error Detection:** AI flags anomalies or duplicate payments.
* **Leave Trend Analysis:** Suggests optimal staffing based on past leave patterns.
* **Commission Forecasting:** Predicts future sales commission payouts.
* **Natural Queries:**
    * “Show me all employees on leave next week.”
    * “Generate a payroll summary for the Angola branch.”

### 8. Backup & Restore
* Daily backup of all HR, Payroll, Commission, and Expense data.
* Backups are stored in the cloud + offline + emailed to a predefined ID.
* Restore rights are restricted to Admin only.
* Export logs are stamped with date/time/user.

---

## PRD – Module 13: Marketing & Customer Engagement

### 1. Functional Requirements (FRs)

#### FR-1: Customer Database & Segmentation
* Maintain a central customer database:
    * Customer ID, Name, Contact, Email, Address, Country, VAT/TIN (if applicable).
    * Purchase history, preferred products, frequency of orders.
* Segmentation based on:
    * Geography (Angola regions, cities).
    * Purchase frequency.
    * Product categories.
    * Revenue contribution.
* Enable targeted marketing campaigns based on segments.

#### FR-2: Campaign Management
* Create marketing campaigns: Email, SMS, WhatsApp, or mixed.
* Campaign types: Promotions, New Product Launch, Customer Retention.
* Schedule campaigns with start/end dates.
* Track campaign performance: Open Rate, Click Rate, Conversion Rate, Revenue Generated.
* A/B testing for message content.

#### FR-3: Customer Sentiment Analysis
* Track and analyze customer feedback from:
    * Surveys, Emails, WhatsApp messages.
    * Complaints and support tickets.
* AI-powered sentiment scoring (Positive, Neutral, Negative).
* Generate reports to identify dissatisfaction trends and product perception.

#### FR-4: Loyalty & Rewards Program
* Assign loyalty points for purchases.
* Points are redeemable for discounts, gifts, or cashbacks.
* A customer portal to view points, redeem rewards, and track redemption history.
* Tiered loyalty levels (e.g., Silver, Gold, Platinum).

#### FR-5: Competitor Price Tracking
* Input competitor products and prices.
* Track price changes periodically (manual entry or API scraping if available).
* Generate alerts for undercutting or promotions.
* An AI suggestion engine for an optimal pricing strategy based on competitor and sales data.

#### FR-6: Quotation Management (Sales Support)
* Create customer quotations with optional discounts.
* Convert quotations to sales orders automatically when approved.
* Quotation history is linked to the customer record.

#### FR-7: Customer Communication History
* Log all communication: Calls, Emails, WhatsApp, Meetings.
* AI-assisted summary: Key points, follow-ups.
* Filterable by date, customer, campaign, or sales rep.

#### FR-8: Marketing Analytics & Reporting
* Campaign ROI analysis.
* Customer segmentation reports.
* Purchase pattern and churn analysis.
* Loyalty program usage reports.
* Competitor pricing and market trend analysis.
* Exportable to PDF/Excel with date, time, and user info.

#### FR-9: AI-Assisted Marketing Recommendations
* Recommend the best time to send campaigns.
* Suggest targeted offers based on purchase history.
* Predict customer churn and retention strategies.
* Generate automated summaries of market trends.

### 2. Business Rules
* **Campaign Rule:** A campaign can only be sent to opted-in customers (compliance with local laws).
* **Loyalty Rule:** Points can only be redeemed after they are posted in the system; partial redemptions are allowed.
* **Quotation Rule:** Quotation discounts are capped as per company policy; approval is needed for exceptions.
* **Export Rule:** Marketing and customer reports can only be exported by authorized personnel with a timestamp and user info.

### 3. User Flows & Processes
**Flow 1: Creating a Campaign**
1.  The marketing team selects a target segment.
2.  They draft the campaign content (Email/WhatsApp/SMS).
3.  They schedule the start/end date.
4.  They launch the campaign → the system tracks metrics.
5.  AI provides a summary and improvement suggestions.

**Flow 2: Loyalty Program Redemption**
1.  A customer makes a purchase → points are auto-added.
2.  The customer portal shows the balance.
3.  The customer redeems points → a discount is applied automatically at invoice generation.
4.  Redeemed points are logged in the system.

**Flow 3: Competitor Price Tracking & Adjustment**
1.  Input competitor product/pricing.
2.  The system monitors for updates or changes.
3.  AI suggests a price adjustment for company products to maintain competitiveness.

**Flow 4: Customer Sentiment Analysis**
1.  Customer feedback is logged manually or via integration (email/WhatsApp).
2.  AI analyzes the text → scores the sentiment.
3.  The dashboard shows trend analysis and alerts management for negative feedback.

### 4. Data Fields & Validations
* **Customer Table:** CustomerID, Name, Email, Phone, Address, Segment, LoyaltyPoints, TotalSpend.
* **Campaign Table:** CampaignID, Name, Type, StartDate, EndDate, TargetSegment, Status.
* **Quotation Table:** QuotationID, CustomerID, Date, Items, TotalAmount, Discount, Status.
* **Competitor Table:** CompetitorID, Product, Price, DateChecked.
* **Feedback Table:** FeedbackID, CustomerID, Source, Date, Content, SentimentScore.

**Validations:**
* Customer contact info is mandatory for a campaign.
* Loyalty points cannot exceed the earned balance.
* Discounts in a quotation cannot exceed policy limits.

### 5. Reports & Exports
* Campaign performance report.
* Customer sentiment trends.
* Loyalty program report (points earned vs redeemed).
* Competitor pricing trends.
* Quotation to Sales conversion report.
* Exportable to PDF/Excel with date, time, and exported by the user.

### 6. Security & Permissions
* **Admin/Marketing Head:** Full access to campaigns, quotations, and competitor data.
* **Marketing Staff:** Can create campaigns, view analytics, but cannot export sensitive reports.
* **Sales Reps:** Access quotations and customer interaction history.
* **Compliance:** Access logs and opt-in customer lists only.

**Controls:**
* 2FA for launching campaigns.
* Export restrictions for sensitive reports.
* An audit trail for campaign edits, quotation approvals, and loyalty adjustments.

### 7. AI Assistance
* **Sentiment Analysis:** Score and categorize feedback.
* **Campaign Optimization:** AI suggests the best timing, target segment, and content improvements.
* **Churn Prediction:** Predict customers likely to stop purchasing.
* **Loyalty Recommendations:** Suggest reward strategies based on buying patterns.
* **Competitor Insights:** Detect pricing trends and suggest adjustments.

### 8. Backup & Restore
* Daily auto-backup of all customer, campaign, loyalty, quotation, and competitor data.
* The backup is stored in the cloud + offline + sent to a predefined email.
* Restore rights are restricted to Admin.
* Exported reports contain date/time and exported by user info.

---

## PRD – Module 14: AI & Automation Core

### 1. Functional Requirements (FRs)

#### FR-1: AI API Integration
* Ability to input a Google AI API Key and an OpenAI API Key.
* A centralized AI configuration page for:
    * Language model selection.
    * API key management.
    * Rate limits and usage tracking.
* AI integration must be modular for all ERP modules (Sales, Purchase, Inventory, HR, Finance, Marketing).

#### FR-2: Natural Language Query (NLQ)
* A user can ask questions in plain English or Portuguese:
    * **Example:** “Show me all pending invoices in Angola for September.”
    * **Example:** “Generate a payroll summary for all sales reps with commissions realized.”
* AI interprets the query, fetches relevant data, and generates actionable results.
* Option to export AI-generated data in PDF/Excel with date/time/user.

#### FR-3: Predictive Insights & Forecasting
* **Sales Forecasting:** Predict monthly sales by product, branch, and region using historical trends.
* **Inventory Forecasting:** Predict stock-outs or overstock based on historical sales, lead times, and supplier reliability.
* **Cash Flow Prediction:** Predict future cash requirements based on receivables, payables, and expenses.
* **Customer Churn Prediction:** Identify customers likely to reduce purchases.

#### FR-4: Risk-Based Approvals
* AI evaluates high-risk transactions for:
    * Large payments.
    * Discounts exceeding thresholds.
    * Unusual expense claims.
* Flags items for managerial review automatically.

#### FR-5: Automation of Routine Tasks
* Auto-generate daily, weekly, monthly, and quarterly reports for management.
* Auto-send MIS reports via Email + WhatsApp.
* Auto-assign tasks based on a workflow (approvals, purchase orders, follow-ups).
* Auto-scheduling of inventory replenishment based on forecast and reorder levels.

#### FR-6: Smart Alerts & Notifications
* Payment overdue alerts.
* Stock below minimum alerts.
* Expiry date alerts for medicines.
* HR alerts: Leave approvals pending, upcoming birthdays, contract renewals.
* Marketing alerts: Campaign performance, competitor price changes.

#### FR-7: AI-Assisted Data Entry & OCR
* Scan invoices, receipts, and purchase orders.
* Auto-fill fields using AI OCR.
* Auto-check for errors or missing information.
* Validate batch numbers, expiry dates, and product codes for pharmaceuticals.

#### FR-8: AI-Driven Recommendations
* Suggest pricing adjustments based on competitor tracking, stock levels, and demand.
* Suggest optimal promotions for customer retention or upselling.
* Recommend recruitment, training, or salary adjustments based on performance and KPIs.
* Suggest financial optimizations like cash allocation, payment scheduling, and commission adjustments.

#### FR-9: Multi-Language Support
* AI understands English and Portuguese.
* User queries, outputs, and notifications are available in both languages.

### 2. Business Rules
* **Data Privacy:** AI can only access internal ERP data; sensitive data access is controlled by role-based permissions.
* **Approval Rule:** AI suggestions for approvals do not override human approval; they are advisory.
* **Audit Rule:** AI interactions are logged for all query executions, recommendations, and automations.
* **Backup Rule:** All AI-processed data is stored in the system backup (cloud + offline).

### 3. User Flows & Processes
**Flow 1: Natural Language Query**
1.  A user enters a query in the NLQ interface.
2.  AI interprets the intent and identifies relevant modules and data.
3.  AI fetches data → displays results in a structured table/dashboard.
4.  Option to export results in PDF/Excel.

**Flow 2: Auto-Report Generation & Distribution**
1.  A user configures the report schedule: daily, weekly, monthly, or quarterly.
2.  AI collects data from all modules: Sales, Finance, HR, Inventory, Marketing.
3.  It generates a report → sends it via Email + WhatsApp to predefined users.
4.  Reports are stored in the ERP repository for download.

**Flow 3: Predictive Stock Replenishment**
1.  AI monitors inventory levels + forecasted sales.
2.  It suggests purchase orders to maintain optimal stock.
3.  It sends an alert to the procurement manager for approval.
4.  Approved orders are auto-created in the Purchase Module.

**Flow 4: Risk-Based Approval Workflow**
1.  AI flags high-risk transactions (large discounts, unusual expenses).
2.  The transaction is sent to a Manager for review.
3.  The manager approves/rejects.
4.  AI logs the decision and adjusts future risk scoring.

### 4. Data Fields & Validations
* **Query Table:** QueryID, UserID, Timestamp, QueryText, Module, Response.
* **Prediction Table:** PredictionID, Type (Sales, Inventory, CashFlow), ForecastData, ConfidenceScore.
* **Alert Table:** AlertID, Module, Type, Priority, GeneratedAt, ResolvedStatus.
* **OCR Table:** DocumentID, Type, ExtractedFields, Validated (Yes/No).

**Validations:**
* AI cannot execute critical actions without human confirmation (e.g., approve payments).
* Only authorized roles can trigger AI automations.
* AI query responses are cross-checked with ERP data integrity.

### 5. Reports & Exports
* AI-generated dashboards and summaries for Sales, Finance, HR, Inventory, and Marketing.
* Predictive analytics reports.
* Risk evaluation reports.
* Exportable in PDF/Excel with the date, time, and exported by the user.

### 6. Security & Permissions
* **Admin:** Full AI configuration and access to all predictions.
* **Manager:** Can view AI recommendations and approve flagged transactions.
* **Staff:** Can query AI only within role-permitted modules.
* **AI logs:** All queries, actions, and recommendations are timestamped and linked to a user ID.

**Controls:**
* 2FA for executing AI-triggered actions (approvals, payments, exports).
* AI logs cannot be edited.

### 7. Backup & Restore
* Daily auto-backup of all AI interactions, predictions, logs, and query results.
* Backups are stored in the cloud + offline + emailed to predefined IDs.
* Restore rights are restricted to Admin.

### 8. AI Optimization for Token Efficiency
* Use structured queries for data retrieval.
* Reduce unnecessary verbosity in AI responses.
* Modular AI processing per module to save API usage.
* AI-assisted templates for recurring reports and workflows.