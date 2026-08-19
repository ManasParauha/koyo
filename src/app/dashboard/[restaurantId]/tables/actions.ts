'use server'

import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { revalidatePath } from 'next/cache'
import QRCode from 'qrcode'

// Helper: Ensure user is authorized owner or manager for the specific restaurant
async function verifyTablePermission(restaurantId: string) {
  const authResult = await checkAuthorization(['owner', 'manager'], restaurantId)
  if (!authResult.isAuthorized || !authResult.session) {
    return { authorized: false as const, error: 'Forbidden. Owner or Manager role required.', session: null }
  }
  return { authorized: true as const, error: null, session: authResult.session }
}

// Action: Add a new table and generate its QR code
export async function addTable(restaurantId: string, tableNumber: string) {
  if (!tableNumber || tableNumber.trim() === '') {
    return { error: 'Table number is required.' }
  }

  // 1. Verify access
  const access = await verifyTablePermission(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const supabase = getSupabaseForSession(access.session)

    // 2. Insert new table row
    const { data: newTable, error: insertError } = await supabase
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
    const { error: updateError } = await supabase
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

// Action: Delete a table and all its associated orders
export async function deleteTable(restaurantId: string, tableId: string) {
  if (!tableId) {
    return { error: 'Table ID is required.' }
  }

  // 1. Verify access
  const access = await verifyTablePermission(restaurantId)
  if (!access.authorized) {
    return { error: access.error }
  }

  try {
    const supabase = getSupabaseForSession(access.session)

    // 2. Delete all orders linked to this table
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .eq('table_id', tableId)

    if (deleteOrdersError) {
      throw new Error(deleteOrdersError.message)
    }

    // 3. Delete the table row
    const { error: deleteTableError } = await supabase
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
