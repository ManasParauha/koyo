-- Migration: Harden Row Level Security (RLS) policies for orders, order_items, and payments
-- Created: 2026-07-24

-- 1. Orders table: Update public/anonymous INSERT policy to verify restaurant_id and table_id
DROP POLICY IF EXISTS "Allow public to place orders (insert)" ON orders;

CREATE POLICY "Allow public to place orders (insert)"
    ON orders FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tables
            WHERE tables.id = orders.table_id
            AND tables.restaurant_id = orders.restaurant_id
        )
    );

-- 2. Order Items table: Update public/anonymous INSERT policy to prevent spoofing items
DROP POLICY IF EXISTS "Allow public to add order items (insert)" ON order_items;

CREATE POLICY "Allow public to add order items (insert)"
    ON order_items FOR INSERT
    TO public
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
        )
        AND EXISTS (
            SELECT 1 FROM menu_items
            JOIN orders ON orders.restaurant_id = menu_items.restaurant_id
            WHERE orders.id = order_items.order_id
            AND menu_items.id = order_items.menu_item_id
        )
    );

-- 3. Payments table: Remove public/anonymous INSERT policy.
-- All online transactions are initiated server-side via Razorpay create-order with service_role client.
-- Staff-recorded cash payments are updated by authenticated staff.
DROP POLICY IF EXISTS "Allow public to create payment records (insert)" ON payments;
DROP POLICY IF EXISTS "Allow public to view payment records (select)" ON payments;
