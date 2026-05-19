# Digital Commerce Operating System Project Structure

This document outlines the detailed file structure and workspace boundaries of the Amrit Rasoi enterprise e-commerce platform.

## Monorepo Workspaces Layout

```
amrit-rasoi/ (Monorepo Root)
├── package.json (NPM Workspaces declaration)
├── docker-compose.yml (Enterprise horizontal scale configurations)
├── nginx.conf (API load balancer & proxy gateway)
│
├── backend/ (Express Multi-Tenant REST Server)
│   ├── config/ (Credentials & database connection)
│   ├── controllers/ (Business logic handlers)
│   │   ├── adminDashboardController.js
│   │   ├── analyticsController.js (Regression & demand velocity forecast)
│   │   ├── authController.js
│   │   ├── brandController.js
│   │   ├── orderController.js (Multi-vendor order splits)
│   │   ├── productController.js (Autocomplete & search queries)
│   │   ├── warehouseController.js (Logistics routing & OTP)
│   │   └── financeController.js (Commissions & bank settlement)
│   ├── middleware/ (Security & validation)
│   │   ├── auth.js (Authentication & Role Verification)
│   │   └── security.js (Rate limiter & Mongo Injection sanitizer)
│   ├── models/ (Tenancy-scoped MongoDB schemas)
│   │   ├── User.js (RBAC & User Details)
│   │   ├── Product.js (Variants, ratings, & slug indices)
│   │   ├── Order.js (Multi-vendor order items)
│   │   ├── Warehouse.js (Multi-location logistics hubs)
│   │   ├── InventoryLedger.js (Transfer ledgers)
│   │   ├── AuditLog.js (Audit & compliance mappings)
│   │   └── Notification.js (Alert inbox storage)
│   ├── routes/ (API routes mapping)
│   ├── utils/ (Utility subsystems)
│   │   ├── eventBus.js (Decoupled events dispatcher)
│   │   ├── queue.js (Bull queue workers & task processes)
│   │   ├── cache.js (TTL key caching manager)
│   │   └── auditLogger.js (Secure compliance log mappings)
│   ├── uploads/ (Fallback local disk storage directory)
│   └── server.js (Server entry point)
│
├── admin/ (Super Admin, Vendor Owner, & Warehouse Manager Dashboard)
│
├── frontend/ (Customer Buyer Storefront App)
│
└── scratch/ (Automated Integration Test Suite)
    ├── verify_all_modules.js (Master integration test runner)
    ├── verify_multitenancy.js (Multi-tenant database checks)
    ├── verify_commission_split.js (Commissions computation)
    ├── verify_notifications.js (Low-stock email notification trigger)
    ├── verify_logistics.js (Inventory movements)
    ├── verify_commission_payout.js (Payout lifecycle)
    ├── verify_rbac.js (Role assignment rules)
    ├── verify_authentication.js (JWT scopes)
    ├── verify_product_variants.js (Ratings and slugs)
    ├── verify_order_domain.js (Sub-orders splitting)
    ├── verify_logistics_otp.js (OTP delivery verification)
    ├── verify_background_queue.js (Asynchronous tasks processing)
    ├── verify_search_engine.js (Autocomplete & tag search queries)
    ├── verify_cache_system.js (TTL caching manager check)
    ├── verify_media_uploads.js (Cloudinary directory & filename encoding)
    ├── verify_multichannel_notifications.js (Role broadcasts & inboxes)
    ├── verify_analytics_engine.js (AI regression slope & safety stock)
    ├── verify_audit_compliance.js (Compliance audit logging)
    ├── verify_observability.js (Health endpoint system metrics check)
    ├── verify_security_rules.js (Rate limiting & injection cleaner checks)
    └── verify_scaling_indexes.js (Mongoose compound indexes verification)
```

## Micro-Services Role Mapping

* **Nginx HTTP Gateway**: Inspects incoming browser HTTP traffic, routes `/api/v1` routes to backend API node servers, `/admin` paths to management portals, and other requests to customer web fronts.
* **Express API cluster**: Horizontally scales stateless nodes that execute multi-tenant validations, record auditing, inventory adjustments, and catalog searches.
* **Redis Cache & Bull Task Broker**: Manages background asynchronous job executions and handles low-latency cache queries.
* **MongoDB Shard Cluster**: Restricts queries using shard compound indexes (`tenantId` and `organization`) to scale databases efficiently.
