'use server'

import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'

export async function fetchAnalyticsAction(
  restaurantId: string,
  startTimeStr: string,
  endTimeStr: string,
  interval: 'hour' | 'day'
) {
  // 1. Security Check: Ensure caller is authorized (Owner, Manager, or Super Admin)
  const authResult = await checkAuthorization(['owner', 'manager'], restaurantId)
  if (!authResult.isAuthorized || !authResult.session) {
    return { error: 'Unauthorized: You do not have permission to view analytics for this restaurant.' }
  }

  try {
    // 2. Instantiate Supabase client carrying the user's Auth.js Bearer token for RLS
    const supabase = getSupabaseForSession(authResult.session)

    // 3. Fetch analytics summary RPC
    const { data: summaryData, error: summaryErr } = await supabase.rpc(
      'get_restaurant_analytics_summary',
      {
        p_restaurant_id: restaurantId,
        p_start_time: startTimeStr,
        p_end_time: endTimeStr,
      }
    )

    if (summaryErr) {
      console.error('Error executing get_restaurant_analytics_summary:', summaryErr)
      return { error: summaryErr.message || 'Failed to fetch analytics summary.' }
    }

    // 4. Fetch popular menu items RPC
    const { data: itemsData, error: itemsErr } = await supabase.rpc(
      'get_restaurant_popular_items',
      {
        p_restaurant_id: restaurantId,
        p_start_time: startTimeStr,
        p_end_time: endTimeStr,
      }
    )

    if (itemsErr) {
      console.error('Error executing get_restaurant_popular_items:', itemsErr)
      return { error: itemsErr.message || 'Failed to fetch popular items.' }
    }

    // 5. Fetch revenue over time RPC
    const { data: revOverTimeData, error: revErr } = await supabase.rpc(
      'get_restaurant_revenue_over_time',
      {
        p_restaurant_id: restaurantId,
        p_start_time: startTimeStr,
        p_end_time: endTimeStr,
        p_interval: interval,
      }
    )

    if (revErr) {
      console.error('Error executing get_restaurant_revenue_over_time:', revErr)
      return { error: revErr.message || 'Failed to fetch revenue trends.' }
    }

    return {
      success: true,
      summary: summaryData?.[0] || null,
      popularItems: itemsData || [],
      revenueOverTime: revOverTimeData || [],
    }
  } catch (err: any) {
    console.error('Unexpected error in fetchAnalyticsAction:', err)
    return { error: err.message || 'An unexpected error occurred while loading analytics.' }
  }
}
