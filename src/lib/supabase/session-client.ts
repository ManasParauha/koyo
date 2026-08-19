import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Session } from 'next-auth'

/**
 * Constructs a Supabase client authenticated with the user's Supabase Access Token
 * from their Auth.js session. This ensures Row Level Security (RLS) policies evaluate
 * auth.uid() correctly for every query and mutation.
 */
export function getSupabaseForSession(session: Session | null) {
  const accessToken = (session?.user as any)?.supabaseAccessToken

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
