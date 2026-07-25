'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdminNavProps {
  email: string | null
}

export default function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  if (pathname === '/admin/login') {
    return null
  }

  // Hide nav items if not logged in (e.g. on login page)
  const isLoggedIn = !!email

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="w-full h-16 bg-canvas border-b border-hairline flex items-center justify-between px-6 z-50">
      <div className="flex items-center space-x-8">
        <Link href="/admin/restaurants" className="flex items-center">
          <span className="font-semibold text-sm tracking-tight text-ink font-display">
            Koyo Platform <span className="text-ink-subtle font-normal text-xs ml-1">Admin</span>
          </span>
        </Link>

        {isLoggedIn && (
          <nav className="hidden md:flex space-x-6 text-sm">
            <Link
              href="/admin/restaurants"
              className={`transition-colors font-medium ${
                pathname.startsWith('/admin/restaurants')
                  ? 'text-white'
                  : 'text-[#a8a8a8] hover:text-white'
              }`}
            >
              Restaurants
            </Link>
          </nav>
        )}
      </div>

      {isLoggedIn && (
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-block text-xs text-[#a8a8a8]">
            {email}
          </span>
          <button
            onClick={handleLogout}
            className="h-8 bg-surface-2 hover:bg-surface-3 text-ink border border-hairline px-3.5 rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
