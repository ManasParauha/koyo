'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

export function CartBottomBar() {
  const { totalItems, totalPrice } = useCart()
  const params = useParams()
  const router = useRouter()

  if (totalItems === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handleViewCart = () => {
    const restaurantId = params.restaurantId
    const tableId = params.tableId
    if (restaurantId && tableId) {
      router.push(`/menu/${restaurantId}/${tableId}/cart`)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[480px] md:-translate-x-1/2 z-50 bg-[#181818]/95 backdrop-blur-md border border-[#222222] px-5 py-4 rounded-xl flex items-center justify-between shadow-2xl shadow-[#000000]/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-[#a8a8a8] tracking-wide">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
        <span className="text-base font-bold text-white tracking-wide truncate">
          {formatPrice(totalPrice)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleViewCart}
        className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] rounded-md transition-all duration-200 shadow-md shadow-[#0007cd]/30 focus:outline-none focus:ring-2 focus:ring-[#1a26ff] focus:ring-offset-2 focus:ring-offset-[#181818] cursor-pointer"
      >
        View Cart
      </button>
    </div>
  )
}
