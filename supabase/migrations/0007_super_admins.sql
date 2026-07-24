-- Migration: Add platform super_admins table and update security policies
-- Created: 2026-07-24

-- 1. Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS on super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow super admins to read the super_admins table
CREATE POLICY "Allow super_admins to select super_admins"
    ON super_admins FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 4. Restaurants table policies for super admins
CREATE POLICY "Allow super_admins to insert restaurants"
    ON restaurants FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

CREATE POLICY "Allow super_admins to update restaurants"
    ON restaurants FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

CREATE POLICY "Allow super_admins to delete restaurants"
    ON restaurants FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

-- 5. Staff table policies for super admins
CREATE POLICY "Allow super_admins to select all staff"
    ON staff FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

CREATE POLICY "Allow super_admins to insert staff"
    ON staff FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

CREATE POLICY "Allow super_admins to update staff"
    ON staff FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

CREATE POLICY "Allow super_admins to delete staff"
    ON staff FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()));

-- 6. Create a view for retrieving staff details including email
CREATE OR REPLACE VIEW staff_details AS
SELECT 
    s.id,
    s.restaurant_id,
    s.role,
    s.created_at,
    u.email
FROM staff s
JOIN auth.users u ON s.id = u.id;
