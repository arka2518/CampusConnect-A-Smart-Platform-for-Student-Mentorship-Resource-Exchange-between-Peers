-- =============================================================================
-- Migration 002: Link PostgreSQL `users` table with Supabase Auth (Google OAuth)
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing seeded demo students are already onboarded
UPDATE users
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users (auth_user_id);
