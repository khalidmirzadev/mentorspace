-- ================================================================
-- MentorSpace — Migration 003: Seed Data
-- ================================================================

-- Expense categories (system defaults)
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

-- App settings
INSERT INTO app_settings (key, value, label) VALUES
  ('payment_due_day_start',  '1',           'Payment Due Day (Start)'),
  ('payment_due_day_end',    '5',           'Payment Due Day (End)'),
  ('currency',               'PKR',         'Currency Code'),
  ('currency_symbol',        'Rs.',         'Currency Symbol'),
  ('space_name',             'MentorSpace', 'Space Name'),
  ('overdue_auto_mark',      'true',        'Auto-mark overdue after due date')
ON CONFLICT (key) DO NOTHING;

-- 19 Predefined Shared Space Physical Seats
INSERT INTO seats (seat_number, description, is_active)
SELECT 
  'Seat ' || n, 
  'Shared workspace physical desk #' || n, 
  true
FROM generate_series(1, 19) n
ON CONFLICT (seat_number) DO NOTHING;
