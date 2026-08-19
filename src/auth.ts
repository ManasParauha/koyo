import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// TypeScript Augmentation for Auth.js Session & JWT
declare module 'next-auth' {
  interface User {
    role: 'super_admin' | 'owner' | 'manager' | 'kitchen'
    restaurantId: string | null
    supabaseAccessToken: string
    supabaseRefreshToken: string
    supabaseExpiresAt: number
  }

  interface Session {
    user: {
      id: string
      role: 'super_admin' | 'owner' | 'manager' | 'kitchen'
      restaurantId: string | null
      supabaseAccessToken: string
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Authenticate against Supabase Auth backend
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (authError || !authData.user || !authData.session) {
          throw new Error(authError?.message || 'Invalid credentials')
        }

        const userId = authData.user.id

        // 2. Dual-Table Lookup Step A: Check if platform super-admin
        const { data: superAdmin } = await supabase
          .from('super_admins')
          .select('id')
          .eq('id', userId)
          .single()

        if (superAdmin) {
          return {
            id: userId,
            email: authData.user.email,
            role: 'super_admin',
            restaurantId: null,
            supabaseAccessToken: authData.session.access_token,
            supabaseRefreshToken: authData.session.refresh_token,
            supabaseExpiresAt: (authData.session.expires_at ?? 0) * 1000,
          }
        }

        // 3. Dual-Table Lookup Step B: Check staff table for restaurant membership
        const { data: staff } = await supabase
          .from('staff')
          .select('restaurant_id, role')
          .eq('id', userId)
          .single()

        if (staff) {
          return {
            id: userId,
            email: authData.user.email,
            role: staff.role as any,
            restaurantId: staff.restaurant_id,
            supabaseAccessToken: authData.session.access_token,
            supabaseRefreshToken: authData.session.refresh_token,
            supabaseExpiresAt: (authData.session.expires_at ?? 0) * 1000,
          }
        }

        throw new Error('Access denied. No active staff or admin profile found.')
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial Sign-in: Store claims & tokens in JWT
      if (user) {
        token.id = user.id
        token.role = user.role
        token.restaurantId = user.restaurantId
        token.supabaseAccessToken = user.supabaseAccessToken
        token.supabaseRefreshToken = user.supabaseRefreshToken
        token.supabaseExpiresAt = user.supabaseExpiresAt
        return token
      }

      // Check if Supabase access token is still valid (> 5 minutes left)
      if (
        token.supabaseExpiresAt &&
        Date.now() < (token.supabaseExpiresAt as number) - 5 * 60 * 1000
      ) {
        return token
      }

      // Refresh Near-Expired Supabase Token
      try {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: token.supabaseRefreshToken as string,
        })

        if (error || !data.session) {
          throw error || new Error('Failed to refresh Supabase session')
        }

        token.supabaseAccessToken = data.session.access_token
        token.supabaseRefreshToken = data.session.refresh_token
        token.supabaseExpiresAt = (data.session.expires_at ?? 0) * 1000
      } catch (err) {
        console.error('Error refreshing Supabase access token in Auth.js JWT callback:', err)
        return { ...token, error: 'RefreshAccessTokenError' }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.restaurantId = token.restaurantId as string | null
        session.user.supabaseAccessToken = token.supabaseAccessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/dashboard/login',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'koyo-rbac-secret-key-change-in-prod-987654321',
})
