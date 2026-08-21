'use server'

import { verifySession } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
