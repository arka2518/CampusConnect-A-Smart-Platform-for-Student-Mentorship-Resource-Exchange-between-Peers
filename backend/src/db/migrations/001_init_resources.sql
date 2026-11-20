-- =============================================================================
-- Migration 001: Core Anchor Tables + Resource Exchange Module
-- Anchors future modules (Accommodations, Mentorship, Unified Departures)
-- to shared `users`, `senior_departures`, and polymorphic `reservations`.
-- =============================================================================

-- 1. Users (Shared across all CampusConnect modules)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Incoming Junior', 'Graduating Senior', 'Admin')),
  department VARCHAR(100) NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  phone_number VARCHAR(30),
  avatar_url VARCHAR(500),
  verified_student BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Senior Departures (Unified graduation / turnover anchor event)
CREATE TABLE IF NOT EXISTS senior_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_cycle VARCHAR(50) NOT NULL DEFAULT 'Academic Year 26-27',
  vacating_date DATE NOT NULL,
  next_destination VARCHAR(255),
  handoff_quote TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (senior_id, academic_cycle)
);

-- 3. Academic Resources (Resource Exchange Module catalog)
CREATE TABLE IF NOT EXISTS academic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id UUID NOT NULL REFERENCES senior_departures(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (
    category IN ('Textbook', 'Lab Equipment', 'Electronics', 'Study Notes', 'Hostel Essentials')
  ),
  course_code VARCHAR(50) NOT NULL,
  course_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  edition_details VARCHAR(200) NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (
    condition IN ('Like New', 'Gently Used', 'Annotated with Exam Notes')
  ),
  fair_price INT NOT NULL CHECK (fair_price >= 0),
  original_price INT NOT NULL CHECK (original_price > 0),
  notes_included BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  available_until DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (
    status IN ('Available', 'Reserved', 'Handed Over')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reservations & OTP Physical Escrow (Polymorphic — ready for Accommodation & MentorSlot)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (
    item_type IN ('Resource', 'Accommodation', 'MentorSlot')
  ),
  item_id UUID NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending Handoff' CHECK (
    status IN ('Pending Handoff', 'Verified & Complete', 'Cancelled')
  ),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexing Strategy (Target < 50ms multi-attribute discovery)
-- =============================================================================

-- B-Tree indexes for structured catalog filters
CREATE INDEX IF NOT EXISTS idx_resources_course_code ON academic_resources (course_code);
CREATE INDEX IF NOT EXISTS idx_resources_category ON academic_resources (category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON academic_resources (status);
CREATE INDEX IF NOT EXISTS idx_resources_available_until ON academic_resources (available_until);
CREATE INDEX IF NOT EXISTS idx_resources_fair_price ON academic_resources (fair_price);
CREATE INDEX IF NOT EXISTS idx_resources_seller_id ON academic_resources (seller_id);

-- GIN full-text search index across title, course code, course name, and description
CREATE INDEX IF NOT EXISTS idx_resources_fts ON academic_resources
USING GIN (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' ||
    coalesce(course_code, '') || ' ' ||
    coalesce(course_name, '') || ' ' ||
    coalesce(description, '')
  )
);

-- Reservation lookup indexes
CREATE INDEX IF NOT EXISTS idx_reservations_item ON reservations (item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer ON reservations (buyer_id);

-- Database-level race-condition guard: at most ONE pending reservation per physical item
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_reservation_per_item
  ON reservations (item_type, item_id)
  WHERE status = 'Pending Handoff';

-- =============================================================================
-- Row-Level Security (RLS) Baseline
-- Enabled on all tables so direct anon/public Supabase API access is denied by default,
-- while our backend PostgreSQL role operates securely through Express authorization.
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
