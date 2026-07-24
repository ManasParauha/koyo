-- Migration: Add basic analytics functions for restaurant orders
-- Created: 2026-07-24

-- 1. Function to get analytics summary
CREATE OR REPLACE FUNCTION get_restaurant_analytics_summary(
    p_restaurant_id uuid,
    p_start_time timestamptz,
    p_end_time timestamptz
)
RETURNS TABLE (
    total_revenue numeric,
    total_orders bigint,
    avg_order_value numeric,
    avg_serve_time_seconds numeric,
    count_online_now bigint,
    count_online_at_end bigint,
    count_cash_at_counter bigint
) AS $$
BEGIN
    -- Auth check: Ensure the authenticated user is staff for this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id = auth.uid()
          AND staff.restaurant_id = p_restaurant_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not staff of this restaurant';
    END IF;

    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric AS total_revenue,
        COUNT(*)::bigint AS total_orders,
        COALESCE(AVG(total_amount), 0)::numeric AS avg_order_value,
        COALESCE(AVG(CASE WHEN status = 'served' THEN EXTRACT(EPOCH FROM (updated_at - created_at)) END), 0)::numeric AS avg_serve_time_seconds,
        COUNT(CASE WHEN payment_mode = 'online_now' THEN 1 END)::bigint AS count_online_now,
        COUNT(CASE WHEN payment_mode = 'online_at_end' THEN 1 END)::bigint AS count_online_at_end,
        COUNT(CASE WHEN payment_mode = 'cash_at_counter' THEN 1 END)::bigint AS count_cash_at_counter
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_start_time
      AND created_at <= p_end_time;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Function to get popular menu items
CREATE OR REPLACE FUNCTION get_restaurant_popular_items(
    p_restaurant_id uuid,
    p_start_time timestamptz,
    p_end_time timestamptz
)
RETURNS TABLE (
    menu_item_name text,
    total_quantity bigint
) AS $$
BEGIN
    -- Auth check: Ensure the authenticated user is staff for this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id = auth.uid()
          AND staff.restaurant_id = p_restaurant_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not staff of this restaurant';
    END IF;

    RETURN QUERY
    SELECT
        mi.name AS menu_item_name,
        SUM(oi.quantity)::bigint AS total_quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE o.restaurant_id = p_restaurant_id
      AND o.created_at >= p_start_time
      AND o.created_at <= p_end_time
      AND o.status != 'cancelled'
    GROUP BY mi.name
    ORDER BY total_quantity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Function to get revenue over time grouped by hour or day
CREATE OR REPLACE FUNCTION get_restaurant_revenue_over_time(
    p_restaurant_id uuid,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_interval text
)
RETURNS TABLE (
    time_bucket timestamptz,
    revenue numeric,
    order_count bigint
) AS $$
BEGIN
    -- Auth check: Ensure the authenticated user is staff for this restaurant
    IF NOT EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id = auth.uid()
          AND staff.restaurant_id = p_restaurant_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not staff of this restaurant';
    END IF;

    IF p_interval = 'hour' THEN
        RETURN QUERY
        SELECT
            date_trunc('hour', created_at) AS time_bucket,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric AS revenue,
            COUNT(*)::bigint AS order_count
        FROM orders
        WHERE restaurant_id = p_restaurant_id
          AND created_at >= p_start_time
          AND created_at <= p_end_time
        GROUP BY date_trunc('hour', created_at)
        ORDER BY time_bucket ASC;
    ELSIF p_interval = 'day' THEN
        RETURN QUERY
        SELECT
            date_trunc('day', created_at) AS time_bucket,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric AS revenue,
            COUNT(*)::bigint AS order_count
        FROM orders
        WHERE restaurant_id = p_restaurant_id
          AND created_at >= p_start_time
          AND created_at <= p_end_time
        GROUP BY date_trunc('day', created_at)
        ORDER BY time_bucket ASC;
    ELSE
        RAISE EXCEPTION 'Invalid interval: must be hour or day';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
