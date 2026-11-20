# CampusConnect Backend API

Node.js + Express + TypeScript backend connected to **Supabase PostgreSQL**.

## Quick Setup (3 Steps)

1. **Install dependencies:**
   Run `install_backend.bat` from the project root (or `npm.cmd install` inside `backend/`).
2. **Configure environment:**
   Copy `.env.example` to `.env` inside `backend/` and paste your Supabase **Session Pooler** URI into `DATABASE_URL`.
3. **Create tables & seed initial data:**
   Run `setup_database.bat` from the project root (or `npm.cmd run db:setup` inside `backend/`).
4. **Start the backend server:**
   Run `start_backend.bat` from the project root (or `npm.cmd run dev` inside `backend/`).

The server runs on `http://localhost:4000` and Vite proxies `/api` and `/uploads` automatically.

---

## Resource Exchange API Endpoints (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Checks API & live Supabase PostgreSQL connectivity. |
| `GET` | `/api/v1/resources` | Lists resources with multi-attribute filters (`search`, `category`, `course_code`, `condition`, `notes_included`, `max_price`, `status`). |
| `GET` | `/api/v1/resources/:id` | Gets resource detail + active reservation state (unmasks seller contact for buyer/seller only). |
| `POST` | `/api/v1/resources` | Creates a new listing (supports `multipart/form-data` image upload via `imageFile`). |
| `PATCH` | `/api/v1/resources/:id` | Updates a listing (owner only). |
| `DELETE` | `/api/v1/resources/:id` | Deletes an unreserved listing (owner only). |
| `POST` | `/api/v1/resources/estimate-price` | Computes fair peer price band blending condition depreciation, historical DB averages, and `+10%` notes bonus. |
| `POST` | `/api/v1/resources/:id/reserve` | ACID transactional lock (`SELECT ... FOR UPDATE`), generates 4-digit OTP, creates `Pending Handoff` reservation. |
| `POST` | `/api/v1/reservations/:id/verify-otp` | Seller verifies buyer's OTP at campus pickup → transitions resource to `Handed Over`. |
| `POST` | `/api/v1/reservations/:id/cancel` | Cancels a pending reservation and restores resource to `Available`. |
