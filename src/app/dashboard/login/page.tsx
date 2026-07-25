'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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
      // 1. Sign in user with password
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

      // 2. Fetch the staff record to retrieve the restaurant ID mapping
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('restaurant_id')
        .eq('id', authData.user.id)
        .single()

      if (staffError || !staff) {
        // If authenticated but no matching staff profile found, sign out and block access
        await supabase.auth.signOut()
        throw new Error('Access denied. No staff profile associated with this account.')
      }

      // 3. Redirect to the staff's specific restaurant dashboard
      router.push(`/dashboard/${staff.restaurant_id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-canvas text-ink font-sans relative overflow-hidden selection:bg-primary/20 selection:text-ink">
      <div className="max-w-md w-full bg-surface-1 border border-hairline p-6 sm:p-8 rounded-lg shadow-product shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] relative z-10 space-y-6">
        <div className="text-center space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-caption tracking-normal px-2.5 py-0.5 bg-surface-2 border border-hairline rounded-pill text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" aria-hidden="true" />
              <span className="tracking-eyebrow uppercase text-[10px] font-semibold text-ink-subtle">Kitchen Dashboard</span>
            </span>
          </div>

          <h1 className="text-[24px] sm:text-headline font-semibold tracking-headline leading-headline text-ink font-display mt-2 text-balance">
            Staff Portal
          </h1>
          <p className="text-ink-subtle text-body-sm font-normal text-pretty leading-relaxed">
            Sign in to view and manage active kitchen orders.
          </p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-md leading-normal font-sans flex items-start space-x-2 animate-fadeIn" aria-live="polite">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="text-caption font-semibold tracking-normal text-ink-muted">
              Email Address
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              spellCheck={false}
              placeholder="e.g. chef@restaurant.com…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-canvas text-ink border border-hairline rounded-md px-3 text-body-sm focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:border-primary-focus outline-none transition-all placeholder:text-ink-tertiary font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password-input" className="text-caption font-semibold tracking-normal text-ink-muted">
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
              className="w-full h-11 bg-canvas text-ink border border-hairline rounded-md px-3 text-body-sm focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:border-primary-focus outline-none transition-all placeholder:text-ink-tertiary font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary-hover active:bg-primary-focus text-on-primary text-button font-medium rounded-md transition-all duration-100 ease-out flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-focus/50 focus-visible:border-primary-focus outline-none"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing In…</span>
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
