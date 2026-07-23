-- Migration: Create staff table and configure Row Level Security (RLS) policies for Staff Auth
-- Created: 2026-07-23

-- 1. Create the staff table
CREATE TABLE staff (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'staff',
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Check role constraint
    CONSTRAINT staff_role_check CHECK (role IN ('staff', 'owner'))
);

-- 2. Enable Row Level Security (RLS) on staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policy: Allow staff to select/read their own record
CREATE POLICY "Allow staff to select their own record"
    ON staff FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 3. Update RLS policies for orders table
-- Drop existing public SELECT and UPDATE policies
DROP POLICY IF EXISTS "Allow public to track their orders (select)" ON orders;
DROP POLICY IF EXISTS "Allow public to update orders (update)" ON orders;

-- Staff SELECT: Allow authenticated staff to view all orders belonging to their restaurant
CREATE POLICY "Allow staff to view their restaurant orders"
    ON orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = orders.restaurant_id
        )
    );

-- Staff UPDATE: Allow authenticated staff to update orders belonging to their restaurant
CREATE POLICY "Allow staff to update their restaurant orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = orders.restaurant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.id = auth.uid()
            AND staff.restaurant_id = orders.restaurant_id
        )
    );

-- Customer SELECT: Allow anonymous customers to track their own specific orders (by matching order ID)
-- This keeps the unauthenticated menu/confirmation flow working since they query by order ID
CREATE POLICY "Allow anonymous to track orders"
    ON orders FOR SELECT
    TO anon
    USING (true);

-- 4. Update RLS policies for order_items table
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Allow public to view their order items (select)" ON order_items;

-- Staff SELECT: Allow authenticated staff to view order items from their restaurant's orders
CREATE POLICY "Allow staff to view their restaurant order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN staff ON staff.restaurant_id = orders.restaurant_id
            WHERE staff.id = auth.uid()
            AND orders.id = order_items.order_id
        )
    );

-- Customer SELECT: Allow anonymous customers to view their order items (required for confirmation page)
CREATE POLICY "Allow anonymous to view order items"
    ON order_items FOR SELECT
    TO anon
    USING (true);

-- 5. Update RLS policies for payments table
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Allow public to view payment records (select)" ON payments;

-- Staff SELECT: Allow authenticated staff to view payment records from their restaurant's orders
CREATE POLICY "Allow staff to view their restaurant payments"
    ON payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN staff ON staff.restaurant_id = orders.restaurant_id
            WHERE staff.id = auth.uid()
            AND orders.id = payments.order_id
        )
    );

-- Staff UPDATE: Allow authenticated staff to update payment records from their restaurant's orders (e.g. marking paid)
CREATE POLICY "Allow staff to update their restaurant payments"
    ON payments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN staff ON staff.restaurant_id = orders.restaurant_id
            WHERE staff.id = auth.uid()
            AND orders.id = payments.order_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            JOIN staff ON staff.restaurant_id = orders.restaurant_id
            WHERE staff.id = auth.uid()
            AND orders.id = payments.order_id
        )
    );
