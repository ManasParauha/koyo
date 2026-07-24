import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { PrintButton } from './PrintButton'

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
      light: '#ffffff'
    }
  })
}

export default async function PrintTablesPage({ params }: PageProps) {
  const { restaurantId } = await params

  const supabase = await createClient()

  // 1. Fetch current user session to ensure authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/dashboard/login')
  }

  // 2. Fetch staff details to verify access to this restaurantId
  const { data: staff } = await supabase
    .from('staff')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!staff || staff.restaurant_id !== restaurantId) {
    redirect('/dashboard/login')
  }

  // 3. Fetch restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // 4. Fetch all tables
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

  // 5. Ensure all tables have a QR code
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
    <div className="min-h-screen bg-[#0f0f0f] text-white print:bg-white print:text-black font-sans flex flex-col">
      {/* Control Panel (Hidden during printing) */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-6 sm:px-8 print:hidden">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-white text-lg tracking-tight uppercase">
            Print QR Codes
          </span>
          <span className="text-[#333333]">|</span>
          <span className="text-[#a8a8a8] text-sm hidden sm:inline">
            {restaurant.name}
          </span>
          <span className="text-[#333333] hidden sm:inline">|</span>
          <Link
            href={`/dashboard/${restaurantId}/tables`}
            className="text-xs text-[#a8a8a8] bg-[#181818] border border-[#222222] px-3 py-1.5 rounded-md hover:bg-[#222222] hover:text-white transition-all font-medium focus-visible:ring-2 focus-visible:ring-[#0007cd] focus-visible:outline-none"
          >
            ← Back to Tables
          </Link>
        </div>

        {/* Client component button to trigger print dialog */}
        <PrintButton />
      </header>

      {/* Printable Sheet (Standard A4 alignment) */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1200px] w-full mx-auto print:p-0 print:max-w-none">

        {/* On screen instructions */}
        <div className="mb-8 p-4 bg-[#181818] border border-[#222222] rounded-lg text-sm text-[#a8a8a8] print:hidden max-w-2xl">
          <p className="font-semibold text-white mb-1">Print Guidelines:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensure your printer scale is set to <strong className="text-white">100%</strong> or <strong className="text-white">Fit to page</strong>.</li>
            <li>Enable <strong className="text-white">Background graphics</strong> option in print settings to retain styling.</li>
            <li>We recommend selecting paper size <strong className="text-white">A4</strong> and layout <strong className="text-white">Portrait</strong>.</li>
          </ul>
        </div>

        {processedTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[#888888]">
            <p className="text-lg">No tables to print.</p>
            <p className="text-sm">Please register tables first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 print:grid-cols-2 print:gap-12 print:bg-white print:text-black">
            {processedTables.map((table) => {
              const menuPath = `/menu/${restaurantId}/${table.id}`
              return (
                <div
                  key={table.id}
                  className="flex flex-col items-center justify-center p-8 bg-[#181818] border border-[#222222] rounded-xl shadow-md break-inside-avoid print:bg-white print:border-zinc-300 print:text-black print:rounded-none print:shadow-none"
                >
                  {/* Outer frame to look like a placard */}
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#0007cd] print:text-[#0007cd] font-sans">
                      {restaurant.name}
                    </h4>

                    {/* QR Code Container */}
                    <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-inner flex items-center justify-center w-52 h-52 print:w-56 print:h-56 print:rounded-none print:border-none print:shadow-none">
                      {table.qr_code_url ? (
                        <img
                          src={table.qr_code_url}
                          alt={`QR Code Table ${table.table_number}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="bg-zinc-100 w-full h-full rounded" />
                      )}
                    </div>

                    {/* Placard details */}
                    <div className="text-center space-y-1">
                      <h3 className="text-2xl font-black text-white print:text-black tracking-tight font-mono uppercase">
                        Table {table.table_number}
                      </h3>
                      <p className="text-[10px] text-[#888888] print:text-zinc-500 font-mono tracking-wider truncate w-full max-w-[220px]">
                        {baseDomain.replace(/^https?:\/\//, '')}{menuPath}
                      </p>
                    </div>

                    <div className="w-12 h-0.5 bg-[#0007cd] print:bg-[#0007cd]" />
                    <p className="text-[9px] text-[#666666] print:text-zinc-400 font-medium tracking-wide uppercase text-center">
                      Scan QR Code to Order & Pay
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
