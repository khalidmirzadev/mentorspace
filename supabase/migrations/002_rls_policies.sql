-- ================================================================
-- MentorSpace — Migration 002: RLS Policies
-- ================================================================
-- Admin-only access: all tables are protected
-- Role is set in auth.users.raw_user_meta_data->>'role' = 'admin'

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() IS NOT NULL AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
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

-- Rooms
CREATE POLICY "Admin full access" ON rooms FOR ALL USING (is_admin());

-- Seats
CREATE POLICY "Admin full access" ON seats FOR ALL USING (is_admin());

-- Members
CREATE POLICY "Admin full access" ON members FOR ALL USING (is_admin());

-- Member Payments
CREATE POLICY "Admin full access" ON member_payments FOR ALL USING (is_admin());

-- Payment Transactions
CREATE POLICY "Admin full access" ON payment_transactions FOR ALL USING (is_admin());

-- Staff
CREATE POLICY "Admin full access" ON staff FOR ALL USING (is_admin());

-- Staff Salaries
CREATE POLICY "Admin full access" ON staff_salaries FOR ALL USING (is_admin());

-- Staff Advances
CREATE POLICY "Admin full access" ON staff_advances FOR ALL USING (is_admin());

-- Expense Categories
CREATE POLICY "Admin full access" ON expense_categories FOR ALL USING (is_admin());

-- Expenses
CREATE POLICY "Admin full access" ON expenses FOR ALL USING (is_admin());

-- Grocery Sessions
CREATE POLICY "Admin full access" ON grocery_sessions FOR ALL USING (is_admin());

-- Grocery Items
CREATE POLICY "Admin full access" ON grocery_items FOR ALL USING (is_admin());

-- Generator Expenses
CREATE POLICY "Admin full access" ON generator_expenses FOR ALL USING (is_admin());

-- App Settings
CREATE POLICY "Admin full access" ON app_settings FOR ALL USING (is_admin());
