import React from 'react'
import { verifySession } from '@/lib/dal'
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
  const session = await verifySession()

  // On admin login page or unauthenticated state, render clean children without layout wrapper
  if (!session?.user || session.user.role !== 'super_admin') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-canvas text-ink-muted font-sans flex flex-col antialiased selection:bg-primary/20 selection:text-ink">
      {/* Top Navbar */}
      <AdminNav email={session.user.email || null} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full bg-canvas border-t border-hairline py-6 px-6 text-center text-xs text-ink-tertiary">
        &copy; {new Date().getFullYear()} Koyo Platform. All rights reserved.
      </footer>
    </div>
  )
}
