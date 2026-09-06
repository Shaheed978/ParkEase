# Implementation Plan - ParkEase Smart Parking Booking Platform

Build a production-ready, full-stack Smart Parking Booking Platform (**ParkEase**) featuring real-time slot booking, dynamic pricing engine, concurrency-safe availability validation, slot hold reservation, QR-based check-in/check-out with overstay calculation, payment gateway integration (Razorpay-ready with mock simulation mode), customer dashboard, parking owner management portal, and admin administration panel.

---

## User Review Required

> [!IMPORTANT]
> **Tech Stack Selection**:
> - **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, Leaflet/React-Leaflet maps.
> - **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT Authentication with bcrypt, Zod validation, BullMQ/Redis abstraction with in-memory fallback.
> - **Database**: PostgreSQL (Prisma schema configured with SQLite fallback for instant zero-dependency local dev execution, easily switchable to PostgreSQL via `DATABASE_URL`).
> - **Monorepo Structure**: Standard workspace with `apps/api`, `apps/web`, `packages/shared`, `docker-compose.yml`, `scripts/seed.ts`.

---

## Proposed Architecture & Key Modules

### 1. Database Schema & Models (`apps/api/prisma/schema.prisma`)
- **User & Auth**: `User` (roles: `CUSTOMER`, `OWNER`, `ADMIN`), `Vehicle` (license plate, type: `FOUR_WHEELER`, `TWO_WHEELER`, `EV`, `ACCESSIBLE`), `RefreshToken`.
- **Facility & Slots**: `ParkingFacility` (name, lat, lng, address, city, rules, status: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`), `ParkingSlot` (slotNumber, floor, category: `REGULAR`, `PREMIUM`, `EV`, `ACCESSIBLE`, `TWO_WHEELER`, status: `AVAILABLE`, `MAINTENANCE`, `BLOCKED`), `FacilityAmenity`.
- **Pricing & Rules**: `ParkingPricing` (baseHourlyRate, dailyMaxRate, weekendSurgeMultiplier, peakHourMultiplier, evChargeFee, platformFeePercent).
- **Booking & Hold**: `Booking` (bookingCode, qrToken, startTime, endTime, actualEntryTime, actualExitTime, status: `PENDING`, `PAYMENT_PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `REFUNDED`), `SlotHold` (holdToken, expiresAt).
- **Payment & Refund**: `Payment` (orderId, paymentId, amount, status: `CREATED`, `SUCCESS`, `FAILED`, `REFUNDED`), `Refund` (refundId, amount, reason, status).
- **Marketing & Support**: `Coupon` (code, discountPercent, fixedDiscount, maxDiscount, minOrder, expiresAt), `CouponUsage`, `Review` (rating, cleanliness, safety, service, reviewText, ownerResponse), `Favorite`, `Notification`, `SupportTicket`, `AuditLog`.

---

### 2. Backend Modules (`apps/api/src/`)
- `auth`: Register, login, refresh token, role-based middleware (`authorize(['ADMIN', 'OWNER'])`).
- `parking`: Facility CRUD, geo-radius search (`GET /api/parking/search?lat=&lng=&radius=&vehicleType=&startTime=&endTime=`), status updates.
- `slots`: Slot management, bulk generator for owners (`POST /api/parking/:id/slots/bulk`).
- `availability`: Concurrency-safe overlap engine (`CHECK NOT OVERLAP (startTime, endTime)`), slot hold manager (10-minute hold lock).
- `pricing`: Server-side pricing calculation engine (hourly, daily cap, vehicle multiplier, peak time, coupon validation, tax, platform fee).
- `bookings`: Create booking, payment verification, QR code generator (JWT/HMAC tokenized payload), cancellation & refund policy calculator.
- `operator`: QR scanner check-in (`POST /api/operator/check-in`), check-out (`POST /api/operator/check-out`) with automated overstay fee calculation.
- `owner`: Facility dashboard metrics (GMV, occupancy rate, live bookings, slot control).
- `admin`: Facility/Owner approvals, platform commission settings, coupon management, dispute resolution, financial GMV reporting, audit log inspector.

---

### 3. Frontend Application (`apps/web/src/`)
- **Design System & Visual Identity**: Modern startup aesthetic ("ParkEase" - Slate blue & emerald green palette, glassmorphism cards, micro-interactions, dark/light theme).
- **Landing Page**: Search bar (Destination, Date, Entry/Exit time, "Use My Location"), Popular locations (MG Road, Koramangala, Indiranagar, Majestic), How it works, Features showcase.
- **Search & Map View**: Responsive 2-column view (Cards on left, Leaflet map with price markers on right, mobile List/Map toggle), Filters (EV charging, covered, 24/7, price slider, rating).
- **Facility Detail & Interactive Slot Map**: Visual slot layout (Grid of slots color-coded by state: Available, Selected, Occupied, Reserved, Held, Maintenance), facility photos, amenities, reviews, directions CTA.
- **Checkout & Payment**: Step-by-step wizard (Vehicle select, time window, slot hold countdown timer, coupon code input, breakdown breakdown summary, Razorpay checkout modal / test simulator).
- **Booking Confirmation & Ticket**: Interactive digital ticket with animated QR code, navigation link, download receipt button.
- **Customer Dashboard**: Active bookings, past bookings, saved vehicles, favorite parking spots, support tickets, notifications center.
- **Parking Owner Portal**: Overview analytics (Revenue chart, occupancy gauge), facility slot matrix builder, QR Scanner camera modal / manual QR code lookup for entry/exit gates.
- **Admin Portal**: Pending facility approvals, owner verifications, user/booking management, platform revenue reports, system audit logs.

---

### 4. DevOps, Seed Data & Quality Assurance
- **Seed Script**: Real Indian cities (Bengaluru - MG Road, Koramangala, Indiranagar, Majestic, Electronic City; Mysuru; Hyderabad) with 10+ facilities, 100+ slots, users, owners, bookings, pricing rules, reviews, coupons.
- **API Documentation**: OpenAPI 3.0 / Swagger JSON & UI at `/api-docs`.
- **Unit & Integration Tests**: Jest tests for Pricing calculations, Overlap prevention, Coupon engine, Overstay calculator.
- **Docker Setup**: `docker-compose.yml` for API, Web, Postgres, and Redis.

---

## Verification Plan

### Automated Tests
- Run unit test suite: `npm test` inside `apps/api`
- Type checking & linting across monorepo: `npm run typecheck` & `npm run lint`

### Manual End-to-End Verification Flow
1. **Customer Flow**:
   - Register customer -> Add vehicle (KA-01-MJ-1234, EV SUV)
   - Search "MG Road Bengaluru" -> Filter by EV Charging -> Select "MG Road Grand Plaza Parking"
   - Select slot A-05 -> Set time window (10:00 AM - 1:00 PM) -> See breakdown (Base ₹120 + EV fee ₹30 + Tax ₹9 - Coupon PARK50 ₹50 = Total)
   - Hold slot (10-min countdown timer) -> Proceed to checkout -> Complete payment
   - Receive confirmation & QR Code -> View in Customer Dashboard.
2. **Owner Gate Flow**:
   - Login as Owner -> Go to Gate Operator -> Scan QR / Enter Booking ID -> Mark Entry (Status becomes ACTIVE)
   - Simulate overstay -> Mark Exit -> Calculate extra charge -> Mark COMPLETED.
3. **Admin Flow**:
   - Login as Admin -> View Platform GMV & Revenue charts -> Approve new facility -> Moderation & System Audit Logs.

---
