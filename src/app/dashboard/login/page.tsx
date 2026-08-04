'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthCard from '@/components/auth/AuthCard'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthCard
      title="Kitchen Staff Portal"
      subtitle="Sign in to manage live kitchen tickets and orders."
    >
      {error && (
        <div 
          className="bg-red-950/40 border border-red-900/50 text-red-300 text-xs p-3 rounded-md leading-normal font-sans" 
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email-input" className="block text-xs font-medium text-ink-muted">
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
            placeholder="chef@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 bg-canvas text-ink border border-hairline rounded-md px-3 text-sm placeholder:text-ink-tertiary focus:border-primary-focus focus:ring-1 focus:ring-primary-focus outline-none transition-colors font-sans"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="block text-xs font-medium text-ink-muted">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 bg-canvas text-ink border border-hairline rounded-md pl-3 pr-12 text-sm placeholder:text-ink-tertiary focus:border-primary-focus focus:ring-1 focus:ring-primary-focus outline-none transition-colors font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-tertiary hover:text-ink transition-colors font-medium select-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-9 bg-primary hover:bg-primary-hover active:bg-primary-focus text-on-primary text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 mt-2"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing in…</span>
            </span>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>
    </AuthCard>
  )
}
