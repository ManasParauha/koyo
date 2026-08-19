-- Migration: Expand staff table role constraint to support 3 restaurant roles (owner, manager, kitchen)
-- Created: 2026-08-19

-- 1. Migrate existing staff records with legacy role 'staff' to 'kitchen'
UPDATE staff SET role = 'kitchen' WHERE role = 'staff';

-- 2. Safety check to verify no incompatible custom roles exist prior to updating constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM staff 
        WHERE role NOT IN ('owner', 'manager', 'kitchen')
    ) THEN
        RAISE EXCEPTION 'Found unexpected role in staff table before updating constraint';
    END IF;
END $$;

-- 3. Drop existing role constraint and add updated constraint supporting the 3 restaurant roles
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

ALTER TABLE staff ADD CONSTRAINT staff_role_check 
    CHECK (role IN ('owner', 'manager', 'kitchen'));

-- 4. Re-verify staff_details view definition
CREATE OR REPLACE VIEW staff_details AS
SELECT 
    s.id,
    s.restaurant_id,
    s.role,
    s.created_at,
    u.email
FROM staff s
JOIN auth.users u ON s.id = u.id;
