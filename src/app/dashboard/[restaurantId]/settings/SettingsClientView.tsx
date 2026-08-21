'use client'

import React, { useState } from 'react'
import { WorkplaceTeamManager, StaffMember } from './WorkplaceTeamManager'
import { ChangePasswordForm } from './ChangePasswordForm'

interface SettingsClientViewProps {
  isOwnerOrSuperAdmin: boolean
  restaurantId: string
  staffList: StaffMember[]
  currentUserId: string
  userEmail: string
}

export function SettingsClientView({
  isOwnerOrSuperAdmin,
  restaurantId,
  staffList,
  currentUserId,
  userEmail,
}: SettingsClientViewProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'security'>(
    isOwnerOrSuperAdmin ? 'team' : 'security'
  )

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Header Banner */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[#f7f8f8] tracking-tight font-display">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#8a8f98]">
          Manage your workplace team, roles, and personal account security for{' '}
          <span className="font-mono text-[#d0d6e0]">{userEmail}</span>.
        </p>
      </div>

      {/* Navigation Tabs (Displayed for Owner & Super Admin) */}
      {isOwnerOrSuperAdmin && (
        <div className="border-b border-[#23252a]">
          <nav className="flex space-x-1 sm:space-x-2 -mb-px" aria-label="Settings Tabs">
            <button
              onClick={() => setActiveTab('team')}
              className={`py-2.5 px-4 text-xs font-medium rounded-t-lg transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'team'
                  ? 'border-[#5e6ad2] text-[#f7f8f8] bg-[#0f1011]'
                  : 'border-transparent text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]/50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Workplace Team</span>
              <span className="bg-[#18191a] text-[#8a8f98] border border-[#23252a] text-[10px] rounded-full px-2 py-0.5 font-mono ml-1">
                {staffList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`py-2.5 px-4 text-xs font-medium rounded-t-lg transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'border-[#5e6ad2] text-[#f7f8f8] bg-[#0f1011]'
                  : 'border-transparent text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]/50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Change Password</span>
            </button>
          </nav>
        </div>
      )}

      {/* Tab Panels */}
      <div className="pt-2">
        {isOwnerOrSuperAdmin && activeTab === 'team' && (
          <WorkplaceTeamManager
            restaurantId={restaurantId}
            initialStaff={staffList}
            currentUserId={currentUserId}
          />
        )}

        {(!isOwnerOrSuperAdmin || activeTab === 'security') && (
          <ChangePasswordForm userEmail={userEmail} hideHeader />
        )}
      </div>
    </div>
  )
}
