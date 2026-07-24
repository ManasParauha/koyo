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

  // Hide nav items if not logged in (e.g. on login page)
  const isLoggedIn = !!email

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="w-full h-16 bg-[#0f0f0f] border-b border-[#222222] flex items-center justify-between px-6 z-50">
      <div className="flex items-center space-x-8">
        <Link href="/admin/restaurants" className="flex items-center space-x-2.5">
          <span className="w-6 h-6 bg-[#0007cd] rounded flex items-center justify-center font-bold text-xs text-white">
            K
          </span>
          <span className="font-semibold text-sm tracking-tight text-white">
            Koyo Platform <span className="text-[#a8a8a8] font-normal text-xs ml-1">Admin</span>
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
            className="h-8 bg-[#222222] hover:bg-[#2a2a2a] text-white border border-[#333333] px-3.5 rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  )
}
