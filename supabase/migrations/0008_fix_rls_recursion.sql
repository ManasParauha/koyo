-- Migration: Fix infinite RLS recursion on super_admins table
-- Created: 2026-07-24

-- Drop the old recursive select policy
DROP POLICY IF EXISTS "Allow super_admins to select super_admins" ON super_admins;

-- Recreate it using direct auth.uid() comparison (non-recursive)
CREATE POLICY "Allow super_admins to select super_admins"
    ON super_admins FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
