'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// Helper: Generate a secure random temporary password
function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

// Helper: Ensure caller is authenticated as a platform super admin via Auth.js session
async function verifySuperAdminAccess() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized. Please log in.')
  }

  if (session.user.role !== 'super_admin') {
    throw new Error('Forbidden. Super-admin privileges required.')
  }

  return { session }
}

export interface CreateRestaurantInput {
  name: string
  upi_id: string
  address: string
  owner_email: string
}

export async function createRestaurantAction(data: CreateRestaurantInput) {
  // 1. Verify super admin access
  await verifySuperAdminAccess()

  // 2. Validate input fields
  if (!data.name.trim()) return { error: 'Restaurant name is required.' }
  if (!data.owner_email.trim()) return { error: 'Owner email address is required.' }

  try {
    const adminSupabase = await createAdminClient()

    // 3. Create restaurant row using admin client
    const { data: restaurant, error: restError } = await adminSupabase
      .from('restaurants')
      .insert({
        name: data.name.trim(),
        upi_id: data.upi_id.trim() || null,
        address: data.address.trim() || null,
      })
      .select('id')
      .single()

    if (restError || !restaurant) {
      throw new Error(restError?.message || 'Failed to create restaurant row.')
    }

    // 4. Generate owner credentials
    const tempPassword = generateTempPassword()

    // 5. Create Auth user via Supabase service role
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: data.owner_email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true,
    })

    if (authError || !authUser.user) {
      // Cleanup restaurant row on failure to avoid orphaned records
      await adminSupabase.from('restaurants').delete().eq('id', restaurant.id)
      throw new Error(authError?.message || 'Failed to create auth user for the owner.')
    }

    // 6. Link in staff table with owner role
    const { error: staffError } = await adminSupabase
      .from('staff')
      .insert({
        id: authUser.user.id,
        restaurant_id: restaurant.id,
        role: 'owner',
      })

    if (staffError) {
      // Cleanup auth user and restaurant row on failure
      await adminSupabase.auth.admin.deleteUser(authUser.user.id)
      await adminSupabase.from('restaurants').delete().eq('id', restaurant.id)
      throw new Error(staffError.message || 'Failed to link owner profile.')
    }

    revalidatePath('/admin/restaurants')
    return {
      success: true,
      email: data.owner_email.trim().toLowerCase(),
      password: tempPassword,
      restaurantId: restaurant.id,
    }
  } catch (err: any) {
    console.error('Error creating restaurant:', err)
    return { error: err.message || 'An unexpected error occurred during restaurant setup.' }
  }
}

export interface CreateStaffInput {
  restaurantId: string
  email: string
  role: 'owner' | 'manager' | 'kitchen'
}

export async function createStaffAction(data: CreateStaffInput) {
  // 1. Verify super admin access
  await verifySuperAdminAccess()

  // 2. Validate inputs
  if (!data.restaurantId) return { error: 'Restaurant ID is required.' }
  if (!data.email.trim()) return { error: 'Staff email address is required.' }
  if (!['owner', 'manager', 'kitchen'].includes(data.role)) {
    return { error: 'Invalid staff role specified.' }
  }

  try {
    const adminSupabase = await createAdminClient()

    // 3. Generate staff credentials
    const tempPassword = generateTempPassword()

    // 4. Create Auth user via service role
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true,
    })

    if (authError || !authUser.user) {
      throw new Error(authError?.message || 'Failed to create auth user for staff.')
    }

    // 5. Link in staff table
    const { error: staffError } = await adminSupabase
      .from('staff')
      .insert({
        id: authUser.user.id,
        restaurant_id: data.restaurantId,
        role: data.role,
      })

    if (staffError) {
      // Cleanup auth user on failure
      await adminSupabase.auth.admin.deleteUser(authUser.user.id)
      throw new Error(staffError.message || 'Failed to link staff profile.')
    }

    revalidatePath(`/admin/restaurants/${data.restaurantId}`)
    return {
      success: true,
      email: data.email.trim().toLowerCase(),
      password: tempPassword,
    }
  } catch (err: any) {
    console.error('Error creating staff account:', err)
    return { error: err.message || 'An unexpected error occurred during staff setup.' }
  }
}
