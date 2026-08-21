'use server'

import { verifySession, checkAuthorization } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

export async function changePasswordAction(formData: {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}) {
  const session = await verifySession()

  if (!session?.user?.id || !session?.user?.email) {
    return { error: 'Unauthorized. Please sign in again.' }
  }

  const { currentPassword, newPassword, confirmPassword } = formData

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters long.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirmation password do not match.' }
  }

  if (currentPassword === newPassword) {
    return { error: 'New password must be different from your current password.' }
  }

  try {
    // 1. Verify current password against Supabase Auth
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    })

    if (signInError) {
      return { error: 'Current password is incorrect.' }
    }

    // 2. Update user password in Supabase Auth using Admin Client
    const adminSupabase = await createAdminClient()
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      session.user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password in Supabase Auth:', updateError)
      return { error: updateError.message || 'Failed to update password.' }
    }

    return { success: true, message: 'Password changed successfully.' }
  } catch (err: any) {
    console.error('Unexpected error in changePasswordAction:', err)
    return { error: err.message || 'An unexpected error occurred while updating your password.' }
  }
}

export interface CreateWorkplaceStaffInput {
  restaurantId: string
  email: string
  role: 'manager' | 'kitchen'
}

export async function createWorkplaceStaffAction(data: CreateWorkplaceStaffInput) {
  // 1. Authorize owner or super_admin for this restaurant
  const { isAuthorized, reason } = await checkAuthorization(
    ['owner', 'super_admin'],
    data.restaurantId
  )

  if (!isAuthorized) {
    if (reason === 'UNAUTHENTICATED') {
      return { error: 'Unauthorized. Please log in.' }
    }
    return { error: 'Forbidden. Owner privileges required to manage workplace team.' }
  }

  // 2. Validate inputs
  if (!data.restaurantId) return { error: 'Restaurant ID is required.' }
  if (!data.email.trim()) return { error: 'Staff email address is required.' }
  if (!['manager', 'kitchen'].includes(data.role)) {
    return { error: 'Invalid staff role specified. Allowed roles are Manager and Kitchen.' }
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

    revalidatePath(`/dashboard/${data.restaurantId}/settings`)
    return {
      success: true,
      email: data.email.trim().toLowerCase(),
      password: tempPassword,
    }
  } catch (err: any) {
    console.error('Error creating workplace staff account:', err)
    return { error: err.message || 'An unexpected error occurred during staff setup.' }
  }
}

export interface RemoveWorkplaceStaffInput {
  restaurantId: string
  staffId: string
}

export async function removeWorkplaceStaffAction(data: RemoveWorkplaceStaffInput) {
  // 1. Authorize owner or super_admin for this restaurant
  const { isAuthorized, session } = await checkAuthorization(
    ['owner', 'super_admin'],
    data.restaurantId
  )

  if (!isAuthorized || !session) {
    return { error: 'Forbidden. Owner privileges required to manage workplace team.' }
  }

  // Prevent self removal
  if (session.user.id === data.staffId) {
    return { error: 'You cannot remove your own active account from the workplace.' }
  }

  try {
    const adminSupabase = await createAdminClient()

    // Verify staff record exists for this restaurant
    const { data: staffMember, error: fetchError } = await adminSupabase
      .from('staff')
      .select('restaurant_id, role')
      .eq('id', data.staffId)
      .single()

    if (fetchError || !staffMember || staffMember.restaurant_id !== data.restaurantId) {
      return { error: 'Staff member not found in this workplace.' }
    }

    // Delete Auth User (Supabase will cascade or we explicitly delete staff row)
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(data.staffId)
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
    }

    // Explicitly delete staff table record
    await adminSupabase.from('staff').delete().eq('id', data.staffId)

    revalidatePath(`/dashboard/${data.restaurantId}/settings`)
    return { success: true, message: 'Workplace staff account removed successfully.' }
  } catch (err: any) {
    console.error('Error removing workplace staff account:', err)
    return { error: err.message || 'An unexpected error occurred while removing staff member.' }
  }
}

