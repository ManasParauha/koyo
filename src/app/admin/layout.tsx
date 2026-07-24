import React from 'react'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'

export const metadata = {
  title: 'Koyo Platform Admin',
  description: 'Manage restaurants and onboarding on Koyo QR ordering platform.',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col antialiased">
      {/* Top Navbar */}
      <AdminNav email={user?.email || null} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Blue Spotlight Glow Backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0007cd]/5 rounded-full blur-[140px] pointer-events-none z-0" />

        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0f0f0f] border-t border-[#1a1a1a] py-6 px-6 text-center text-xs text-[#666666]">
        &copy; {new Date().getFullYear()} Koyo Platform. All rights reserved.
      </footer>
    </div>
  )
}
