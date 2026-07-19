import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { KitchenFeed, Order } from './KitchenFeed'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export default async function KitchenDashboardPage({ params }: PageProps) {
  const { restaurantId } = await params

  const supabase = await createClient()

  // 1. Fetch restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
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
              We couldn't find the restaurant dashboard you are looking for. Please verify the URL.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 2. Fetch initial active orders (ordered by oldest first)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      restaurant_id,
      table_id,
      status,
      payment_mode,
      payment_status,
      receipt_number,
      total_amount,
      created_at,
      updated_at,
      tables (
        table_number
      ),
      order_items (
        id,
        quantity,
        notes,
        item_status,
        price_at_order,
        menu_items (
          name
        )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .neq('status', 'served')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true })

  if (ordersError) {
    console.error('Error fetching initial orders:', ordersError)
  }

  // Typecast returned object to our Client Component Order type format
  const initialOrdersList = (orders || []) as unknown as Order[]

  return (
    <KitchenFeed
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      initialOrders={initialOrdersList}
    />
  )
}
