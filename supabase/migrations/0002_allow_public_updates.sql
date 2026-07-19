-- Migration: Enable public update policy and realtime for orders table
-- Created: 2026-07-19

-- A. Enable update policy for orders
-- Since this is an authenticated-ish internal tool, we allow public updates for now (staff auth will be added in a later step)
CREATE POLICY "Allow public to update orders (update)"
    ON orders FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- B. Enable realtime subscription for orders table
alter publication supabase_realtime add table orders;
