'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'

interface ConfirmationOrderItem {
  id: string
  quantity: number
  price_at_order: number | string
  menu_items: {
    name: string
  } | null
}

interface ConfirmationClientProps {
  orderId: string
  restaurantId: string
  tableId: string
  restaurantName: string
  receiptNumber: string
  initialTotalAmount: number
  initialPaymentMode: 'online_now' | 'online_at_end' | 'cash_at_counter'
  initialPaymentStatus: 'unpaid' | 'pending_online' | 'pending_cash' | 'paid'
  initialStatus: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
  initialTableNumber: string
  initialOrderItems: ConfirmationOrderItem[]
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
  initialPaymentStatus,
  initialStatus,
  initialTableNumber,
  initialOrderItems
}: ConfirmationClientProps) {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [status, setStatus] = useState(initialStatus)
  const [paymentState, setPaymentState] = useState<PaymentState>(
    initialPaymentStatus === 'paid' ? 'paid' : 'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Effect: Bulletproof Razorpay SDK presence detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).Razorpay) {
        setScriptLoaded(true)
        return
      }

      // Check periodically in case script is injected by Next.js but onLoad doesn't fire
      const interval = setInterval(() => {
        if ((window as any).Razorpay) {
          setScriptLoaded(true)
          clearInterval(interval)
        }
      }, 300)

      return () => clearInterval(interval)
    }
  }, [])

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
          console.log('Realtime order update received:', payload.new)
          const newPaymentStatus = payload.new.payment_status
          const newStatus = payload.new.status
          
          if (newPaymentStatus) {
            setPaymentStatus(newPaymentStatus)
            if (newPaymentStatus === 'paid') {
              setPaymentState('paid')
            }
          }
          if (newStatus) {
            setStatus(newStatus)
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
        .select('payment_status, status')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        if (data.payment_status === 'paid') {
          setPaymentStatus('paid')
          setPaymentState('paid')
          clearInterval(interval)
        }
        if (data.status) {
          setStatus(data.status)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentState, orderId])

  // Effect: General periodic polling fallback to keep client in sync with kitchen dashboard updates
  useEffect(() => {
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status, status')
        .eq('id', orderId)
        .single()

      if (!error && data) {
        if (data.status) setStatus(data.status)
        if (data.payment_status) {
          setPaymentStatus(data.payment_status)
          if (data.payment_status === 'paid') {
            setPaymentState('paid')
          }
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId])

  const isPaid = paymentStatus === 'paid' || paymentState === 'paid'

  // Helper: translate status to human readable format
  const getStatusText = (s: typeof status) => {
    switch (s) {
      case 'received': return 'Received'
      case 'preparing': return 'Preparing'
      case 'ready': return 'Ready'
      case 'served': return 'Served'
      case 'cancelled': return 'Cancelled'
      default: return s
    }
  }

  // Helper: Determine order status badge color
  const getStatusBadgeClass = (s: typeof status) => {
    switch (s) {
      case 'received':
        return 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
      case 'preparing':
        return 'bg-amber-950/40 text-amber-400 border border-amber-900/40 animate-pulse'
      case 'ready':
        return 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
      case 'served':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
      case 'cancelled':
        return 'bg-red-950/40 text-red-400 border border-red-900/40'
      default:
        return 'bg-[#222222] text-[#a8a8a8]'
    }
  }

  return (
    <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl relative z-10 font-sans">
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

      {/* 1. Header State Icon & Message */}
      {isPaid ? (
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#33d17a]/10 text-[#33d17a] border border-[#33d17a]/20 shadow-[0_0_15px_rgba(51,209,122,0.1)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Paid ✓</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              Your payment has been verified. The kitchen is preparing your meal.
            </p>
          </div>
        </div>
      ) : (
        <>
          {paymentState === 'loading' || paymentState === 'verifying' || paymentState === 'confirming' ? (
            <div className="space-y-4">
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
            </div>
          ) : paymentState === 'checkout_open' ? (
            <div className="space-y-4">
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
            </div>
          ) : initialPaymentMode === 'cash_at_counter' ? (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Order Received!</h1>
                <p className="text-[#a8a8a8] text-sm leading-relaxed">
                  Please settle the bill at the cash counter.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0007cd]/10 text-indigo-400 border border-[#0007cd]/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Order Placed!</h1>
                <p className="text-[#a8a8a8] text-sm leading-relaxed">
                  Your order is registered in our system and is currently preparing.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. Fail / Error alert */}
      {paymentState === 'error' && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-left text-xs text-red-400 space-y-1 leading-relaxed">
          <div className="font-semibold text-sm flex items-center space-x-1.5">
            <span>⚠️</span>
            <span>Payment Failed</span>
          </div>
          <p>{errorMessage || 'There was an issue processing your transaction. Please try again.'}</p>
        </div>
      )}

      {/* 3. Primary Order Receipt (Large and prominent) */}
      <div className="bg-[#1e1e1e] border border-[#262626] rounded-xl p-6 text-center space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#888888] font-mono">
          Receipt Number
        </span>
        <div className="text-3xl font-black tracking-widest text-white font-mono uppercase">
          {receiptNumber}
        </div>
        <div className="text-xs text-[#a8a8a8] font-medium font-mono">
          Table: <span className="text-white font-bold">{initialTableNumber}</span>
        </div>
      </div>

      {/* 4. Badges: Order Status & Payment Status */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#888888]">Order Status:</span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${getStatusBadgeClass(status)}`}>
            {getStatusText(status)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#888888]">Payment:</span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
            isPaid
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
              : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
          }`}>
            {isPaid ? 'Paid' : 'Payment Pending'}
          </span>
        </div>
      </div>

      {/* 5. Itemized Order Summary */}
      <div className="bg-[#111111] border border-[#222222] rounded-lg p-5 text-left space-y-4 font-mono text-xs">
        <div className="text-[#888888] font-sans text-[11px] font-bold uppercase tracking-wider border-b border-[#222222] pb-2">
          Ordered Items
        </div>
        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
          {initialOrderItems.map((item) => {
            const price = parseFloat(item.price_at_order.toString())
            const subtotal = item.quantity * price
            return (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex items-start space-x-2 text-white max-w-[70%]">
                  <span className="text-[#0007cd] font-bold text-sm">{item.quantity}x</span>
                  <span className="break-words font-sans">{item.menu_items?.name || 'Unknown Item'}</span>
                </div>
                <span className="text-[#a8a8a8]">{formatPrice(subtotal)}</span>
              </div>
            )
          })}
        </div>
        <div className="border-t border-[#222222] pt-3 flex justify-between items-center text-sm font-bold text-white font-sans">
          <span>Total Amount</span>
          <span className="text-white text-base">{formatPrice(initialTotalAmount)}</span>
        </div>
      </div>

      {/* 6. Contextual Instructions Block */}
      {isPaid ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-left text-xs text-emerald-400 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-sm flex items-center space-x-1.5">
            <span>✓</span>
            <span>Payment Completed</span>
          </div>
          <p>
            Your bill has been settled successfully. Thank you for dining with us! You can follow your order status on this page.
          </p>
        </div>
      ) : initialPaymentMode === 'cash_at_counter' ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-left text-xs text-amber-400 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-sm flex items-center space-x-1.5">
            <span>💵</span>
            <span>Pay at the Counter</span>
          </div>
          <p>
            Please pay <strong className="text-white">{formatPrice(initialTotalAmount)}</strong> at the counter and mention Receipt <strong className="text-white">#{receiptNumber}</strong>.
          </p>
          <p>
            Your order status remains "Payment Pending" until staff updates the system.
          </p>
        </div>
      ) : initialPaymentMode === 'online_now' ? (
        <div className="bg-[#0007cd]/10 border border-[#0007cd]/20 rounded-lg p-4 text-left text-xs text-[#a8a8a8] space-y-1.5 leading-relaxed">
          <div className="font-semibold text-sm text-white flex items-center space-x-1.5">
            <span>💳</span>
            <span>Payment Required</span>
          </div>
          <p>
            This order requires online payment before preparation. Please tap "Complete Payment" below to open Razorpay and pay <strong className="text-white">{formatPrice(initialTotalAmount)}</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-4 text-left text-xs text-[#a8a8a8] space-y-1.5 leading-relaxed">
          <div className="font-semibold text-sm text-indigo-400 flex items-center space-x-1.5">
            <span>🍽️</span>
            <span>Pay at End</span>
          </div>
          <p>
            You can add more items before paying. Settle the bill of <strong className="text-white">{formatPrice(initialTotalAmount)}</strong> whenever you are ready.
          </p>
        </div>
      )}

      {/* 7. Action Controls */}
      <div className="pt-2 flex flex-col gap-3">
        {/* Complete Payment/Pay Now trigger buttons for Online Modes */}
        {!isPaid && initialPaymentMode !== 'cash_at_counter' && (paymentState === 'idle' || paymentState === 'error') && (
          <button
            onClick={triggerCheckout}
            disabled={!scriptLoaded}
            className="w-full inline-flex items-center justify-center h-12 px-6 text-sm font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] disabled:opacity-50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] outline-none cursor-pointer"
          >
            {!scriptLoaded ? 'Loading Payment SDK...' : initialPaymentMode === 'online_now' ? 'Complete Payment' : 'Pay Now'}
          </button>
        )}

        {/* Small Add More Items Button */}
        <button
          onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
          disabled={paymentState === 'loading' || paymentState === 'verifying' || paymentState === 'confirming'}
          className="w-full inline-flex items-center justify-center h-10 px-6 text-sm font-semibold text-[#a8a8a8] hover:text-white hover:bg-[#222222] border border-[#222222] disabled:opacity-50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] outline-none cursor-pointer"
        >
          {isPaid ? 'Order More Items' : 'Add More Items'}
        </button>
      </div>
    </div>
  )
}
