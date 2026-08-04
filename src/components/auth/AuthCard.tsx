'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCard({
  title,
  subtitle,
  children,
}: AuthCardProps) {
  const pathname = usePathname()
  const isStaffTab = pathname.startsWith('/dashboard/login')
  const isAdminTab = pathname.startsWith('/admin/login')

  return (
    <main className="min-h-screen w-full bg-canvas text-ink font-sans flex flex-col items-center justify-center p-4 selection:bg-primary/20 selection:text-ink">
      {/* Container */}
      <div className="w-full max-w-[380px] space-y-6">
        {/* Top Header: Brand Mark & Home Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2 text-xs font-medium text-ink-muted hover:text-ink transition-all shadow-sm group"
          >
            <svg
              className="w-3.5 h-3.5 text-ink-tertiary group-hover:text-ink group-hover:-translate-x-0.5 transition-all"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>koyo.app</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline text-xs font-medium text-ink shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-display font-semibold tracking-tight">Koyo </span>
          </div>
        </div>

        {/* Card Panel */}
        <div className="bg-surface-1 border border-hairline rounded-lg p-6 sm:p-7 shadow-product space-y-5">
          {/* Portal Switcher */}
          <div className="p-0.5 bg-canvas border border-hairline rounded-md grid grid-cols-2 gap-0.5 text-xs font-medium">
            <Link
              href="/dashboard/login"
              className={`py-1.5 text-center rounded transition-colors ${
                isStaffTab
                  ? 'bg-surface-2 text-ink font-semibold'
                  : 'text-ink-subtle hover:text-ink'
              }`}
            >
              Kitchen Staff
            </Link>
            <Link
              href="/admin/login"
              className={`py-1.5 text-center rounded transition-colors ${
                isAdminTab
                  ? 'bg-surface-2 text-ink font-semibold'
                  : 'text-ink-subtle hover:text-ink'
              }`}
            >
              Super-Admin
            </Link>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-ink font-display">
              {title}
            </h1>
            <p className="text-xs text-ink-subtle leading-normal">
              {subtitle}
            </p>
          </div>

          {/* Form Body */}
          {children}
        </div>
      </div>
    </main>
  )
}
