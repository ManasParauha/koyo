import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { CartReviewClient } from './CartReviewClient'

interface PageProps {
  params: Promise<{
    restaurantId: string
    tableId: string
  }>
}

export default async function CartPage({ params }: PageProps) {
  const { restaurantId, tableId } = await params

  const supabase = await createClient()

  // 1. Fetch restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name, upi_id')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Restaurant Not Found</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              We couldn't locate this restaurant. Please double check the QR code link.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 2. Fetch table & verify it belongs to restaurantId
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('table_number, restaurant_id')
    .eq('id', tableId)
    .single()

  if (tableError || !table || table.restaurant_id !== restaurantId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Invalid Table QR Code</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              This table link is invalid or doesn't belong to {restaurant.name}. Please scan the table's QR code again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <CartReviewClient
      restaurantName={restaurant.name}
      tableNumber={table.table_number}
      restaurantId={restaurantId}
      tableId={tableId}
    />
  )
}
