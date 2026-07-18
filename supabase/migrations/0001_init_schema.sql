-- Migration: Initialize Restaurant QR Ordering PWA Database Schema
-- Created: 2026-07-18
-- Target: Supabase Postgres Database

-- ============================================================================
-- 1. Helper Functions & Triggers
-- ============================================================================

-- Create a helper function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 2. Tables Schema Definition
-- ============================================================================

-- Table 1: restaurants
CREATE TABLE restaurants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    upi_id text,
    address text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Table 2: tables (physical layout tables at the restaurant)
CREATE TABLE tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number text NOT NULL,
    qr_code_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tables_restaurant_id_table_number_key UNIQUE (restaurant_id, table_number)
);

-- Table 3: menu_items (dishes, drinks, etc. served)
CREATE TABLE menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category text NOT NULL,
    image_url text,
    is_available boolean NOT NULL DEFAULT true,
    is_veg boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Table 4: orders (customer orders)
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES restaurants(id),
    table_id uuid NOT NULL REFERENCES tables(id),
    status text NOT NULL DEFAULT 'received',
    payment_mode text NOT NULL,
    payment_status text NOT NULL DEFAULT 'unpaid',
    receipt_number text UNIQUE,
    total_amount numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Status check constraint
    CONSTRAINT orders_status_check 
        CHECK (status IN ('received', 'preparing', 'ready', 'served', 'cancelled')),
    
    -- Payment mode check constraint
    CONSTRAINT orders_payment_mode_check 
        CHECK (payment_mode IN ('online_now', 'online_at_end', 'cash_at_counter')),
        
    -- Payment status check constraint
    CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('unpaid', 'pending_online', 'pending_cash', 'paid'))
);

-- Add update trigger on orders
CREATE TRIGGER update_orders_updated_at_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table 5: order_items (individual lines of food/drinks ordered)
CREATE TABLE order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES menu_items(id),
    quantity integer NOT NULL DEFAULT 1,
    notes text,
    item_status text NOT NULL DEFAULT 'received',
    price_at_order numeric(10,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Item status check constraint
    CONSTRAINT order_items_item_status_check 
        CHECK (item_status IN ('received', 'preparing', 'ready', 'served'))
);

-- Table 6: payments (transaction records)
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL,
    gateway_txn_id text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Payment method check constraint
    CONSTRAINT payments_method_check 
        CHECK (method IN ('online', 'cash')),
        
    -- Payment transaction status check constraint
    CONSTRAINT payments_status_check 
        CHECK (status IN ('pending', 'success', 'failed'))
);

-- ============================================================================
-- 3. Indexes for Query Performance
-- ============================================================================

-- Indexing foreign keys on tables
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);

-- Indexing foreign keys on menu_items
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- Indexing foreign keys on orders
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);

-- Indexing foreign keys on order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Indexing foreign keys on payments
CREATE INDEX idx_payments_order_id ON payments(order_id);

-- ============================================================================
-- 4. Row Level Security (RLS) Configuration & Policies
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SECURITY WARNING: The following policies are intentionally permissive for the MVP stage.
-- Since customers order via QR codes without needing to sign up or sign in,
-- public/anonymous access is required to view restaurants/tables/menu_items
-- and to place orders (inserting into orders/order_items/payments).
-- 
-- BEFORE PRODUCTION LAUNCH:
-- 1. Restrict INSERT/UPDATE operations on restaurants, tables, and menu_items to authenticated staff/admin roles.
-- 2. Restrict SELECT/UPDATE on orders, order_items, and payments to the specific restaurant staff or customers who own the active table session.
-- ----------------------------------------------------------------------------

-- A. Restaurants Policies
CREATE POLICY "Allow public read-only access to restaurants"
    ON restaurants FOR SELECT
    TO public
    USING (true);

-- B. Tables Policies
CREATE POLICY "Allow public read-only access to tables"
    ON tables FOR SELECT
    TO public
    USING (true);

-- C. Menu Items Policies
CREATE POLICY "Allow public read-only access to menu_items"
    ON menu_items FOR SELECT
    TO public
    USING (true);

-- D. Orders Policies
CREATE POLICY "Allow public to place orders (insert)"
    ON orders FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public to track their orders (select)"
    ON orders FOR SELECT
    TO public
    USING (true);

-- E. Order Items Policies
CREATE POLICY "Allow public to add order items (insert)"
    ON order_items FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public to view their order items (select)"
    ON order_items FOR SELECT
    TO public
    USING (true);

-- F. Payments Policies
CREATE POLICY "Allow public to create payment records (insert)"
    ON payments FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public to view payment records (select)"
    ON payments FOR SELECT
    TO public
    USING (true);
