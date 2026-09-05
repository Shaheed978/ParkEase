# ParkEase - Smart Parking Booking Platform 🚗🅿️

> **"Find. Book. Park."**  
> A production-ready, full-stack monorepo web application for real-time smart parking discovery, slot holds, dynamic pricing, QR code gate entry/exit, facility owner management, and admin platform governance.

---

## 🌟 Key Features

### 👤 Customer Features
- **Search & Discovery**: Destination, address, landmark, or current browser GPS geolocation search with radius filter.
- **Interactive Map**: Leaflet map with custom price markers, distance sorting, and map/list view toggle.
- **Visual Slot Selection**: Interactive color-coded parking grid (Available, Selected, Reserved, Occupied, Held, Maintenance).
- **Double Booking Protection**: Concurrency-safe backend overlap validation with 10-minute temporary slot holds during checkout.
- **Server Pricing Engine**: Hourly rate, daily cap, weekend surge (15%), EV charging fees, vehicle multiplier, GST (18%), platform fee (10%), and promo coupons (`PARK50`, `WELCOME20`).
- **Digital QR Ticket**: Unique encrypted QR token for gate entry scan, receipt breakdown, navigation links, and cancellation refunds.
- **Customer Dashboard**: Active reservations, booking history, vehicle plate manager, favorite spots, and support tickets.

### 🏢 Parking Owner Portal
- **Facility Management**: Register new facilities, address, geo coordinates, opening/closing hours, rules, amenities, and photos.
- **Bulk Slot Matrix Generator**: Generate 50+ slots in seconds (Regular, Premium, EV, Accessible).
- **Gate Operator QR Scanner**: Scan customer QR code or enter booking code to validate entry (`ACTIVE`) or mark exit (`COMPLETED`) with automated overstay penalty calculation.
- **Analytics & Revenue**: Today's GMV, gross earnings, occupancy gauge, and live booking matrix.

### 👑 Admin Governance Panel
- **Platform Analytics**: Total GMV, platform commission revenue (10%), user & owner counts, active vs pending facilities.
- **Facility Approvals**: Review and approve/reject/suspend parking facility listings.
- **Coupon Campaign Manager**: Create and publish promo codes with percentage/fixed discounts, minimum orders, and max caps.

---

## 🏗️ Monorepo Architecture & Folder Structure

```text
parkease-monorepo/
├── apps/
│   ├── api/                    # Express + Node.js + TypeScript REST Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   # PostgreSQL / SQLite Prisma Schema
│   │   ├── src/
│   │   │   ├── controllers/    # Auth, User, Parking, Booking, Owner, Admin, Extra
│   │   │   ├── services/       # Availability Engine, Pricing Engine
│   │   │   ├── middleware/     # JWT Auth & Role-based Authorization (RBAC)
│   │   │   ├── utils/          # Cryptographic QR Generator, Response Helper
│   │   │   ├── seed.ts         # Realistic Indian Seeding Script
│   │   │   └── server.ts       # Express Server Initialization
│   │   └── swagger.json        # OpenAPI 3.0 Specs
│   │
│   └── web/                    # Next.js 14 + React + TypeScript + Tailwind CSS Frontend
│       ├── src/
│       │   ├── app/            # App Router pages (search, parking, checkout, booking, owner, admin, dashboard)
│       │   ├── components/     # LeafletMap, SlotGrid, Navbar, Footer, QuickRoleSwitcher
│       │   └── lib/            # API Client Library
│
├── packages/
│   └── shared/                 # Shared Enums, DTOs, & Types (@parkease/shared)
│
├── docker-compose.yml          # Multi-container orchestration (API, Web, Postgres, Redis)
├── Dockerfile.api              # Dockerfile for Backend API
├── Dockerfile.web              # Dockerfile for Frontend Web
└── README.md
```

---

## ⚡ Quick Start & Setup Guide

### 1. Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher
- Docker & Docker Compose (optional for containerized setup)

### 2. Installation
Clone the repository and install dependencies in root directory:
```bash
npm install
```

### 3. Build Shared Package
```bash
npm run build --workspace=packages/shared
```

### 4. Database Setup & Seeding
By default, the project uses a zero-dependency local SQLite file (`dev.db`).
Generate Prisma Client, push schema, and populate seed data:

```bash
# Push Prisma Schema
npm run prisma:push --workspace=apps/api

# Run Seed Script (Bengaluru, Mysuru, Hyderabad data)
npm run seed --workspace=apps/api
```

### 5. Running Local Development Server
Start both Backend API (`http://localhost:5000`) and Next.js Web (`http://localhost:3000`) concurrently:

```bash
npm run dev
```

---

## 🔑 Demo Login Credentials (Seeded Data)

Use the floating **"Demo Role Switcher"** button in the bottom-right corner for 1-click login, or enter these credentials:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer** | `user@parkease.com` | `Password123` | Search, Hold Slot, Checkout, Razorpay Payment, QR Ticket, Vehicles |
| **Parking Owner** | `owner@parkease.com` | `Password123` | Gate QR Scanner, Facility Manager, Bulk Slot Generator, Occupancy |
| **Admin** | `admin@parkease.com` | `Password123` | Platform GMV, Commission Revenue, Facility Approvals, Coupon Manager |

---

## 🐳 Docker Deployment Setup

Run full stack environment with PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up --build
```

Access services:
- **Frontend Web**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`

---

## 🧪 Testing & Validation Commands

```bash
# Run unit tests
npm test

# Run TypeScript type check across monorepo
npm run typecheck

# Build production bundles
npm run build
```

---

## ⚙️ Environment Variables Reference (`.env`)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | Backend API Server Port |
| `DATABASE_URL` | `"file:./dev.db"` | PostgreSQL or SQLite Database Connection String |
| `JWT_SECRET` | `parkease_super_secret_jwt_key_2026` | Secret key for JWT signing & QR signatures |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `RAZORPAY_KEY_ID` | `rzp_test_parkease_mock_key` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `rzp_test_parkease_mock_secret` | Razorpay Key Secret |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | API Base URL for Frontend |
