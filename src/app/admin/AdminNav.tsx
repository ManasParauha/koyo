'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface AdminNavProps {
  email: string | null
}

export default function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return null
  }

  // Hide nav items if not logged in
  const isLoggedIn = !!email

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <header className="sticky top-0 w-full h-14 bg-canvas/80 backdrop-blur-md border-b border-hairline flex items-center justify-between px-4 sm:px-6 z-50">
      <div className="flex items-center space-x-6">
        <Link href="/admin/restaurants" className="flex items-center group">
          <span className="font-semibold text-sm tracking-tight text-ink font-display flex items-center gap-1.5">
            Koyo <span className="text-[10px] font-mono tracking-widest uppercase text-ink-tertiary bg-surface-2 border border-hairline px-1.5 py-0.5 rounded">Admin</span>
          </span>
        </Link>

        {isLoggedIn && (
          <nav className="hidden md:flex items-center space-x-1 text-xs">
            <Link
              href="/admin/restaurants"
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                pathname.startsWith('/admin/restaurants')
                  ? 'bg-surface-2 text-ink border border-hairline'
                  : 'text-ink-subtle hover:text-ink hover:bg-surface-1'
              }`}
            >
              Restaurants
            </Link>
          </nav>
        )}
      </div>

      {isLoggedIn && (
        <div className="flex items-center space-x-3.5">
          <span className="hidden sm:inline-block text-xs font-mono text-ink-subtle">
            {email}
          </span>
          <button
            onClick={handleLogout}
            className="h-8 bg-surface-1 hover:bg-surface-2 text-ink-muted hover:text-ink border border-hairline px-3 rounded-md text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
