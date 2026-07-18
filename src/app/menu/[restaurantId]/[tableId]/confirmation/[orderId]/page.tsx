import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  // Fetch the order from the database to get the receipt number
  const { data: order, error } = await supabase
    .from('orders')
    .select('receipt_number, total_amount')
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans relative overflow-hidden">
      {/* Blue Spotlight Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0007cd]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl relative z-10">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#33d17a]/10 text-[#33d17a] border border-[#33d17a]/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Order Placed!</h1>
          <p className="text-[#a8a8a8] text-sm leading-relaxed">
            Thank you for your order. We are preparing it fresh for you.
          </p>
        </div>

        {/* Receipt and ID Info Box */}
        <div className="bg-[#222222] border border-[#333333] rounded-lg p-5 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between border-b border-[#333333] pb-2">
            <span className="text-[#888888]">Receipt #</span>
            <span className="text-white font-bold text-sm tracking-wide">{order.receipt_number}</span>
          </div>
          <div className="flex justify-between border-b border-[#333333] pb-2">
            <span className="text-[#888888]">Order ID</span>
            <span className="text-[#a8a8a8] select-all truncate max-w-[180px]">{orderId}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-[#888888]">Total Amount</span>
            <span className="text-white font-bold">{formatPrice(parseFloat(order.total_amount.toString()))}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Link
            href={`/menu/${restaurantId}/${tableId}`}
            className="w-full inline-flex items-center justify-center h-10 px-6 text-sm font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] outline-none cursor-pointer"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </main>
  )
}
