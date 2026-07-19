'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

interface ConfirmationClientProps {
  orderId: string
  restaurantId: string
  tableId: string
  restaurantName: string
  receiptNumber: string
  initialTotalAmount: number
  initialPaymentMode: 'online_now' | 'online_at_end' | 'cash_at_counter'
  initialPaymentStatus: 'unpaid' | 'pending_online' | 'pending_cash' | 'paid'
}

type PaymentState = 'idle' | 'loading' | 'checkout_open' | 'verifying' | 'confirming' | 'paid' | 'error'

export function ConfirmationClient({
  orderId,
  restaurantId,
  tableId,
  restaurantName,
  receiptNumber,
  initialTotalAmount,
  initialPaymentMode,
  initialPaymentStatus
}: ConfirmationClientProps) {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [paymentState, setPaymentState] = useState<PaymentState>(
    initialPaymentStatus === 'paid' ? 'paid' : 'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  // Trigger Razorpay Checkout flow
  const triggerCheckout = async () => {
    setPaymentState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment transaction order.')
      }

      setPaymentState('checkout_open')

      const options = {
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: restaurantName,
        description: `Order Receipt: ${receiptNumber}`,
        order_id: data.razorpay_order_id,
        handler: async function (responsePayload: any) {
          setPaymentState('verifying')
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: orderId,
                razorpay_order_id: responsePayload.razorpay_order_id,
                razorpay_payment_id: responsePayload.razorpay_payment_id,
                razorpay_signature: responsePayload.razorpay_signature,
              })
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              setPaymentState('confirming')
            } else {
              throw new Error(verifyData.error || 'Lightweight verification failed.')
            }
          } catch (err: any) {
            console.error('Verification failed:', err)
            setPaymentState('error')
            setErrorMessage(err.message || 'Signature verification failed.')
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentState('idle')
          }
        },
        theme: {
          color: '#0007cd'
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (err: any) {
      console.error('Razorpay checkout initialization error:', err)
      setPaymentState('error')
      setErrorMessage(err.message || 'Failed to initialize payment checkout.')
    }
  }

  // Effect: Auto-trigger checkout if payment_mode is online_now and order is unpaid/pending
  useEffect(() => {
    if (
      initialPaymentMode === 'online_now' &&
      paymentStatus !== 'paid' &&
      scriptLoaded &&
      paymentState === 'idle'
    ) {
      triggerCheckout()
    }
  }, [scriptLoaded, initialPaymentMode])

  // Effect: Setup Supabase Realtime channel to subscribe to order updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`order-confirmation-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Realtime payment_status update:', payload.new.payment_status)
          const newStatus = payload.new.payment_status
          setPaymentStatus(newStatus)
          if (newStatus === 'paid') {
            setPaymentState('paid')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // Effect: Polling fallback to verify status if in verifying or confirming state
  useEffect(() => {
    if (paymentState !== 'confirming' && paymentState !== 'verifying') return

    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single()

      if (!error && data?.payment_status === 'paid') {
        setPaymentStatus('paid')
        setPaymentState('paid')
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentState, orderId])

  // Render state indicator / main content
  const isPaid = paymentStatus === 'paid' || paymentState === 'paid'

  return (
    <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl relative z-10">
      {/* Razorpay script loading */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          console.log('Razorpay checkout script loaded successfully')
          setScriptLoaded(true)
        }}
        onError={() => {
          console.error('Failed to load Razorpay checkout script')
          setErrorMessage('Failed to load Razorpay payment client. Please refresh page.')
        }}
      />

      {/* 1. Succeeded / Paid State */}
      {isPaid && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#33d17a]/10 text-[#33d17a] border border-[#33d17a]/20 shadow-[0_0_15px_rgba(51,209,122,0.1)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Order Paid!</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              Thank you! Your payment has been confirmed, and your order is being prepared.
            </p>
          </div>
        </>
      )}

      {/* 2. Loading / Processing States */}
      {!isPaid && (paymentState === 'loading' || paymentState === 'verifying' || paymentState === 'confirming') && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0007cd]/10 border border-[#0007cd]/20 relative">
            <svg className="animate-spin h-8 w-8 text-[#0007cd]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Processing Payment</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed font-mono">
              {paymentState === 'loading' && 'Creating transaction...'}
              {paymentState === 'verifying' && 'Verifying payment signatures...'}
              {paymentState === 'confirming' && 'Waiting for webhook confirmation...'}
            </p>
          </div>
        </>
      )}

      {/* 3. Checkout Open / Modal active */}
      {!isPaid && paymentState === 'checkout_open' && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0007cd]/10 border border-[#0007cd]/20 relative">
            <div className="absolute w-3 h-3 bg-[#0007cd] rounded-full animate-ping" />
            <svg className="w-8 h-8 text-[#0007cd] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Checkout Open</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              Please complete the transaction in the Razorpay Checkout popup.
            </p>
          </div>
        </>
      )}

      {/* 4. Cash at Counter State */}
      {!isPaid && initialPaymentMode === 'cash_at_counter' && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Order Received!</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              Your order has been sent to the kitchen. Please settle the bill at the cash counter.
            </p>
          </div>
        </>
      )}

      {/* 5. Online at End - Idle unpaid state / Retry State */}
      {!isPaid && paymentState === 'idle' && initialPaymentMode !== 'cash_at_counter' && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0007cd]/10 text-indigo-400 border border-[#0007cd]/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Order Placed!</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              {initialPaymentMode === 'online_at_end'
                ? 'Your order is recorded and preparing. You can pay online whenever you are ready.'
                : 'Your order is recorded. Please click the button below to complete your payment.'}
            </p>
          </div>
        </>
      )}

      {/* 6. Error State */}
      {!isPaid && paymentState === 'error' && (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-[#ff4d4d]">Payment Failed</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              {errorMessage || 'There was an issue processing your transaction. Please try again.'}
            </p>
          </div>
        </>
      )}

      {/* Order Info Panel (Always displayed) */}
      <div className="bg-[#222222] border border-[#333333] rounded-lg p-5 text-left space-y-3 font-mono text-xs">
        <div className="flex justify-between border-b border-[#333333] pb-2">
          <span className="text-[#888888]">Receipt #</span>
          <span className="text-white font-bold text-sm tracking-wide">{receiptNumber}</span>
        </div>
        <div className="flex justify-between border-b border-[#333333] pb-2">
          <span className="text-[#888888]">Payment Mode</span>
          <span className="text-white font-bold">
            {initialPaymentMode === 'online_now' && 'Pay Now (Online)'}
            {initialPaymentMode === 'online_at_end' && 'Pay Later (Online)'}
            {initialPaymentMode === 'cash_at_counter' && 'Cash at Counter'}
          </span>
        </div>
        <div className="flex justify-between border-b border-[#333333] pb-2">
          <span className="text-[#888888]">Status</span>
          <span
            className={`font-bold ${
              isPaid
                ? 'text-[#33d17a]'
                : paymentStatus.startsWith('pending')
                ? 'text-amber-500 animate-pulse'
                : 'text-[#a8a8a8]'
            }`}
          >
            {isPaid ? 'Paid' : paymentStatus.toUpperCase().replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="text-[#888888]">Total Amount</span>
          <span className="text-white font-bold text-sm">{formatPrice(initialTotalAmount)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-3">
        {/* Pay Now Button (shows if online payment is not complete, and not in loading/verifying/confirming states) */}
        {!isPaid && initialPaymentMode !== 'cash_at_counter' && (paymentState === 'idle' || paymentState === 'error') && (
          <button
            onClick={triggerCheckout}
            disabled={!scriptLoaded}
            className="w-full inline-flex items-center justify-center h-12 px-6 text-sm font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] disabled:opacity-50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] outline-none cursor-pointer"
          >
            {!scriptLoaded ? 'Loading Payment SDK...' : 'Pay Now'}
          </button>
        )}

        <button
          onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
          disabled={paymentState === 'loading' || paymentState === 'verifying' || paymentState === 'confirming'}
          className="w-full inline-flex items-center justify-center h-10 px-6 text-sm font-semibold text-[#a8a8a8] hover:text-white hover:bg-[#222222] border border-[#222222] disabled:opacity-50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] outline-none cursor-pointer"
        >
          {isPaid ? 'Order More Items' : 'Back to Menu'}
        </button>
      </div>
    </div>
  )
}
