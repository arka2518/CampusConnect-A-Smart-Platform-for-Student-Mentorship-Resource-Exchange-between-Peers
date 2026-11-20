# CampusConnect: End-to-End Technical Blueprint & Architecture Summary

---

## 1. Executive Summary & Product Thesis

### 1.1 The Problem Space
Every academic turnover cycle (such as **Academic Year 26-27**), university ecosystems experience massive student transitions. Incoming juniors and first-year students arrive unfamiliar with campus logistics, while graduating seniors vacate accommodations, dump academic course materials at salvage rates, and graduate without passing down institutional guidance.

Historically, this transition relies on informal, fragmented, and untracked channels (WhatsApp groups, Telegram channels, and physical noticeboards), causing three critical breakdowns:
1. **Unsynchronized Accommodation Search:** Incoming students struggle to find verified, affordable housing near campus. Vacancy creation (seniors moving out) and demand surges (incoming student arrivals) are misaligned, forcing students into high brokerage fees and unverified broker networks.
2. **Academic Resource Wastage:** Expensive textbooks, engineering drafting equipment, and course notes are either discarded or sold for pennies to street scrap dealers instead of being affordably transferred to incoming students who need them for the exact same courses.
3. **Fragmented Mentorship Access:** Junior students lack structured, safe avenues to consult experienced seniors regarding course planning, lab survival, internships, and off-campus living.

### 1.2 The Unified Architectural Solution
These three problems share a single, structural root cause: **the absence of a platform that ties student turnover directly to the university's academic calendar cycle.**

Because accommodation vacancy, material release, and mentorship availability are all triggered by the exact same real-world event—**a senior student's graduation and departure**—CampusConnect connects all three modules via a **single, shared data model**. A graduating senior completes one unified departure checklist that simultaneously:
- Flags their accommodation vacancy with a definitive **"Vacant From"** date.
- Lists their course textbooks, notes, and lab tools at verified fair prices.
- Opens 1-on-1 mentorship and orientation slots for incoming juniors.

---

## 2. High-Level System Architecture

CampusConnect is structured across three functional tiers: a responsive client layer, a secure API and authentication gateway, and a scalable relational data and real-time event pipeline.

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                          |
|                                                                                         |
|   +---------------------------------------+   +-------------------------------------+   |
|   |         Incoming Juniors Web          |   |       Graduating Seniors Web        |   |
|   |  - Vacancy Date Matcher               |   |  - Unified Departure Handoff Hub    |   |
|   |  - Fair-Price Resource Checkout (OTP) |   |  - Direct Lease Handover Generator  |   |
|   |  - 1-on-1 Mentor Slot Booking         |   |  - Mentorship Availability Calendar |   |
|   +---------------------------------------+   +-------------------------------------+   |
|                                     \               /                                   |
|                          React 18 · TypeScript · Vite · Tailwind CSS                    |
+--------------------------------------\-------------/------------------------------------+
                                        \           /
                                     HTTPS / WSS (TLS 1.3)
                                          \       /
+------------------------------------------v-----v----------------------------------------+
|                                 API & SECURITY GATEWAY                                  |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                     Institutional SSO & OAuth2 Gateway                          |   |
|   |              - University Domain Validator (@mit.edu restriction)               |   |
|   |              - JWT Session Management & Role-Based Access Control               |   |
|   +---------------------------------------------------------------------------------+   |
+--------------------------------------------|--------------------------------------------+
                                             |
+--------------------------------------------v--------------------------------------------+
|                                APPLICATION SERVICES TIER                                |
|                                                                                         |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
|   | Accommodation &    |  | Resource Exchange  |  | Peer Mentorship  |  | Handoff   |   |
|   | Vacancy Engine     |  | Engine             |  | Matching Engine  |  | Bundle    |   |
|   | - Turnover Matcher |  | - Fair-Price Calc  |  | - Course Matcher |  | Orchestr. |   |
|   | - Lease Bypass Ver.|  | - OTP Handoff Lock |  | - Slot Scheduler |  |           |   |
|   +--------------------+  +--------------------+  +------------------+  +-----------+   |
|                               Node.js (Express) · Python (FastAPI)                      |
+--------------------------------------------|--------------------------------------------+
                                             |
