# SBMI Platform — Project Structure

> Updated: May 2026

```
sbmi-platform/
│
├── README.md                              Project documentation
├── package.json                           Root workspace config (sbmi-platform)
├── .gitignore                             Git ignore rules
│
├── apps/                                  Frontend Applications
│   ├── customer-web/                      Customer storefront (Port 3000)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/                Reusable UI components
│   │   │   │   ├── Header.jsx             Main navigation header
│   │   │   │   ├── Footer.jsx             Site footer
│   │   │   │   ├── SearchDiscovery.jsx    Autocomplete search
│   │   │   │   └── ...
│   │   │   ├── pages/                     Route pages
│   │   │   │   ├── Home.jsx               Homepage with hero, deals, arrivals
│   │   │   │   ├── ProductDetail.jsx      Product page with variants
│   │   │   │   ├── Cart.jsx               Shopping cart
│   │   │   │   ├── Checkout.jsx           Checkout flow
│   │   │   │   ├── Orders.jsx             Order history
│   │   │   │   ├── Profile.jsx            User profile
│   │   │   │   └── ...
│   │   │   ├── redux/slices/              Redux Toolkit state (7 slices)
│   │   │   ├── context/                   React context providers
│   │   │   ├── config/                    API configuration
│   │   │   └── utils/                     Utility functions
│   │   └── package.json                   @sbmi/customer-web
│   │
│   ├── admin-dashboard/                   Admin Control Center (Port 3001)
│   │   ├── src/
│   │   │   ├── components/                Sidebar, Navbar, Notifications
│   │   │   ├── pages/                     22+ admin pages
│   │   │   │   ├── Dashboard.js           Stats & analytics
│   │   │   │   ├── Products.js            Product management
│   │   │   │   ├── Products/              Add/Edit product forms
│   │   │   │   ├── Orders.js              Order management
│   │   │   │   ├── Users.js               User management (7 groups)
│   │   │   │   ├── Finance.js             Finance & ledger
│   │   │   │   ├── VendorPayouts.js       Payout management
│   │   │   │   ├── Warehouses.js          Warehouse hub
│   │   │   │   ├── StaffManagement.js     Staff & RBAC
│   │   │   │   ├── Settings.js            Site configuration
│   │   │   │   └── ...
│   │   │   ├── config/                    API config
│   │   │   └── utils/                     API helpers
│   │   └── package.json                   @sbmi/admin-dashboard
│   │
│   ├── seller-portal/                     Seller Hub (Port 3002)
│   ├── delivery-app/                      Delivery Agent App (Port 3003)
│   ├── customer-mobile/                   Mobile Shopping (Port 3004)
│   ├── warehouse-dashboard/               Logistics Hub (Port 3005)
│   └── internal-ops-panel/                Operations Panel (Port 3006)
│
├── server/                                Express API Server (Port 5000)
│   ├── server.js                          Entry point & app bootstrap
│   ├── package.json                       @sbmi/server
│   ├── config/
│   │   ├── config.env                     Environment variables
│   │   ├── database.js                    MongoDB connection
│   │   └── cloudinary.js                  File upload config
│   ├── controllers/                       Business Logic (20 controllers)
│   │   ├── adminController.js             Dashboard, products, orders, users
│   │   ├── productController.js           Product CRUD with variants
│   │   ├── authController.js              Login, register, OTP
│   │   ├── orderController.js             Order placement
│   │   ├── warehouseController.js         Warehouse operations
│   │   ├── financeController.js           Transactions & payouts
│   │   ├── staffController.js             Staff CRUD with RBAC
│   │   ├── organizationController.js      Multi-tenant orgs
│   │   ├── analyticsController.js         Sales analytics
│   │   ├── securityController.js          Security vault
│   │   └── ...
│   ├── models/                            MongoDB Schemas (21 models)
│   │   ├── User.js                        18-role user with RBAC
│   │   ├── Product.js                     Variants, SEO, tenant scoping
│   │   ├── Order.js                       Multi-vendor splits
│   │   ├── Organization.js                Tenant/vendor profiles
│   │   ├── Warehouse.js                   Multi-location inventory
│   │   ├── Payout.js                      Settlement lifecycle
│   │   ├── AuditLog.js                    Immutable compliance trail
│   │   └── ...
│   ├── routes/                            API Routes (19 files)
│   │   ├── adminRoutes.js                 /api/v1/admin/*
│   │   ├── authRoutes.js                  /api/v1/login, /register
│   │   ├── productRoutes.js               /api/v1/products
│   │   ├── orderRoutes.js                 /api/v1/orders
│   │   ├── warehouseRoutes.js             /api/v1/warehouses
│   │   ├── financeRoutes.js               /api/v1/finance
│   │   └── ...
│   ├── middleware/                         Security & Auth
│   │   ├── auth.js                        JWT + RBAC + ABAC
│   │   ├── enterpriseAccess.js            Tenant scoping
│   │   ├── partnerScope.js                Partner catalog isolation
│   │   ├── upload.js                      Multer file handling
│   │   └── security.js                    Rate limiting, sanitization
│   └── utils/                             Shared Utilities
│       ├── eventBus.js                    Async event system
│       ├── accessControl.js               Permission matrix
│       ├── cache.js                       In-memory caching
│       └── ...
│
├── docs/                                  Documentation
│   ├── architecture.md                    Enterprise blueprint
│   ├── legacy-structure.md                Previous structure reference
│   └── project-structure.md               This file
│
├── scripts/                               Utility & Test Scripts
│   ├── verify_all_modules.js
│   ├── verify_authentication.js
│   ├── verify_rbac_isolation.js
│   └── ... (19 verification scripts)
│
└── infrastructure/                        DevOps (Scaffolded)
    ├── docker/
    ├── kubernetes/
    ├── nginx/
    ├── monitoring/
    ├── terraform/
    ├── ci-cd/
    └── deployment/
```

## Workspace Commands

| Command | Description |
|---------|-------------|
| `npm run server` | Start API server (port 5000) |
| `npm run server:dev` | Start with nodemon (hot reload) |
| `npm run client` | Start customer storefront (port 3000) |
| `npm run admin` | Start admin dashboard (port 3001) |
| `npm run seller` | Start seller portal (port 3002) |
| `npm run delivery` | Start delivery app (port 3003) |
| `npm run mobile` | Start mobile app (port 3004) |
| `npm run warehouse` | Start warehouse dashboard (port 3005) |
| `npm run ops` | Start internal ops panel (port 3006) |
| `npm start` | Start ALL services concurrently |

## Package Names

| Package | Name |
|---------|------|
| Root | `sbmi-platform` |
| Server | `@sbmi/server` |
| Customer Web | `@sbmi/customer-web` |
| Admin Dashboard | `@sbmi/admin-dashboard` |
| Seller Portal | `@sbmi/seller-portal` |
| Delivery App | `@sbmi/delivery-app` |
| Customer Mobile | `@sbmi/customer-mobile` |
| Warehouse Dashboard | `@sbmi/warehouse-dashboard` |
| Internal Ops Panel | `@sbmi/internal-ops-panel` |
