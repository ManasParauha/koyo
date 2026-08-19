'use server'

import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatusAction(
  restaurantId: string,
  orderId: string,
  newStatus: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
) {
  const authResult = await checkAuthorization(['owner', 'manager', 'kitchen'], restaurantId)
  if (!authResult.isAuthorized || !authResult.session) {
    return { error: 'Forbidden. You do not have access to update orders for this restaurant.' }
  }

  try {
    const supabase = getSupabaseForSession(authResult.session)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)

    if (error) throw error

    revalidatePath(`/dashboard/${restaurantId}`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateOrderStatusAction:', err)
    return { error: err.message || 'Failed to update order status.' }
  }
}

export async function markOrderPaidAction(restaurantId: string, orderId: string) {
  const authResult = await checkAuthorization(['owner', 'manager', 'kitchen'], restaurantId)
  if (!authResult.isAuthorized || !authResult.session) {
    return { error: 'Forbidden. You do not have access to update payments for this restaurant.' }
  }

  try {
    const supabase = getSupabaseForSession(authResult.session)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)

    if (error) throw error

    revalidatePath(`/dashboard/${restaurantId}`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in markOrderPaidAction:', err)
    return { error: err.message || 'Failed to mark order as paid.' }
  }
}