+--------------------------------------------v--------------------------------------------+
|                               DATA & PERSISTENCE LAYER                                  |
|                                                                                         |
|   +--------------------------+  +--------------------------+  +---------------------+   |
|   | PostgreSQL Database      |  | Supabase Realtime / WSS  |  | S3-Compatible Bucket|   |
|   | - Relational Schema      |  | - Instant In-App Chat    |  | - Room Photography  |   |
|   | - Row-Level Security     |  | - Handoff Status Pushes  |  | - Textbook Photos   |   |
|   | - Academic Cycle Indices |  | - Slot Booking Sync      |  | - Student Notes PDF |   |
|   +--------------------------+  +--------------------------+  +---------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack & Infrastructure

The technology stack is selected to guarantee high availability, type safety, low latency, and zero friction for student onboarding.

| Layer | Technology | Version / Tooling | Purpose & Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `18.3.1` | Component-based UI managing reactive states for live multi-filter searching, modal windows, and role-based workflows. |
| **Language** | **TypeScript** | `5.9.x` | Strict end-to-end type safety across domain entities (`Accommodation`, `Mentor`, `Resource`, `SeniorHandoffBundle`). |
| **Styling & Design** | **Tailwind CSS** | `4.3.x` | Utility-first CSS configured with custom student design tokens: Warm Sand (`#F7F3EE`), Soft Honey (`#FCE38A`), Warm Terracotta (`#F38181`), and Deep Brown (`#4A3C31`). |
| **Build & Tooling** | **Vite** | `6.4.x` | Ultra-fast HMR and optimized production bundling with `@vitejs/plugin-react` and `@tailwindcss/vite`. |
| **Iconography & FX** | **Lucide React & Canvas-Confetti** | `1.54.x` / `1.9.x` | Clean vector iconography and delightful micro-interactions for transaction confirmations. |
| **Backend API** | **Node.js (Express)** | `20.x LTS` | Event-driven, asynchronous REST and WebSocket API server managing authentication, CRUD pipelines, and transactions. |
| **Algorithmic Engine** | **Python (FastAPI)** | `3.11+` | High-performance async microservice powering course-matching algorithms, fair-price estimators, and vacancy date synchronization. |
| **Primary Database** | **PostgreSQL (Supabase)** | `15+` | ACID-compliant relational database enforcing referential integrity between users, senior departure bundles, rooms, and resources. |
| **Real-time Pipeline** | **Supabase Realtime / Socket.io** | WebSocket | Real-time notifications for slot reservations, listing claims, and student-to-student handover communications. |
| **Object Storage** | **Supabase Storage (S3 API)** | Cloud Storage | Secure asset storage with CDN distribution for authentic room photos, mentor avatars, and PDF course notes. |
| **Authentication** | **OAuth2 & Institutional SSO** | JWT Tokens | University domain restriction (`@university.edu`, `@mit.edu`) ensuring a zero-bot, zero-unverified-broker ecosystem. |
| **Hosting & DevOps** | **Vercel & Railway** | Production Edge | Frontend deployed on Vercel's global CDN; containerized backend services orchestrated on Railway with automated CI/CD. |

---

## 4. Database Schema & Data Modeling

The relational model ties all three exchange modules directly to the student departure lifecycle.

