# 🚀 Amrit Rasoi Infrastructure & Deployment Guide

This guide details how to deploy and operate the Amrit Rasoi e-commerce workspace.

## 📁 Repository Structure

```
├── apps/
│   ├── customer-web/           # Storefront Web Portal (Port: 3001)
│   ├── admin-dashboard/        # Management Console (Port: 3000)
│   ├── seller-portal/          # Merchant Dashboard (Port: 3002)
│   ├── warehouse-dashboard/    # Logistics Dashboard (Port: 3003)
│   ├── delivery-app/           # Delivery Executive App (Port: 3004)
│   ├── customer-mobile/        # Customer Mobile Store (Port: 3005)
│   └── internal-ops-panel/     # Staff Compliance Console (Port: 3006)
├── backend/
│   └── api-gateway/            # Microservices API Gateway (Port: 5000)
└── infrastructure/
    ├── ci-cd/                  # Continuous Integration pipelines
    ├── kubernetes/             # Production K8s cluster manifests
    ├── terraform/              # AWS cloud IaC configurations
    ├── monitoring/             # Prometheus / Grafana observability
    └── deployment/             # Deployment utility runner
```

## 🛠️ Local Development Setup

To run all apps simultaneously in developer hot-reloading mode, run:
```bash
npm install
npm start
```

Or run individual apps:
* **Admin Dashboard**: `npm run admin`
* **Seller Portal**: `npm run seller`
* **Warehouse Hub**: `npm run warehouse`
* **Delivery App**: `npm run delivery`
* **Customer Mobile**: `npm run mobile`
* **Internal Ops Panel**: `npm run ops`

## 🐳 Docker Deployment

To launch the containerized microservices stack:
```bash
bash infrastructure/deployment/deploy.sh
```

This starts:
1. NGINX Reverse Proxy Gateway on port `80`
2. Primary and secondary backend API instances
3. Celery/Redis background task queues
4. MongoDB replica nodes
