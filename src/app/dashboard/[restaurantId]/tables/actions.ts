'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'

// Helper: Ensure user is authorized staff for the specific restaurant
async function verifyStaffAccess(restaurantId: string) {
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: 'Unauthorized. Please log in.' }
  }

  const { data: staff, error } = await userSupabase
    .from('staff')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (error || !staff || staff.restaurant_id !== restaurantId) {
    return { authorized: false, error: 'Forbidden. You do not have access to this restaurant.' }
  }

  return { authorized: true, user }
}

// Action: Add a new table and generate its QR code
export async function addTable(restaurantId: string, tableNumber: string) {
  if (!tableNumber || tableNumber.trim() === '') {
    return { error: 'Table number is required.' }
  }

  // 1. Verify access
  const access = await verifyStaffAccess(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const userSupabase = await createClient()

    // 2. Insert new table row (with null qr_code_url initially)
    const { data: newTable, error: insertError } = await userSupabase
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        table_number: tableNumber.trim(),
        qr_code_url: null
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation code in Postgres
        return { error: `Table number "${tableNumber}" already exists.` }
      }
      throw new Error(insertError.message)
    }

    const tableId = newTable.id

    // 3. Generate QR code encoding full menu URL
    const baseDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseDomain}/menu/${restaurantId}/${tableId}`

    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // 4. Update the row with the base64 data URL
    const { error: updateError } = await userSupabase
      .from('tables')
      .update({ qr_code_url: qrDataUrl })
      .eq('id', tableId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidatePath(`/dashboard/${restaurantId}/tables`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in addTable action:', err)
    return { error: err.message || 'An unexpected error occurred while adding the table.' }
  }
}

// Action: Delete a table and all its associated orders (to handle cascade manually)
export async function deleteTable(restaurantId: string, tableId: string) {
  if (!tableId) {
    return { error: 'Table ID is required.' }
  }

  // 1. Verify access
  const access = await verifyStaffAccess(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const userSupabase = await createClient()

    // 2. Delete all orders linked to this table (satisfying ON DELETE CASCADE constraints manually)
    const { error: deleteOrdersError } = await userSupabase
      .from('orders')
      .delete()
      .eq('table_id', tableId)

    if (deleteOrdersError) {
      throw new Error(deleteOrdersError.message)
    }

    // 3. Delete the table row
    const { error: deleteTableError } = await userSupabase
      .from('tables')
      .delete()
      .eq('id', tableId)

    if (deleteTableError) {
      throw new Error(deleteTableError.message)
    }

    revalidatePath(`/dashboard/${restaurantId}/tables`)
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteTable action:', err)
    return { error: err.message || 'An unexpected error occurred while deleting the table.' }
  }
}
