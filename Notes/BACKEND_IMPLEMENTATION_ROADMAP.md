# CampusConnect — Backend & Full-Stack Implementation Roadmap

This document tracks the step-by-step backend and full-stack rollout for **CampusConnect**, starting with completing the **Resource Exchange Module** end-to-end before extending the same architecture to Accommodations, Mentorship, and Unified Senior Departures.

---

## Completed Foundation (Phase 0)

- [x] **Modular `backend/` Architecture** (`Node.js + Express + TypeScript + PostgreSQL/Supabase`)
- [x] **Relational Database Schema (`001_init_resources.sql`)**:
  - Shared anchor tables: `users`, `senior_departures`
  - Resource Exchange tables: `academic_resources`, polymorphic `reservations`
  - Performance & integrity: `B-Tree` filters, `GIN` full-text search index, partial unique index preventing double-booking, Row-Level Security (`RLS`) enabled
- [x] **Core Resource Exchange APIs (`/api/v1`)**:
  - `GET /resources` & `GET /resources/:id` (with progressive contact masking)
  - `POST /resources`, `PATCH /resources/:id`, `DELETE /resources/:id`
  - `POST /resources/estimate-price` (Fair-Price Estimator blending condition depreciation, DB history, and `+10%` notes bonus)
  - `POST /resources/:id/reserve` (ACID `SELECT ... FOR UPDATE` stock lock + 4-digit OTP generation)
  - `POST /reservations/:id/verify-otp` & `POST /reservations/:id/cancel`
- [x] **Local Tooling**: Vite `/api` & `/uploads` proxy, `start_all.bat`, `start_backend.bat`, `setup_database.bat`, `install_backend.bat`

---

## Step 1: Real Authentication & Google / Gmail Sign-In *(Completed)*

### Goal
Replace simulated header identity with persistent, cryptographically verified authentication supporting **Google / Gmail OAuth** via **Supabase Auth**, backed by real JWT verification in Express.

### Key Deliverables
- [x] **Supabase Auth + Google OAuth Integration (Frontend):**
  - Installed `@supabase/supabase-js` and created `src/lib/supabase.ts` + `src/api/authApi.ts`.
  - Upgraded `LoginModal.tsx` with a real **"Continue with Google (Gmail)"** button + email/password sign-in via Supabase Auth.
  - Persistent sessions across page reloads via `supabase.auth.onAuthStateChange`.
  - Added **First-Time Student Onboarding & Profile Edit Modal** (`OnboardingModal.tsx`) saving Role, Department, Year, and Phone Number into PostgreSQL `users`.
- [x] **Real JWT Verification in Backend (`auth.middleware.ts` & `backend/src/modules/auth/`):**
  - Verifies `Authorization: Bearer <supabase-jwt>` tokens via Supabase Auth (`/auth/v1/user`) with a 60-second TTL cache.
  - Added migration `002_auth_users_sync.sql` (`auth_user_id`, `onboarding_completed`) and `/api/v1/auth/me` + `PATCH /api/v1/auth/profile`.
- [x] **Configurable Email Domain Policy & Dev Demo Mode:**
  - `ALLOWED_EMAIL_DOMAINS` in `backend/.env` (`*` for testing with Gmail; institutional domain for production).
  - `VITE_ENABLE_DEMO_LOGIN` & `ENABLE_DEMO_AUTH` dev toggles allowing 1-click demo role switching alongside real Google login.

---

## Step 2: Dedicated Resource Publishing, "My Listings" & Cloud Image Storage *(Completed)*

### Goal
Give students a frictionless, e-commerce-grade seller experience with persistent cloud media storage.

### Key Deliverables
- [x] **Dedicated "Sell / List an Item" & Edit Modal (`PublishResourceModal.tsx`):**
  - Prominent **`+ Sell / List Item`** button directly inside the Resource Exchange section (dual-purpose for Create & Edit).
  - Instant smartphone photo upload preview, **`Price (₹)`** input (no Original Price clutter), **`Available Until`** date picker, conditional **`Has Annotations`** checkbox shown exclusively for **`Textbook`** items, and an on-demand **Estimate Fair Price** calculator.
