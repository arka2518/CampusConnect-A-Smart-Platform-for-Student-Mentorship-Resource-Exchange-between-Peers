-- =============================================================================
-- Migration 003: Shopping Cart & Multi-Item Orders (Pay at Campus Meetup Escrow)
-- Links multi-item orders directly to the polymorphic `reservations` table so
-- existing Seller OTP verification works seamlessly for both single & cart orders.
-- =============================================================================

-- 1. Persistent Shopping Cart
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items (user_id);

-- 2. Orders Header Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(32) UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount INT NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(80) NOT NULL DEFAULT 'Pay at Campus Meetup (UPI / Cash)',
  status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (
    status IN ('Active', 'Partially Completed', 'Completed', 'Cancelled')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id, created_at DESC);

-- 3. Order Line Items (each linked 1:1 with its OTP escrow reservation)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  price_at_purchase INT NOT NULL CHECK (price_at_purchase >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_reservation_id ON order_items (reservation_id);

-- Row-Level Security baseline (consistent with Migrations 001 & 002)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
