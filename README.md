# SBMI Enterprise E-Commerce Platform

> **Shree Bhanwal Mata Industries** — Enterprise-grade digital commerce operating system powering the **Amrit Rasoi** brand and multi-vendor marketplace ecosystem.

## Architecture

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express 4.18, MongoDB (Mongoose 8), JWT Auth |
| **Frontend** | React 19, Redux Toolkit, React Router 6, Framer Motion |
| **File Storage** | Cloudinary (with local fallback) |
| **Monorepo** | NPM Workspaces |

## Project Structure

```
├── apps/                          7 React frontend applications
│   ├── customer-web/              Customer storefront (Port 3000)
│   ├── admin-dashboard/           Admin control center (Port 3001)
│   ├── seller-portal/             Seller hub (Port 3002)
│   ├── delivery-app/              Delivery agent app (Port 3003)
│   ├── customer-mobile/           Mobile shopping (Port 3004)
│   ├── warehouse-dashboard/       Logistics hub (Port 3005)
│   └── internal-ops-panel/        Operations panel (Port 3006)
│
├── server/                        Express API server (Port 5000)
│   ├── controllers/               20 business logic controllers
│   ├── models/                    21 MongoDB schemas
│   ├── routes/                    19 route files
│   ├── middleware/                 Auth, security, upload
│   └── utils/                     Event bus, cache, queue, notifications
│
├── docs/                          Architecture & workflow documentation
├── scripts/                       Test & utility scripts
└── infrastructure/                Docker, K8s, Nginx, Terraform configs
```

## Quick Start

```bash
# Install all dependencies (all workspaces)
npm install

# Start everything (server + all 7 apps)
npm start

# Start individual services
npm run server          # API server on :5000
npm run client          # Customer web on :3000
npm run admin           # Admin dashboard on :3001
npm run seller          # Seller portal on :3002
npm run delivery        # Delivery app on :3003
npm run mobile          # Customer mobile on :3004
npm run warehouse       # Warehouse dashboard on :3005
npm run ops             # Internal ops panel on :3006
```

## Environment Setup

Copy the example environment file and fill in your values:

```bash
cp server/config/config.env.example server/config/config.env
```

Required variables:
- `PORT` — API server port (default: 5000)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRE` — Token expiry (e.g., `7d`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary credentials

## Key Features

- **18-Role RBAC System** — From Super Admin to Delivery Boy
- **Multi-Tenant Isolation** — Organization-scoped data with tenant keys
- **Amazon-Style Product Variants** — Universal variant schema (weight, color, size)
- **Order Management** — Multi-vendor splits, commissions, refunds, OTP delivery
- **Warehouse Logistics** — Multi-warehouse stock intake, transfers, audit ledger
- **Finance & Settlements** — Transaction tracking, vendor payouts, bank details
- **Event Bus** — Async audit trails, notification dispatching
- **Compliance Auditing** — Immutable audit logs with IP/User-Agent tracking

## Brand Hierarchy

- **SBMI** — Parent company / platform operator
- **Amrit Rasoi** — SBMI's flagship brand (spices & food products)
- **Partner Brands** — Third-party sellers onboarded via the collaboration system

---

*Built with ❤️ by the SBMI Engineering Team*