- [x] **Cloud Media Pipeline (`backend/src/services/storage.service.ts`):**
  - Migrated `multer` to in-memory buffers streaming straight to **Supabase Storage** (`resource-images` public bucket) with permanent CDN URLs, automatic cleanup on photo replace/delete, and automatic local `backend/uploads/` fallback if `SUPABASE_SERVICE_ROLE_KEY` is not yet configured.
- [x] **"My Listings" Seller Management Dashboard (`MyListingsModal.tsx` & `GET /api/v1/resources/mine`):**
  - Live summary bar (`Available`, `Pending OTP`, `Handed Over`), status filter tabs, notification badge dot when a buyer is waiting for OTP verification, inline **Edit**, inline 2-step **Delete**, and inline **4-digit OTP verification / Release Hold**.

---

## Step 3: Shopping Cart, Multi-Item Buy / Checkout & "My Orders" *(Completed)*

### Goal
Transform single-item reservations into a complete peer-to-peer cart and checkout workflow.

### Key Deliverables
- [x] **Database Schema Expansion (`003_cart_and_orders.sql`):**
  - `cart_items` table (`user_id`, `resource_id`, `added_at`) synced to PostgreSQL so the cart persists across reloads and devices.
  - `orders` & `order_items` tables grouping multi-item checkouts (`CC-26-XXXX`) while linking each physical item to its seller-specific handover OTP in `reservations`.
- [x] **Cart Drawer & Add-to-Cart UI (`CartDrawer.tsx`, `ResourceCard.tsx`, `ResourceModal.tsx`, `Navbar.tsx`):**
  - **"Add"** / **"In Cart"** toggle on each available `ResourceCard` and **"Add to Cart"** / **"View in Cart"** inside `ResourceModal`.
  - Navbar **Cart** button with live item count badge opening the slide-over `CartDrawer` showing itemized prices, campus pickup locations, and live unavailable-item warnings.
- [x] **Atomic Multi-Item Checkout (`POST /api/v1/orders/checkout` — Option A: Pay at Campus Meetup via Cash / UPI):**
  - Runs inside a single ACID PostgreSQL transaction locking all cart items in deterministic UUID order (`SELECT ... FOR UPDATE`). If any item was claimed by another student while sitting in the cart, rolls back cleanly and flags the unavailable item.
  - Generates an order number (`CC-26-XXXX`), reserves all items, creates per-item 4-digit OTPs, unmasks seller contacts, and clears the cart atomically.
- [x] **"My Orders & Active OTPs" Dashboard (`MyOrdersModal.tsx`, `GET /api/v1/orders/mine`):**
  - Unified buyer view combining multi-item cart orders and direct single-item reservations with filter tabs (`All`, `Pending Pickup`, `Completed`, `Cancelled`), prominent 4-digit OTPs with 1-click Copy, unmasked seller phone/email, campus pickup spots, inline **Cancel Hold**, and automatic `orders.status` sync when a seller verifies OTP or cancels a hold.

---

## Step 4: Full-Platform Expansion *(Next Up)*

Once the Resource Exchange vertical slice is battle-tested, extend the exact same Auth, Storage, and ACID patterns to the remaining modules:

1. **Accommodation & Vacancy Sync Backend (`backend/src/modules/accommodations/`):**
   - `accommodations` table linked to `senior_departures` with `vacant_from` date indexing, walkthrough booking slots, and zero-brokerage lease transfer workflows.
2. **Peer Mentorship Backend (`backend/src/modules/mentorship/`):**
   - `mentor_profiles` & `mentor_slots` tables with course-matching filters and transactional 1-on-1 slot booking.
3. **Unified Senior Departure Orchestrator (`backend/src/modules/departures/`):**
   - Single transactional endpoint publishing a graduating senior's room vacancy, textbooks, and mentorship slots together as a live **Senior Handoff Bundle**.
4. **Real-Time Notifications & Peer Chat:**
   - Supabase Realtime / WebSocket alerts when a resource is reserved, an OTP is verified, or a mentor slot is booked.
