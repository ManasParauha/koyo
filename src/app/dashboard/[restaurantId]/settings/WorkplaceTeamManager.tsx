'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkplaceStaffAction, removeWorkplaceStaffAction } from './actions'

export interface StaffMember {
  id: string
  email: string
  role: 'owner' | 'manager' | 'kitchen'
  created_at: string
}

interface WorkplaceTeamManagerProps {
  restaurantId: string
  initialStaff: StaffMember[]
  currentUserId: string
}

type RoleType = 'manager' | 'kitchen'

export function WorkplaceTeamManager({
  restaurantId,
  initialStaff,
  currentUserId,
}: WorkplaceTeamManagerProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoleType>('manager')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Success credentials state
  const [credentials, setCredentials] = useState<{
    email: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyPassword = () => {
    if (!credentials) return
    const loginUrl = `${window.location.origin}/dashboard/login`
    navigator.clipboard.writeText(
      `Workplace Login Credentials:\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\nLogin URL: ${loginUrl}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Staff email is required.')
      return
    }

    startTransition(async () => {
      const res = await createWorkplaceStaffAction({
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
      }
    })
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member from your workplace? They will lose dashboard access immediately.')) {
      return
    }

    setError(null)
    setRemovingId(staffId)

    startTransition(async () => {
      const res = await removeWorkplaceStaffAction({
        restaurantId,
        staffId,
      })

      setRemovingId(null)
      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const getRoleBadgeStyle = (staffRole: string) => {
    switch (staffRole) {
      case 'owner':
        return 'bg-[#5e6ad2]/10 text-[#828fff] border border-[#5e6ad2]/30'
      case 'manager':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      case 'kitchen':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      default:
        return 'bg-[#141516] text-[#d0d6e0] border border-[#23252a]'
    }
  }

  return (
    <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#23252a]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#18191a] border border-[#2b2d35] flex items-center justify-center text-[#5e6ad2]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#f7f8f8] font-display">Workplace Team & Roles</h3>
              <span className="bg-[#141516] text-[#8a8f98] border border-[#23252a] text-[10px] rounded-full px-2 py-0.5 font-mono">
                {initialStaff.length} Member{initialStaff.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-[#8a8f98] mt-0.5">
              Add people to your workplace, assign roles (Manager or Kitchen), and manage access.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#1c0c0d] border border-[#361719] text-[#ff6b6b] text-xs p-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[#ff6b6b] hover:text-white text-xs ml-2 cursor-pointer font-bold">×</button>
        </div>
      )}

      {/* Main Content Layout: Add Staff Form & Team List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form: Add New Staff (5 cols) */}
        <div className="lg:col-span-5 bg-[#141516] border border-[#23252a] rounded-xl p-4.5 space-y-4">
          <h4 className="text-xs font-semibold text-[#f7f8f8] font-display uppercase tracking-wider text-ink-subtle">
            Add Workplace Member
          </h4>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8a8f98] font-semibold uppercase tracking-wider block font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="staff@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 bg-[#0f1011] text-[#f7f8f8] border border-[#23252a] rounded-md px-3 text-xs placeholder:text-[#62666d] focus:outline-none focus:border-[#34343a] focus:ring-1 focus:ring-[#5e69d1] transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8a8f98] font-semibold uppercase tracking-wider block font-mono">
                Assigned Workplace Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="w-full h-9 bg-[#0f1011] text-[#f7f8f8] border border-[#23252a] rounded-md px-3 text-xs focus:outline-none focus:border-[#34343a] focus:ring-1 focus:ring-[#5e69d1] transition-all font-sans cursor-pointer"
              >
                <option value="manager">Manager — Operations, Menu & Tables</option>
                <option value="kitchen">Kitchen Staff — Orders & Ticket Status Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-9 bg-[#5e6ad2] hover:bg-[#828fff] text-white text-xs font-medium rounded-md transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm font-sans"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Add Member</span>
                </>
              )}
            </button>
          </form>

          {/* Newly created credentials popup / details card */}
          {credentials && (
            <div className="bg-[#09150d] border border-[#14331e] rounded-xl p-4 space-y-3 mt-4 animate-fadeIn">
              <div className="flex items-start space-x-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#27a644]/20 text-[#27a644] text-[10px] font-bold border border-[#27a644]/40 mt-0.5">
                  ✓
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-[#f7f8f8] font-display">Staff Account Created</h5>
                  <p className="text-[11px] text-[#8a8f98] mt-0.5 leading-snug">
                    Share these temporary login details with the staff member.
                  </p>
                </div>
              </div>

              <div className="bg-[#0f1011] border border-[#23252a] rounded-lg p-3 space-y-2 relative font-sans">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#62666d]">Email</span>
                  <p className="text-xs text-[#f7f8f8] font-mono font-medium break-all">{credentials.email}</p>
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#62666d]">Temporary Password</span>
                  <p className="text-xs text-[#5e6ad2] font-mono font-semibold select-all">{credentials.password}</p>
                </div>

                <button
                  onClick={handleCopyPassword}
                  className="absolute top-3 right-3 text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer"
                  title="Copy details"
                >
                  {copied ? (
                    <span className="text-[9px] text-[#27a644] font-medium font-mono">Copied!</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                onClick={() => setCredentials(null)}
                className="w-full h-7 bg-[#141516] hover:bg-[#18191a] border border-[#23252a] text-[#8a8f98] hover:text-[#f7f8f8] text-[11px] font-medium rounded-md transition-colors cursor-pointer"
              >
                Dismiss Credentials
              </button>
            </div>
          )}
        </div>

        {/* List: Existing Workplace Staff (7 cols) */}
        <div className="lg:col-span-7 bg-[#141516] border border-[#23252a] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#f7f8f8] font-display uppercase tracking-wider text-ink-subtle">
              Active Team Members
            </h4>
            <span className="text-[10px] text-[#62666d] font-mono">
              {initialStaff.length} Account{initialStaff.length === 1 ? '' : 's'}
            </span>
          </div>

          {initialStaff.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#62666d]">
              No workplace team members registered yet.
            </div>
          ) : (
            <div className="divide-y divide-[#23252a] max-h-[360px] overflow-y-auto pr-1">
              {initialStaff.map((staff) => {
                const isSelf = staff.id === currentUserId
                return (
                  <div key={staff.id} className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-[#f7f8f8] font-medium truncate font-sans">
                          {staff.email}
                        </span>
                        {isSelf && (
                          <span className="bg-[#18191a] text-[#5e6ad2] border border-[#5e6ad2]/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#62666d] font-mono">
                        Added {new Date(staff.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wide ${getRoleBadgeStyle(staff.role)}`}>
                        {staff.role}
                      </span>

                      {!isSelf && (
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          disabled={removingId === staff.id}
                          className="text-[#62666d] hover:text-[#ff6b6b] p-1 rounded hover:bg-[#18191a] transition-colors cursor-pointer disabled:opacity-50"
                          title="Remove from workplace"
                        >
                          {removingId === staff.id ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
