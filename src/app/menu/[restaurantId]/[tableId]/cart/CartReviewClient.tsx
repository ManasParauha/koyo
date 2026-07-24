'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, PaymentMode } from '@/context/CartContext'

interface CartReviewClientProps {
  restaurantName: string
  tableNumber: string
  restaurantId: string
  tableId: string
}

export function CartReviewClient({
  restaurantName,
  tableNumber,
  restaurantId,
  tableId
}: CartReviewClientProps) {
  const router = useRouter()
  const {
    cart,
    updateQuantity,
    updateNotes,
    totalPrice,
    totalItems,
    paymentMode,
    setPaymentMode,
    clearCart
  } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)

  // Clear the cart only when the component unmounts after a successful order.
  // This prevents the visual flashing of the 'Your cart is empty' screen
  // while Next.js is transitioning to the confirmation page.
  useEffect(() => {
    return () => {
      if (orderPlaced) {
        clearCart()
      }
    }
  }, [orderPlaced, clearCart])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handlePlaceOrder = async () => {
    if (!paymentMode || isSubmitting) return

    if (typeof window !== 'undefined' && !navigator.onLine) {
      setError("You're offline, reconnect to place your order.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          tableId,
          payment_mode: paymentMode,
          items: cart.map((item) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: item.notes || '',
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong while placing your order.')
      }

      // Success: set orderPlaced to true to trigger cleanup on unmount, then navigate
      setOrderPlaced(true)
      router.push(`/menu/${restaurantId}/${tableId}/confirmation/${data.orderId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Render Empty State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
              className="text-white hover:text-[#a8a8a8] transition-colors p-1 -ml-1 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] rounded-md outline-none"
              aria-label="Go back to menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-white text-base sm:text-lg tracking-tight truncate">
              Review Order
            </span>
          </div>
          <span className="text-white text-xs font-semibold bg-[#181818] border border-[#222222] px-2.5 py-1 rounded-md flex-shrink-0">
            Table {tableNumber}
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#181818] border border-[#222222] text-[#888888] mb-6">
            <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">Your cart is empty</h2>
          <p className="text-sm text-[#888888] mb-8 leading-relaxed">
            Looks like you haven{"'"}t added anything to your cart yet. Let{"'"}s go back and explore the menu!
          </p>
          <button
            onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
            className="w-full inline-flex items-center justify-center h-12 px-6 text-sm font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] outline-none cursor-pointer"
          >
            Browse Menu
          </button>
        </main>
      </div>
    )
  }

  const paymentModes = [
    {
      id: 'online_now' as const,
      title: 'Pay Now (Online)',
      description: 'Pay instantly using UPI, Cards, or Netbanking.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'online_at_end' as const,
      title: 'Pay Later (Online, at end of meal)',
      description: 'Keep ordering. Pay for all items at the end.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'cash_at_counter' as const,
      title: 'Pay at Counter (Cash)',
      description: 'Pay with cash or card directly to the server.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans pb-32 flex flex-col relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3 max-w-[80%]">
          <button
            onClick={() => !isSubmitting && router.push(`/menu/${restaurantId}/${tableId}`)}
            disabled={isSubmitting}
            className="text-white hover:text-[#a8a8a8] transition-colors p-1 -ml-1 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] rounded-md outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back to menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-white text-base sm:text-lg tracking-tight truncate">
            Review Order
          </span>
        </div>
        <span className="text-white text-xs font-semibold bg-[#181818] border border-[#222222] px-2.5 py-1 rounded-md flex-shrink-0">
          Table {tableNumber}
        </span>
      </header>

      {/* Main Review Section */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-[#ff4d4d] px-4 py-3 rounded-lg text-sm flex items-start space-x-2 animate-fadeIn">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Cart Items Card */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wider uppercase">Your Items</h2>
          <div className="bg-[#181818] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222]/50 shadow-sm">
            {cart.map((item) => (
              <div key={item.menu_item_id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  {/* Name and unit price */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-white text-sm sm:text-base tracking-tight truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#888888] font-medium tracking-wide mt-0.5">
                      {formatPrice(item.price)} each
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex-shrink-0 flex items-center bg-[#222222] border border-[#333333] rounded-md h-8 overflow-hidden">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      className="flex items-center justify-center w-8 h-full text-white hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors duration-150 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <span className="text-lg leading-none font-semibold select-none">-</span>
                    </button>
                    <span className="px-2 text-xs font-semibold text-white min-w-[20px] text-center select-none tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      className="flex items-center justify-center w-8 h-full text-white hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors duration-150 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <span className="text-lg leading-none font-semibold select-none">+</span>
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right flex-shrink-0 min-w-[70px]">
                    <span className="text-sm font-semibold text-white tracking-wide tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Editable Notes Field */}
                <div className="pt-1">
                  <label htmlFor={`notes-${item.menu_item_id}`} className="sr-only">
                    Notes for {item.name}
                  </label>
                  <input
                    id={`notes-${item.menu_item_id}`}
                    type="text"
                    disabled={isSubmitting}
                    placeholder="Add customized notes (e.g. no onions, extra spicy)…"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.menu_item_id, e.target.value)}
                    autoComplete="off"
                    className="w-full text-xs bg-[#0f0f0f] border border-[#222222] focus:border-[#0007cd] focus:ring-1 focus:ring-[#1a26ff] rounded-md px-3 py-2 text-white placeholder-[#666666] outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => !isSubmitting && router.push(`/menu/${restaurantId}/${tableId}`)}
              disabled={isSubmitting}
              className="inline-flex items-center text-xs font-semibold text-[#a8a8a8] hover:text-white transition-colors py-1 focus-visible:ring-2 focus-visible:ring-[#1a26ff] rounded-md outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add more items
            </button>
          </div>
        </section>

        {/* Payment Mode Selection Card */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">Payment Mode</h2>
            <p className="text-xs text-[#888888] mt-1">Please select how you would like to pay for your meal.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {paymentModes.map((mode) => {
              const isSelected = paymentMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && setPaymentMode(mode.id)}
                  onKeyDown={(e) => {
                    if (isSubmitting) return
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      setPaymentMode(mode.id)
                    }
                  }}
                  className={`w-full flex items-start p-4 rounded-xl border text-left transition-all duration-200 outline-none ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'border-[#0007cd] bg-[#0007cd]/5 ring-1 ring-[#0007cd]'
                      : 'border-[#222222] bg-[#181818] hover:border-[#333333]'
                  } focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]`}
                  aria-checked={isSelected}
                  role="radio"
                >
                  <div className={`mt-0.5 mr-3 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border ${
                    isSelected ? 'border-[#0007cd] text-[#0007cd]' : 'border-[#666666] text-[#888888]'
                  }`}>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0007cd]" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[#888888] ${isSelected ? 'text-white' : ''}`}>
                        {mode.icon}
                      </span>
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {mode.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#a8a8a8] mt-1 font-normal leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Order Summary Summary */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-white tracking-wider uppercase">Order Summary</h2>
          <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-[#a8a8a8]">Items Subtotal</span>
              <span className="text-white font-medium tabular-nums">{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-[#a8a8a8]">Taxes & Service Charge</span>
              <span className="text-white font-medium text-emerald-500 font-semibold">Free</span>
            </div>
            <div className="border-t border-[#222222] pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Grand Total</span>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Place Order Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818]/95 backdrop-blur-md border-t border-[#222222] p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold text-[#888888] tracking-wider uppercase">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
            <span className="text-lg font-bold text-white tracking-wide truncate tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <button
            type="button"
            disabled={!paymentMode || isSubmitting}
            onClick={handlePlaceOrder}
            className={`inline-flex items-center justify-center h-12 px-6 text-sm font-semibold text-white rounded-md transition-all duration-200 shadow-lg outline-none select-none ${
              paymentMode && !isSubmitting
                ? 'bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] shadow-[#0007cd]/30 focus-visible:ring-2 focus-visible:ring-[#1a26ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] cursor-pointer'
                : 'bg-[#222222] text-[#666666] border border-[#333333] shadow-none cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing Order...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
