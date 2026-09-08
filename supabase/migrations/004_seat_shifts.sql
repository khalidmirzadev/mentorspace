-- ================================================================
-- MentorSpace — Migration 004: 19 Predefined Seats & Shift Plans
-- ================================================================

-- 1. Add plan_type column to members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'dedicated' 
CHECK (plan_type IN ('morning', 'evening', 'dedicated'));

-- 2. Ensure UNIQUE constraint on seat_number
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seats_seat_number_key'
  ) THEN
    ALTER TABLE seats ADD CONSTRAINT seats_seat_number_key UNIQUE (seat_number);
  END IF;
END $$;

-- 3. Pre-seed the 19 predefined physical seats
INSERT INTO seats (seat_number, description, is_active)
SELECT 
  'Seat ' || n, 
  'Shared workspace physical desk #' || n, 
  true
FROM generate_series(1, 19) n
ON CONFLICT (seat_number) DO UPDATE SET is_active = true;

-- 4. Validation function to prevent conflicting active seat assignments
CREATE OR REPLACE FUNCTION check_seat_shift_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INT;
BEGIN
  -- Only validate for active members assigned to an individual seat
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
      -- Check if seat is occupied by a dedicated member OR a member on the same shift
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

-- Trigger to run before insert or update on members
DROP TRIGGER IF EXISTS trigger_check_seat_shift_conflict ON members;
CREATE TRIGGER trigger_check_seat_shift_conflict
BEFORE INSERT OR UPDATE OF assigned_seat_id, plan_type, status, space_type ON members
FOR EACH ROW
EXECUTE FUNCTION check_seat_shift_conflict();
