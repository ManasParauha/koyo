-- Migration: Configure Row Level Security (RLS) policies for tables table and staff deletes
-- Created: 2026-07-24

-- 1. Enable RLS Policies on tables table for authenticated staff members
CREATE POLICY "Allow staff to insert tables"
    ON tables FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = tables.restaurant_id
        )
    );

CREATE POLICY "Allow staff to update tables"
    ON tables FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = tables.restaurant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = tables.restaurant_id
        )
    );

CREATE POLICY "Allow staff to delete tables"
    ON tables FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = tables.restaurant_id
        )
    );

-- 2. Enable DELETE policy on orders for authenticated staff members
-- This is required so staff can clean up orders associated with a table before deleting it
CREATE POLICY "Allow staff to delete their restaurant orders"
    ON orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = orders.restaurant_id
        )
    );
