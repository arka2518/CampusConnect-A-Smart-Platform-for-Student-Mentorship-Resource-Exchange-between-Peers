Explain the technical implementation of the resource exchange module. Also explain what requirements (functional and non functional) are to be fulfilled for this module (Taking inspiration from popular e-commerce websites)

The **Resource Exchange Module (Module B)** is a peer-to-peer campus marketplace engineered to circulate textbooks, laboratory equipment, electronics, and hostel essentials directly from graduating seniors to incoming juniors at fair prices. Rather than operating as an isolated classifieds board, it is bound to the **Unified Senior Departure Hub**, meaning a senior's single graduation checklist simultaneously publishes their academic materials alongside housing vacancies and mentorship slots.

---

## 1. Technical Implementation of the Resource Exchange Module

### 1.1 Relational Data Model & Indexing (PostgreSQL / Supabase)

The module relies on two primary relational tables—`academic_resources` and `reservations`—anchored to `senior_departures` and `users` using 128-bit `UUID` primary keys and `ON DELETE CASCADE` referential integrity.

* **`academic_resources` Schema:** Stores item metadata including `title`, `category` (`Textbook`, `Lab Equipment`, `Electronics`, `Hostel Essentials`), official university `course_code` (e.g., `CS201`, `AI301`), `course_name`, `edition_details`, `condition` (`Like New`, `Gently Used`, `Annotated with Exam Notes`), `fair_price`, `original_price`, `notes_included` boolean flag, `pickup_location`, CDN `image_url`, and lifecycle `status` (`Available`, `Reserved`, `Handed Over`).


* **`reservations` Schema:** Tracks active peer claims via `buyer_id`, polymorphic `item_type` (`Resource`), `item_id`, a numeric `otp_code` (`VARCHAR(6)`), and escrow `status` (`Pending Handoff`, `Verified & Complete`, `Cancelled`).


* **Search & Query Indexing:** To keep multi-criteria filtering under 50 ms, PostgreSQL utilizes `B-Tree` indices on `course_code`, `category`, and `status`, paired with Generalized Inverted Indices (`GIN`) for full-text keyword search across titles and descriptions.


* **Row-Level Security (RLS):** Database-level RLS policies restrict `UPDATE` and `DELETE` mutations on `academic_resources` strictly to the listing's owning senior (`departure_id -> senior_id`), while exposing `otp_code` in `reservations` exclusively to the authenticated buyer and seller.



### 1.2 Backend Services & Core Pipelines

#### A. Media Upload & CDN Delivery Pipeline

When a senior lists an item (either standalone or via the 2-minute Unified Departure Handoff Hub), client-side image compression converts room and textbook photos into lightweight WebP/JPEG assets. These files, along with optional PDF course notes, are uploaded directly to **Supabase Storage (S3-compatible object storage)** and served through edge CDN caching via `image_url`.

#### B. Fair-Price Estimation Service (Python FastAPI)

To prevent both price gouging and arbitrary scrap-rate under-selling, a dedicated asynchronous **Python (FastAPI)** microservice computes a recommended fair-price band before the listing is published. It combines historical transaction pricing for the same `course_code` or `category` with condition-based depreciation weights:

```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class PriceEstimateRequest(BaseModel):
    category: str
    course_code: str
    original_price: int
    condition: str  # "Like New" | "Gently Used" | "Annotated with Exam Notes"
    notes_included: bool = False
    historical_avg_price: Optional[int] = None

CONDITION_MULTIPLIERS = {
    "Like New": 0.65,
    "Annotated with Exam Notes": 0.60,
    "Gently Used": 0.45,
}

@app.post("/api/v1/resources/estimate-price")
async def estimate_fair_price(req: PriceEstimateRequest):
    base_ratio = CONDITION_MULTIPLIERS.get(req.condition, 0.50)
    baseline = req.original_price * base_ratio

    # Blend with historical campus sale price when past records exist
    if req.historical_avg_price:
        baseline = (0.6 * baseline) + (0.4 * req.historical_avg_price)

    # Apply modest value-add premium for verified exam notes/derivations
    if req.notes_included:
        baseline *= 1.10

    recommended = round(baseline)
    return {
        "recommended_price": recommended,
        "min_fair_price": round(recommended * 0.85),
        "max_fair_price": round(recommended * 1.15),
    }

```

#### C. Atomic Reservation & OTP Escrow State Machine (Node.js / Express)

Because peer-to-peer items have a single physical unit (`quantity = 1`), reservation endpoints execute inside an ACID PostgreSQL transaction to prevent race conditions when two juniors click **Reserve** simultaneously:

1. **Lock & Transition:** The Express API acquires a row-level lock (`SELECT ... FOR UPDATE`) on the target `academic_resources` row, verifies `status = 'Available'`, and updates it to `'Reserved'`.


2. **OTP Generation & Contact Unmasking:** The server generates a short-lived numeric OTP token (e.g., `8421`), inserts a `'Pending Handoff'` record into `reservations`, and unmasks the senior's masked contact details (`+91 98765 •••••`) for the reserving junior.


3. **Real-Time Event Broadcast:** **Supabase Realtime / Socket.io** pushes an instant WebSocket notification to the senior's client and opens a peer chat thread to coordinate pickup at a public campus landmark (such as the Central Library steps).


