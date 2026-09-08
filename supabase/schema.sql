-- ================================================================
-- MentorSpace Management Dashboard — Complete Master Database Schema
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Authenticated user in single-admin setup has full admin rights
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────
-- 2. PHYSICAL WORKSPACE (ROOMS & SEATS)
-- ────────────────────────────────────────────────────────────────

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
  seat_number  TEXT NOT NULL UNIQUE,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  description  TEXT,
  monthly_rate NUMERIC(10,2),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- 3. MEMBERS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             TEXT NOT NULL,
  phone                 TEXT,
  email                 TEXT,
  joining_date          DATE NOT NULL,
  leaving_date          DATE,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'left')),
  space_type            TEXT NOT NULL
                          CHECK (space_type IN ('individual_seat', 'complete_room')),
  plan_type             TEXT DEFAULT 'dedicated'
                          CHECK (plan_type IN ('morning', 'evening', 'dedicated')),
  assigned_seat_id      UUID REFERENCES seats(id) ON DELETE SET NULL,
  assigned_room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  monthly_amount        NUMERIC(10,2) NOT NULL,
  security_deposit      NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_refunded      BOOLEAN NOT NULL DEFAULT false,
  deposit_refund_date   DATE,
  deposit_refund_amount NUMERIC(10,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_single_assignment CHECK (
    NOT (assigned_seat_id IS NOT NULL AND assigned_room_id IS NOT NULL)
  )
);

-- Validation Trigger: Prevent Conflicting Active Seat Assignments
CREATE OR REPLACE FUNCTION check_seat_shift_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INT;
BEGIN
  IF NEW.status = 'active' AND NEW.space_type = 'individual_seat' AND NEW.assigned_seat_id IS NOT NULL THEN
    
    -- If assigning as 'dedicated', no other active member can occupy this seat
    IF NEW.plan_type = 'dedicated' THEN
      SELECT COUNT(*) INTO conflict_count
      FROM members
      WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND assigned_seat_id = NEW.assigned_seat_id
        AND status = 'active';

      IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Seat is already occupied and cannot be assigned for Dedicated (24H) access.';
      END IF;

    -- If assigning as 'morning' or 'evening'
    ELSE
      SELECT COUNT(*) INTO conflict_count
      FROM members
      WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND assigned_seat_id = NEW.assigned_seat_id
        AND status = 'active'
        AND (plan_type = 'dedicated' OR plan_type = NEW.plan_type);

      IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Seat is already occupied for the % shift or occupied full-time.', NEW.plan_type;
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_seat_shift_conflict ON members;
CREATE TRIGGER trigger_check_seat_shift_conflict
BEFORE INSERT OR UPDATE OF assigned_seat_id, plan_type, status, space_type ON members
FOR EACH ROW
EXECUTE FUNCTION check_seat_shift_conflict();

-- ────────────────────────────────────────────────────────────────
-- 4. MONTHLY MEMBER PAYMENTS & TRANSACTIONS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
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
  CONSTRAINT uq_member_billing_month UNIQUE (member_id, billing_month)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id     UUID NOT NULL REFERENCES member_payments(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  paid_on        DATE NOT NULL,
  payment_method TEXT
                   CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- 5. STAFF, SALARIES & ADVANCES
-- ────────────────────────────────────────────────────────────────

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
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  billing_month    DATE NOT NULL,
  base_salary      NUMERIC(10,2) NOT NULL,
  advance_deducted NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_paid         NUMERIC(10,2) NOT NULL,
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid')),
  paid_on          DATE,
  payment_method   TEXT
                     CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_billing_month UNIQUE (staff_id, billing_month)
);

CREATE TABLE IF NOT EXISTS staff_advances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
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