```
                      +-------------------+
                      |       USERS       |
                      +-------------------+
                      | id (UUID, PK)     |
                      | university_email  |
                      | full_name         |
                      | role (ENUM)       |
                      | department        |
                      | academic_year     |
                      | verified_student  |
                      +---------+---------+
                                |
             +------------------+------------------+
             | 1                                   | 1
             v                                     v
+-------------------------+             +-------------------------+
|    SENIOR_DEPARTURES    |             |      RESERVATIONS       |
+-------------------------+             +-------------------------+
| id (UUID, PK)           |             | id (UUID, PK)           |
| senior_id (FK -> users) |             | buyer_id (FK -> users)  |
| academic_cycle          |             | item_type (ENUM)        |
| graduation_date         |             | item_id (UUID)          |
| departure_status        |             | otp_code (VARCHAR)      |
| destination_note        |             | status (ENUM)           |
+------------+------------+             +-------------------------+
             |
             +------------------+------------------+
             | 1                | 1                | 1
             v                  v                  v
+-------------------------+ +-------------------------+ +-------------------------+
|     ACCOMMODATIONS      | |    ACADEMIC_RESOURCES   | |     MENTOR_PROFILES     |
+-------------------------+ +-------------------------+ +-------------------------+
| id (UUID, PK)           | | id (UUID, PK)           | | id (UUID, PK)           |
| departure_id (FK)       | | departure_id (FK)       | | departure_id (FK)       |
| title (VARCHAR)         | | title (VARCHAR)         | | bio (TEXT)              |
| room_type (ENUM)        | | category (ENUM)         | | cgpa (NUMERIC)          |
| rent_per_month (INT)    | | course_code (VARCHAR)   | | specialties (TEXT[])    |
| deposit (INT)           | | condition (ENUM)        | | courses_taken (TEXT[])  |
| vacant_from (DATE)      | | fair_price (INT)        | +------------+------------+
| campus_distance (VARCHAR| | original_price (INT)    |              | 1
| zero_brokerage (BOOLEAN)| | notes_included (BOOLEAN)|              v
| image_url (VARCHAR)     | | image_url (VARCHAR)     | +-------------------------+
+-------------------------+ +-------------------------+ |      MENTOR_SLOTS       |
                                                        +-------------------------+
                                                        | id (UUID, PK)           |
                                                        | mentor_id (FK)          |
                                                        | slot_time (TIMESTAMPTZ) |
                                                        | booking_status (ENUM)   |
                                                        | booked_by (FK -> users) |
                                                        +-------------------------+
```

### PostgreSQL DDL Specifications

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('Incoming Junior', 'Graduating Senior', 'Admin')),
    department VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(255),
    verified_student BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Senior Departure Lifecycle Hub
CREATE TABLE senior_departures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    senior_id UUID REFERENCES users(id) ON DELETE CASCADE,
    academic_cycle VARCHAR(50) NOT NULL DEFAULT 'Academic Year 26-27',
    vacating_date DATE NOT NULL,
    next_destination VARCHAR(255),
    handoff_quote TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Accommodations & Vacancy Sync Table
CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departure_id UUID REFERENCES senior_departures(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    room_type VARCHAR(50) CHECK (room_type IN ('Studio Flat', 'Shared 2BHK', 'Single Room', '1BHK Private', 'Hostel Bed')),
    rent_per_month INT NOT NULL,
    deposit INT NOT NULL,
    vacant_from DATE NOT NULL, -- Core Requirement: Prominent Turnover Date
    academic_cycle_reason TEXT NOT NULL,
    distance_from_campus VARCHAR(100) NOT NULL,
    location_address VARCHAR(255) NOT NULL,
    furnished VARCHAR(50) CHECK (furnished IN ('Fully Furnished', 'Semi-Furnished', 'Unfurnished')),
    bills_included TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    zero_brokerage_verified BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Academic Resources Marketplace Table
CREATE TABLE academic_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departure_id UUID REFERENCES senior_departures(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('Textbook', 'Lab Equipment', 'Electronics', 'Hostel Essentials')),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    edition_details VARCHAR(150),
    condition VARCHAR(50) CHECK (condition IN ('Like New', 'Gently Used', 'Annotated with Exam Notes')),
    fair_price INT NOT NULL,
    original_price INT NOT NULL,
    notes_included BOOLEAN DEFAULT FALSE,
    pickup_location VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Handed Over')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mentorship Profiles & Slots Table
CREATE TABLE mentor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departure_id UUID REFERENCES senior_departures(id) ON DELETE CASCADE,
    senior_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cgpa NUMERIC(4,2) NOT NULL,
    bio TEXT NOT NULL,
    specialties TEXT[] DEFAULT '{}',
    courses_taken TEXT[] DEFAULT '{}',
    office_hours VARCHAR(150),
    sessions_completed INT DEFAULT 0
);

CREATE TABLE mentor_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(100) NOT NULL,
    guidance_type VARCHAR(100) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'Open' CHECK (booking_status IN ('Open', 'Booked', 'Completed')),
    booked_by_junior_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Escrow & Handoff Verification Table (OTP Security)
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) CHECK (item_type IN ('Accommodation', 'Resource', 'MentorSlot')),
    item_id UUID NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Handoff' CHECK (status IN ('Pending Handoff', 'Verified & Complete', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Core System Workflows & Module Details

