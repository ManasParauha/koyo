'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign in with password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Authentication failed. No user returned.')
      }

      // 2. Fetch the super-admin record
      const { data: superAdmin, error: saError } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (saError || !superAdmin) {
        // Authenticated but not a super-admin -> sign out and block access
        await supabase.auth.signOut()
        throw new Error('Access denied. No super-admin account associated with this email.')
      }

      // 3. Redirect to the admin dashboard
      router.push('/admin/restaurants')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-[#222222] border border-[#333333] rounded-full text-indigo-400">
            Platform Administration Auth
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-white mt-2">
            Super-Admin Login
          </h1>
          <p className="text-[#a8a8a8] text-sm">
            Sign in to onboard new restaurants and manage staff accounts.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-lg leading-normal animate-pulse" aria-live="polite">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
              Email Address
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              required
              autoComplete="email"
              spellCheck={false}
              placeholder="admin@koyo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-[#0f0f0f] text-white border border-[#222222] rounded-md px-4 text-sm focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password-input" className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
              Password
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-[#0f0f0f] text-white border border-[#222222] rounded-md px-4 text-sm focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0007cd] hover:bg-[#0005a3] text-white text-sm font-semibold rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verifying Admin Session…</span>
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