4. **Physical Handoff Verification:** At the physical meetup, the junior shares the OTP with the senior, who submits it via `POST /api/v1/reservations/:id/verify-otp`. Upon cryptographic match, the database transitions `reservations.status` to `'Verified & Complete'` and `academic_resources.status` to `'Handed Over'`, eliminating electronic payment gateway fees and banking lock-in.



### 1.3 Frontend Client Architecture (React 18 + TypeScript + Tailwind CSS)

* **Type-Safe Domain Contracts:** Shared TypeScript interfaces (`AcademicResource`, `Reservation`) enforce compile-time alignment between API payloads and UI components.


* **Reactive Multi-Filter Discovery:** Juniors filter listings dynamically by `course_code`, `category`, `condition`, `notes_included`, and `fair_price` without full page reloads.


* **Optimistic UI Updates:** When a junior reserves a textbook, React updates the badge state immediately (`Available` $\rightarrow$ `Reserved`) and displays the generated OTP modal, using toast notifications and automatic state rollback if the API transaction fails.



---

## 2. Functional Requirements (E-Commerce Inspired)

Drawing from established e-commerce platforms (such as Amazon/Flipkart for structured catalog discovery, OLX/Rumie for hyperlocal peer classifieds, and delivery-pin protocols for physical escrow), the Resource Exchange Module must fulfill the following functional requirements:

| Req. ID | Domain Area | E-Commerce Pattern | Functional Specification |
| --- | --- | --- | --- |
| **FR-01** | **Catalog & Taxonomy** | Structured Product Categorization | Seniors must be able to create, edit, and archive listings categorized under `Textbook`, `Lab Equipment`, `Electronics`, and `Hostel Essentials`.|
| **FR-02** | **Academic Indexing** | SKU / Attribute-Based Filtering | Every listing must support official university `course_code` tagging (e.g., `CS201`), edition details, and a `notes_included` indicator so juniors can search by exact semester subjects.|
| **FR-03** | **Price Transparency** | Dynamic Price Guidance & Anchoring | The system must display both `original_price` and `fair_price`, providing automated fair-price range suggestions during listing creation to prevent price gouging or scrap-value underpricing.|
| **FR-04** | **Unified Bulk Listing** | Seller Quick-List / Bundle Wizard | Graduating seniors must be able to publish multiple textbooks and lab items in under two minutes as part of their Unified Departure Checklist.|
| **FR-05** | **Single-Unit Cart / Hold** | Inventory Reservation & Stock Lock | Juniors must be able to reserve an `Available` item, immediately locking its inventory state (`Reserved`) so other buyers cannot claim the same physical unit.|
| **FR-06** | **Physical Escrow** | OTP Delivery Confirmation | Reserving an item must generate a unique numeric OTP token that the seller validates during in-person campus exchange before marking the item `Handed Over`.|
| **FR-07** | **Buyer-Seller Messaging** | In-App Order Chat & Progressive Disclosure | Personal phone numbers must remain masked (`+91 98765 •••••`) in public feeds and unmask only after a valid reservation is created, accompanied by real-time WebSocket chat.|
| **FR-08** | **Trust & Reputation** | Verified Seller Badges & Ratings | Profiles must display university email verification badges and post-handoff transaction ratings shared across all platform modules.|
| **FR-09** | **Cohort Moderation** | Seller Onboarding & Fraud Controls | Administrators must be able to manually approve initial seed cohorts and apply visibility caps to newly registered unverified accounts to prevent spam or fake listings.|

---

## 3. Non-Functional Requirements (E-Commerce Inspired)

High-trust e-commerce systems depend on reliability, speed, and abuse prevention under bursty traffic. For CampusConnect, these translate into five non-functional requirements:

* **Performance & Low-Latency Search:** Multi-attribute search queries across course codes, categories, and price bounds must execute within **50 ms** at the PostgreSQL database layer via `B-Tree` and `GIN` indexing. Product images must be compressed and served via CDN edge caches with optimistic UI feedback on user actions.


* **Concurrency & Transactional Consistency:** Because every peer listing represents a unique physical item, reservation workflows must guarantee strict ACID isolation so concurrent buyer requests never result in duplicate OTP generation or double-booking.


* **Security, Authentication & Privacy:** Access must be restricted exclusively to verified university email domains (`@mituniversity.ac.in` / `.edu`) using domain-validated email OTP or institutional OAuth2/SSO. All API traffic must use TLS 1.3 encryption, and PostgreSQL Row-Level Security (RLS) must isolate private reservation OTPs and write permissions.


* **Seasonal Scalability & Availability:** Unlike year-round retail stores, campus marketplaces experience extreme traffic spikes during admission onboarding (**July–August**) and end-of-semester graduation (**April–May**). Stateless Node.js and FastAPI containers deployed on Vercel and Railway must scale horizontally to handle peak semester turnover windows without downtime.


* **Low-Friction Usability & Leakage Tolerance:** Because students will naturally abandon apps that add unnecessary steps over WhatsApp, listing creation must take under two minutes. Furthermore, the system must treat **discovery and verified matching** as its primary value rather than attempting to force in-app financial payments, allowing seamless offline UPI/cash settlement at the OTP-verified physical handoff.



If you'd like to build this hands-on next, we can write the complete PostgreSQL RLS policies and Node.js/Express + FastAPI boilerplate for the reservation and OTP verification endpoints.