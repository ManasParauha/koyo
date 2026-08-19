'use server'

import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { revalidatePath } from 'next/cache'

export interface MenuItemData {
  id?: string // undefined/empty for new items
  name: string
  description?: string
  price: number
  category: string
  is_veg: boolean
  image_url?: string | null
  is_available?: boolean
}

// Helper: Ensure caller is authorized owner or manager for the target restaurant
async function verifyMenuPermission(restaurantId: string) {
  const authResult = await checkAuthorization(['owner', 'manager'], restaurantId)
  if (!authResult.isAuthorized || !authResult.session) {
    return { authorized: false as const, error: 'Forbidden. Owner or Manager role required.', session: null }
  }
  return { authorized: true as const, error: null, session: authResult.session }
}

// Action: Create or Update a Menu Item
export async function upsertMenuItem(restaurantId: string, data: MenuItemData) {
  // 1. Basic Validation
  if (!data.name || data.name.trim() === '') {
    return { error: 'Name is required.' }
  }
  if (!data.category || data.category.trim() === '') {
    return { error: 'Category is required.' }
  }
  if (typeof data.price !== 'number' || data.price <= 0 || isNaN(data.price)) {
    return { error: 'Price must be a positive number.' }
  }

  // 2. Verify permission
  const access = await verifyMenuPermission(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const supabase = getSupabaseForSession(access.session)

    const payload = {
      restaurant_id: restaurantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      category: data.category.trim(),
      is_veg: data.is_veg,
      image_url: data.image_url || null,
      is_available: data.is_available ?? true
    }

    let error

    if (data.id) {
      // Update existing item
      const { error: updateError } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', data.id)
        .eq('restaurant_id', restaurantId)

      error = updateError
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from('menu_items')
        .insert(payload)

      error = insertError
    }

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/dashboard/${restaurantId}/menu`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in upsertMenuItem:', err)
    return { error: err.message || 'An unexpected error occurred while saving the menu item.' }
  }
}

// Action: Quick Toggle Availability
export async function toggleMenuItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean) {
  const access = await verifyMenuPermission(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const supabase = getSupabaseForSession(access.session)

    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath(`/dashboard/${restaurantId}/menu`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in toggleMenuItemAvailability:', err)
    return { error: err.message || 'An unexpected error occurred while toggling availability.' }
  }
}

// Action: Delete a Menu Item
export async function deleteMenuItem(restaurantId: string, itemId: string) {
  if (!itemId) {
    return { error: 'Item ID is required.' }
  }

  const access = await verifyMenuPermission(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const supabase = getSupabaseForSession(access.session)

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId)

    if (error) {
      if (error.code === '23503') { // Foreign key violation code in Postgres
        return {
          error: 'This menu item cannot be deleted because it has been ordered in past transactions. Please turn off the "Available" toggle switch instead.'
        }
      }
      throw new Error(error.message)
    }

    revalidatePath(`/dashboard/${restaurantId}/menu`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteMenuItem:', err)
    return { error: err.message || 'An unexpected error occurred while deleting the menu item.' }
  }
}