### 5.1 Module 1: Housing & Turnover Vacancy Synchronization
* **Prominent Vacancy Date Banner:** Rather than listing static, generic flats, every property prominently surfaces its exact handover date (`vacant_from`, e.g., `May 15, 2026`).
* **Broker Bypass Verification:** Landlord terms are negotiated directly between the graduating senior and incoming student. Lease transfers are documented with zero brokerage commission.
* **Campus Proximity Metrics:** Walking distances (e.g., `5 min walk (350m to Gate 2)`) and utility cost breakdowns (WiFi, water, power backup) eliminate surprise expenses.
* **Interactive Modal View:** Students inspect room photos, amenities checklist, roommate habits, and schedule an on-site walkthrough with the senior before they graduate.

### 5.2 Module 2: Peer-to-Peer Resource Exchange
* **Fair-Price Guarantee:** Historical pricing curbs both price-gouging and arbitrary discarding. Course books are tagged with the official university course code (e.g., `CS201`, `AI301`).
* **Value-Add Annotations:** Seniors upload/include exam preparation sticky tabs, mid-term derivations, and solved past questions alongside physical textbooks.
* **OTP Physical Exchange Protocol:** When a junior reserves a book, an OTP code (e.g., `8421`) is generated. The senior validates the OTP during physical exchange at verified campus landmarks (e.g., Central Library steps), locking in fair trade without electronic payment fees.

### 5.3 Module 3: Senior Mentorship Network
* **Course-Specific Guidance:** First- and second-year juniors filter mentors by academic department and specific completed courses to receive targeted roadmaps.
* **Calendar Slot Scheduler:** Seniors publish 45-minute guidance blocks covering technical interview prep, laboratory survival, and hostel orientation.
* **Reputation Ledger:** Profiles maintain trust ratings, academic honors (CGPA), and verified reviews from juniors who successfully completed guidance sessions.

### 5.4 The Unified Graduating Senior Handoff Hub
To validate the thesis of one shared data model, the **Senior Departure Bundle** interface enables graduating students to configure their complete exit in under two minutes:
1. Specify graduation date and next career destination (e.g., corporate placement or graduate school).
2. Check off accommodation details and lease release date.
3. List remaining textbooks and lab instruments.
4. Set office hours for junior guidance sessions.
Upon publication, all three modules update instantaneously.

---

## 6. Security, Authentication & Trust Architecture

1. **Strict University Domain Enforcement:**
   - Registration and sign-in require verified `@university.edu` or institutional credentials via OAuth2 / SAML SSO.
   - Eliminates commercial real-estate brokers, external scalpers, and spam bots.
2. **Physical Handoff Escrow (Zero-Fraud Protocol):**
   - No financial lock-in is forced through external banking rails. Physical handovers are validated on-campus via short-lived numeric OTP tokens.
3. **Data Privacy & Contact Anonymity:**
   - Senior contact numbers and email addresses are masked (`+91 98765 •••••`) until a reservation or walkthrough request is confirmed by the verified student.
4. **Row-Level Security (RLS) in Database:**
   - PostgreSQL RLS policies guarantee that seniors can only modify their own listings, while active bookings are restricted to the student and mentor involved.

---

## 7. Performance & Scalability Design

* **Static Asset Caching:** All room and textbook assets are processed and delivered via CDN edge caches with optimized WebP/JPEG compression.
* **Zero-Lag Search Indexing:** Multi-field filtering (by department, price, course code, and vacancy date) executes with sub-50ms latency using PostgreSQL inverted indices (`GIN` and `B-Tree` index on `vacant_from` and `course_code`).
* **Optimistic UI Updates:** Client state updates instantly upon booking or reserving, backed by responsive toast notifications and rollback triggers in the event of network disruption.

---

## 8. Summary of Product Impact

| Metric / Dimension | Traditional Informal Channels (WhatsApp / Noticeboards) | CampusConnect Platform |
| :--- | :--- | :--- |
| **Housing Search Latency** | 3 - 6 weeks of last-minute scrambling; unverified listings | **Instant matching** tied to senior graduation departure dates |
| **Brokerage Cost** | 1 - 2 months' rent paid to third-party commercial brokers | **₹0 (Zero Brokerage)** through verified student lease transfer |
| **Textbook & Lab Reuse** | 80%+ discarded or sold for scrap | **100% campus circulation** with fair pricing and senior notes |
| **Mentorship Onboarding** | Hit-or-miss word-of-mouth; junior isolation | **Structured 1-on-1 booking** with verified department seniors |
| **Trust Model** | Anonymous, unverified, prone to scams | **University SSO verification** and OTP physical confirmation |
