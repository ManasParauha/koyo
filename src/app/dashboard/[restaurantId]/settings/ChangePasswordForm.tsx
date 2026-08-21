'use client'

import React, { useState } from 'react'
import { changePasswordAction } from './actions'

interface ChangePasswordFormProps {
  userEmail: string
  hideHeader?: boolean
}

export function ChangePasswordForm({ userEmail, hideHeader = false }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from your current password.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.success) {
        setSuccessMsg(res.message || 'Password updated successfully.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={hideHeader ? 'space-y-6' : 'max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6'}>
      {/* Header Banner */}
      {!hideHeader && (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#f7f8f8] tracking-tight font-display">
            Account Settings
          </h2>
          <p className="text-xs sm:text-sm text-[#8a8f98]">
            Manage your security preferences and update your account password for <span className="font-mono text-[#d0d6e0]">{userEmail}</span>.
          </p>
        </div>
      )}

      {/* Change Password Card */}
      <div className="bg-[#0f1011] border border-[#23252a] rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-[#23252a]">
          <div className="w-8 h-8 rounded-lg bg-[#18191a] border border-[#2b2d35] flex items-center justify-center text-[#5e6ad2]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f7f8f8] font-display">Change Password</h3>
            <p className="text-xs text-[#8a8f98]">Ensure your account is using a strong password.</p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-[#09150d] border border-[#14331e] text-[#27a644] text-xs flex items-center space-x-2.5 animate-fadeIn">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-[#1c0c0d] border border-[#361719] text-[#ff4d4d] text-xs flex items-center space-x-2.5 animate-fadeIn">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#d0d6e0]">Current Password</label>
            <div className="relative flex items-center">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-9 px-3 pr-10 text-xs bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-md focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-colors placeholder:text-[#62666d]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-2.5 text-[#8a8f98] hover:text-[#f7f8f8] p-1 transition-colors"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.855-6.855a3 3 0 004.243 4.243M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#d0d6e0]">New Password</label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full h-9 px-3 pr-10 text-xs bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-md focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-colors placeholder:text-[#62666d]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 text-[#8a8f98] hover:text-[#f7f8f8] p-1 transition-colors"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.855-6.855a3 3 0 004.243 4.243M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {newPassword && (
              <p className={`text-[11px] font-mono ${newPassword.length >= 6 ? 'text-[#27a644]' : 'text-[#8a8f98]'}`}>
                {newPassword.length >= 6 ? '✓ Minimum 6 characters met' : '• Must be at least 6 characters'}
              </p>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#d0d6e0]">Confirm New Password</label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-9 px-3 pr-10 text-xs bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-md focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-colors placeholder:text-[#62666d]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 text-[#8a8f98] hover:text-[#f7f8f8] p-1 transition-colors"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.046 10.046 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.855-6.855a3 3 0 004.243 4.243M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-[11px] font-mono ${newPassword === confirmPassword ? 'text-[#27a644]' : 'text-[#ff4d4d]'}`}>
                {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
              </p>
            )}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 bg-[#5e6ad2] hover:bg-[#828fff] disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-all duration-150 shadow-sm flex items-center justify-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e6ad2]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
