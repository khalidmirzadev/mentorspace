-- ================================================================
-- MentorSpace Coworking Dashboard — Migration 001: Initial Schema
-- ================================================================

-- ─────────────────────────────────────────────
-- PHYSICAL SPACE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  capacity     INT NOT NULL DEFAULT 1,
  room_type    TEXT NOT NULL DEFAULT 'private'
                 CHECK (room_type IN ('private', 'shared', 'conference')),
  monthly_rate NUMERIC(10,2),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_number  TEXT NOT NULL,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  description  TEXT,
  monthly_rate NUMERIC(10,2),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  joining_date      DATE NOT NULL,
  leaving_date      DATE,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'left')),
  space_type        TEXT NOT NULL
                      CHECK (space_type IN ('individual_seat', 'complete_room')),
  assigned_seat_id  UUID REFERENCES seats(id) ON DELETE SET NULL,
  assigned_room_id  UUID REFERENCES rooms(id) ON DELETE SET NULL,
  monthly_amount    NUMERIC(10,2) NOT NULL,
  security_deposit  NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_refunded  BOOLEAN NOT NULL DEFAULT false,
  deposit_refund_date DATE,
  deposit_refund_amount NUMERIC(10,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_single_assignment CHECK (
    NOT (assigned_seat_id IS NOT NULL AND assigned_room_id IS NOT NULL)
  )
);

-- ─────────────────────────────────────────────
-- MONTHLY MEMBER PAYMENTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id),
  billing_month   DATE NOT NULL,         -- always 1st of month: '2025-01-01'
  amount_due      NUMERIC(10,2) NOT NULL,
  amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','partially_paid','paid','overdue')),
  due_date        DATE NOT NULL,
  payment_date    DATE,
  payment_method  TEXT
                    CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, billing_month)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES member_payments(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  paid_on         DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT
                    CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- STAFF
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT NOT NULL,
  phone          TEXT,
  joining_date   DATE NOT NULL,
  leaving_date   DATE,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'left')),
  monthly_salary NUMERIC(10,2) NOT NULL,
  role           TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_salaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          UUID NOT NULL REFERENCES staff(id),
  billing_month     DATE NOT NULL,
  base_salary       NUMERIC(10,2) NOT NULL,
  advance_deducted  NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_paid          NUMERIC(10,2) NOT NULL,
  payment_status    TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending','paid')),
  paid_on           DATE,
  payment_method    TEXT
                      CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, billing_month)
);

CREATE TABLE IF NOT EXISTS staff_advances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES staff(id),
  advance_date  DATE NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  reason        TEXT,
  amount_repaid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'outstanding'
                  CHECK (status IN ('outstanding','partially_repaid','cleared')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Computed remaining column via view (Postgres generated columns don't support subtraction easily with defaults)
CREATE OR REPLACE VIEW staff_advances_view AS
SELECT
  *,
  (amount - amount_repaid) AS remaining
FROM staff_advances;

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#6366f1',  -- for charts
  is_system  BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     INT NOT NULL REFERENCES expense_categories(id),
  expense_date    DATE NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  description     TEXT NOT NULL,
  vendor          TEXT,
  payment_method  TEXT
                    CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  receipt_url     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- GROCERY
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grocery_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  vendor       TEXT,
  total_amount NUMERIC(10,2) NOT NULL,
  notes        TEXT,
  expense_id   UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_session_id UUID NOT NULL REFERENCES grocery_sessions(id) ON DELETE CASCADE,
  item_name          TEXT NOT NULL,
  quantity           TEXT,
  unit_price         NUMERIC(10,2),
  total_price        NUMERIC(10,2) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- GENERATOR
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generator_expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date   DATE NOT NULL,
  type           TEXT NOT NULL
                   CHECK (type IN ('fuel','maintenance','repair','other')),
  fuel_liters    NUMERIC(8,2),
  cost_per_liter NUMERIC(8,2),
  total_amount   NUMERIC(10,2) NOT NULL,
  vendor         TEXT,
  description    TEXT,
  payment_method TEXT
                   CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes          TEXT,
  expense_id     UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- APP SETTINGS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER seats_updated_at BEFORE UPDATE ON seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER member_payments_updated_at BEFORE UPDATE ON member_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_salaries_updated_at BEFORE UPDATE ON staff_salaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_advances_updated_at BEFORE UPDATE ON staff_advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grocery_sessions_updated_at BEFORE UPDATE ON grocery_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER generator_expenses_updated_at BEFORE UPDATE ON generator_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