-- ────────────────────────────────────────────────────────────────
-- 6. EXPENSES, CATEGORIES, GROCERY & GENERATOR
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#64748b',
  is_system  BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    INT REFERENCES expense_categories(id) ON DELETE SET NULL,
  expense_date   DATE NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  description    TEXT NOT NULL,
  vendor         TEXT,
  payment_method TEXT
                   CHECK (payment_method IN ('cash','bank_transfer','cheque','online') OR payment_method IS NULL),
  receipt_url    TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS generator_expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date   DATE NOT NULL,
  type           TEXT NOT NULL DEFAULT 'fuel'
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

-- ────────────────────────────────────────────────────────────────
-- 7. APP SETTINGS
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────
-- 8. INDEXES FOR PERFORMANCE
-- ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_assigned_seat ON members(assigned_seat_id);
CREATE INDEX IF NOT EXISTS idx_members_assigned_room ON members(assigned_room_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_month ON member_payments(billing_month);
CREATE INDEX IF NOT EXISTS idx_member_payments_status ON member_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_month ON staff_salaries(billing_month);
CREATE INDEX IF NOT EXISTS idx_staff_advances_staff ON staff_advances(staff_id);

-- ────────────────────────────────────────────────────────────────
-- 9. UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────────

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER seats_updated_at BEFORE UPDATE ON seats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER member_payments_updated_at BEFORE UPDATE ON member_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER staff_salaries_updated_at BEFORE UPDATE ON staff_salaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER staff_advances_updated_at BEFORE UPDATE ON staff_advances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER grocery_sessions_updated_at BEFORE UPDATE ON grocery_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER generator_expenses_updated_at BEFORE UPDATE ON generator_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────────

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generator_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON rooms FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON seats FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON members FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON member_payments FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON payment_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON staff FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON staff_salaries FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON staff_advances FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON expense_categories FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON expenses FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON grocery_sessions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON grocery_items FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON generator_expenses FOR ALL USING (is_admin());
CREATE POLICY "Admin full access" ON app_settings FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────────────
-- 11. DEFAULT SEED DATA
-- ────────────────────────────────────────────────────────────────

-- 1. System Expense Categories
INSERT INTO expense_categories (name, slug, color, is_system, sort_order) VALUES
  ('Electricity',           'electricity',           '#f59e0b', true,  1),
  ('Water',                 'water',                 '#3b82f6', true,  2),
  ('Internet',              'internet',              '#8b5cf6', true,  3),
  ('Gas',                   'gas',                   '#ef4444', true,  4),
  ('Generator Fuel',        'generator_fuel',        '#f97316', true,  5),
  ('Generator Maintenance', 'generator_maintenance', '#84cc16', true,  6),
  ('Grocery',               'grocery',               '#22c55e', true,  7),
  ('Salaries',              'salaries',              '#06b6d4', true,  8),
  ('Repairs',               'repairs',               '#ec4899', true,  9),
  ('Cleaning',              'cleaning',              '#a78bfa', true, 10),
  ('Office Supplies',       'office_supplies',       '#fb923c', true, 11),
  ('Rent',                  'rent',                  '#64748b', true, 12),
  ('Miscellaneous',         'miscellaneous',         '#94a3b8', true, 13)
ON CONFLICT (slug) DO NOTHING;

-- 2. App Settings
INSERT INTO app_settings (key, value, label) VALUES
  ('payment_due_day_start',  '1',           'Payment Due Day (Start)'),
  ('payment_due_day_end',    '5',           'Payment Due Day (End)'),
  ('currency',               'PKR',         'Currency Code'),
  ('currency_symbol',        'Rs.',         'Currency Symbol'),
  ('space_name',             'MentorSpace', 'Space Name'),
  ('overdue_auto_mark',      'true',        'Auto-mark overdue after due date')
ON CONFLICT (key) DO NOTHING;

-- 3. 19 Predefined Shared Space Physical Desks
INSERT INTO seats (seat_number, description, is_active)
SELECT 
  'Seat ' || n, 
  'Shared workspace physical desk #' || n, 
  true
FROM generate_series(1, 19) n
ON CONFLICT (seat_number) DO NOTHING;
