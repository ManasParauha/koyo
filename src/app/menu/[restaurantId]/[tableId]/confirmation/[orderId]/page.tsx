import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { ConfirmationClient } from './ConfirmationClient'

interface PageProps {
  params: Promise<{
    restaurantId: string
    tableId: string
    orderId: string
  }>
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { restaurantId, tableId, orderId } = await params

  const supabase = await createClient()

  // Fetch the order from the database along with restaurant, table, and item details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      receipt_number,
      total_amount,
      payment_mode,
      payment_status,
      status,
      table_id,
      tables (
        table_number
      ),
      restaurants (
        name
      ),
      order_items (
        id,
        quantity,
        price_at_order,
        menu_items (
          name
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Order Not Found</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              We couldn't locate your order. Please ask the restaurant staff for assistance.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Handle single vs array type responses from Supabase joins
  const rawRestaurant = order.restaurants
  const restaurantName = Array.isArray(rawRestaurant)
    ? rawRestaurant[0]?.name
    : (rawRestaurant as any)?.name || 'Restaurant'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans relative overflow-hidden">
      {/* Blue Spotlight Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0007cd]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <ConfirmationClient
        orderId={orderId}
        restaurantId={restaurantId}
        tableId={tableId}
        restaurantName={restaurantName}
        receiptNumber={order.receipt_number || 'No Receipt'}
        initialTotalAmount={parseFloat(order.total_amount.toString())}
        initialPaymentMode={order.payment_mode as any}
        initialPaymentStatus={order.payment_status as any}
        initialStatus={order.status as any}
        initialTableNumber={(order.tables as any)?.table_number || '?'}
        initialOrderItems={(order.order_items || []) as any}
      />
    </main>
  )
}
