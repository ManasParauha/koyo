'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStaffAction } from './actions'

interface AddStaffFormProps {
  restaurantId: string
  onStaffAdded?: () => void
}

export default function AddStaffForm({ restaurantId, onStaffAdded }: AddStaffFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'staff' | 'owner'>('staff')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // Success credentials popup
  const [credentials, setCredentials] = useState<{
    email: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyPassword = () => {
    if (!credentials) return
    navigator.clipboard.writeText(
      `Email: ${credentials.email}\nTemporary Password: ${credentials.password}\nLogin URL: ${window.location.origin}/dashboard/login`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Staff email is required.')
      return
    }

    startTransition(async () => {
      const res = await createStaffAction({
        restaurantId,
        email,
        role,
      })

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.email && res.password) {
        setCredentials({
          email: res.email,
          password: res.password,
        })
        setEmail('')
        router.refresh()
        if (onStaffAdded) onStaffAdded()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#181818] border border-[#222222] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Add Staff Account</h3>

        {error && (
          <div className="bg-red-950/30 border border-red-900/30 text-red-400 text-xs p-3.5 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
              Staff Email
            </label>
            <input
              type="email"
              required
              placeholder="chef@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 bg-[#0f0f0f] text-white border border-[#222222] rounded-md px-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all placeholder:text-[#666666]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#a8a8a8] font-semibold uppercase tracking-wider block">
              Dashboard Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'staff' | 'owner')}
              className="w-full h-10 bg-[#0f0f0f] text-white border border-[#222222] rounded-md px-3 text-xs focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-all"
            >
              <option value="staff">Staff (Kitchen Dashboard)</option>
              <option value="owner">Owner (Full Store Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 bg-[#0007cd] hover:bg-[#0005a3] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating Login...</span>
              </>
            ) : (
              <span>Add Staff Login</span>
            )}
          </button>
        </form>
      </div>

      {/* Credentials display card */}
      {credentials && (
        <div className="bg-[#181818] border border-[#33d17a]/30 rounded-lg p-5 space-y-4">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#33d17a]/10 text-[#33d17a]">
              ✓
            </span>
            <div>
              <h4 className="text-xs font-semibold text-white">Staff Login Added</h4>
              <p className="text-[11px] text-[#a8a8a8] mt-0.5">
                Copy these details for the staff member. This is only shown once.
              </p>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#222222] rounded-md p-3.5 space-y-2.5 relative">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#666666]">Email</span>
              <p className="text-xs text-white break-all">{credentials.email}</p>
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[#666666]">Temporary Password</span>
              <p className="text-xs text-[#00d4ff] font-mono font-semibold select-all">{credentials.password}</p>
            </div>

            <button
              onClick={handleCopyPassword}
              className="absolute top-3.5 right-3.5 text-[#666666] hover:text-white transition-colors cursor-pointer"
              title="Copy details"
            >
              {copied ? (
                <span className="text-[9px] text-[#33d17a] font-semibold">Copied!</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>

          <button
            onClick={() => setCredentials(null)}
            className="w-full h-8 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            Clear Credentials
          </button>
        </div>
      )}
    </div>
  )
}
