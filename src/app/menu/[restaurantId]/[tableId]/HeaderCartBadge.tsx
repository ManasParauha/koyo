'use client'

import React, { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'

export function HeaderCartBadge() {
  const { totalItems } = useCart()
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (totalItems > 0) {
      setBounce(true)
      const timer = setTimeout(() => setBounce(false), 300)
      return () => clearTimeout(timer)
    }
  }, [totalItems])

  if (totalItems === 0) {
    return (
      <div className="text-[11px] font-semibold tracking-wider text-[#888888] uppercase bg-[#222222] px-2.5 py-1 rounded-full transition-all duration-300">
        Menu
      </div>
    )
  }

  return (
    <div
      className={`flex items-center space-x-1.5 bg-[#0007cd] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg shadow-[#0007cd]/20 transition-all duration-300 cursor-pointer ${
        bounce ? 'scale-110' : 'scale-100'
      }`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      <span className="font-semibold tracking-wide">Cart ({totalItems})</span>
    </div>
  )
}
