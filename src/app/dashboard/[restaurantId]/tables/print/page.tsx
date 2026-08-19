import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { PrintButton } from './PrintButton'
import { TablePlacardGrid } from './TablePlacardGrid'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

// Helper to generate QR code on the fly if needed
async function getQRCodeDataUrl(restaurantId: string, tableId: string) {
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const menuUrl = `${baseDomain}/menu/${restaurantId}/${tableId}`
  return await QRCode.toDataURL(menuUrl, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

export default async function PrintTablesPage({ params }: PageProps) {
  const { restaurantId } = await params

  // 1. DAL security check for Owner or Manager role
  const { isAuthorized, reason, session } = await checkAuthorization(['owner', 'manager'], restaurantId)

  if (!isAuthorized || !session) {
    if (reason === 'UNAUTHENTICATED') {
      redirect('/dashboard/login')
    }
    redirect(`/dashboard/${restaurantId}`)
  }

  const supabase = getSupabaseForSession(session)

  // 2. Fetch restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // 3. Fetch all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, restaurant_id, table_number, qr_code_url, created_at')
    .eq('restaurant_id', restaurantId)

  // Sort tables numerically/alphabetically
  const sortedTables = (tables || []).sort((a, b) => {
    const numA = parseInt(a.table_number, 10)
    const numB = parseInt(b.table_number, 10)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.table_number.localeCompare(b.table_number)
  })

  // 4. Ensure all tables have a QR code
  const processedTables = await Promise.all(
    sortedTables.map(async (table) => {
      if (!table.qr_code_url) {
        try {
          const qr = await getQRCodeDataUrl(restaurantId, table.id)
          await supabase
            .from('tables')
            .update({ qr_code_url: qr })
            .eq('id', table.id)
          return { ...table, qr_code_url: qr }
        } catch (err) {
          console.error(`Failed to auto-generate QR code for table ${table.table_number}:`, err)
          return table
        }
      }
      return table
    })
  )

  const baseDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] print:bg-white print:text-black font-sans flex flex-col antialiased selection:bg-[#5e6ad2]/30 selection:text-[#f7f8f8]">
      {/* Control Panel Header (Hidden during printing) */}
      <header className="sticky top-0 z-40 bg-[#010102]/90 backdrop-blur-xl border-b border-[#23252a] h-14 flex items-center justify-between px-4 sm:px-8 print:hidden">
        {/* Left: Breadcrumbs & Restaurant Identity */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs">
          <Link
            href={`/dashboard/${restaurantId}/tables`}
            className="text-[#8a8f98] hover:text-[#f7f8f8] transition-colors flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-[#5e6ad2] focus-visible:outline-none rounded px-1.5 py-0.5"
            aria-label="Back to Table Manager"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Tables</span>
          </Link>

          <span className="text-[#34343a]">/</span>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#f7f8f8] tracking-tight uppercase font-mono text-[11px] sm:text-xs">
              Print Placards
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#141516] text-[#8a8f98] border border-[#23252a]">
              {restaurant.name}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <PrintButton totalTables={processedTables.length} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full mx-auto print:p-0 print:max-w-none">
        {/* Header Title Section (Screen Only) */}
        <div className="mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#23252a] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#5e6ad2] font-mono">
                  Placard Export System
                </span>
                <span className="h-1 w-1 rounded-full bg-[#5e6ad2]" />
                <span className="text-xs text-[#8a8f98] font-mono">A4 Ready</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f7f8f8] mt-1 font-sans">
                Table QR Display Placards
              </h1>
            </div>
            <p className="text-xs text-[#8a8f98] max-w-sm">
              High-resolution QR code placards formatted for physical table display stands and menu access.
            </p>
          </div>
        </div>

        {/* Table Placard Interactive Grid & Specs */}
        <TablePlacardGrid
          tables={processedTables}
          restaurantName={restaurant.name}
          restaurantId={restaurantId}
          baseDomain={baseDomain}
        />
      </main>
    </div>
  )
}
