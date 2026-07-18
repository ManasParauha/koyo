'use client'

import React from 'react'
import { useCart } from '@/context/CartContext'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number | string
  category: string
  image_url: string | null
  is_available: boolean
  is_veg: boolean
}

interface MenuItemCardProps {
  item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { cart, addToCart, updateQuantity, updateNotes } = useCart()

  const cartItem = cart.find((i) => i.menu_item_id === item.id)
  const quantity = cartItem ? cartItem.quantity : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handleAdd = () => {
    addToCart({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
    })
  }

  const handleIncrement = () => {
    updateQuantity(item.id, 1)
  }

  const handleDecrement = () => {
    updateQuantity(item.id, -1)
  }

  return (
    <div className="flex flex-col p-4 bg-[#181818] border border-[#222222] rounded-xl hover:border-[#333333] transition-all duration-200 shadow-sm">
      <div className="flex gap-4">
        {/* Item Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {/* Veg/Non-veg Indicator following Indian Convention */}
              {item.is_veg ? (
                <span
                  className="inline-flex items-center justify-center border border-emerald-600 p-[2px] rounded-[3px] w-4 h-4 bg-emerald-950/10 flex-shrink-0"
                  title="Veg"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span
                  className="inline-flex items-center justify-center border border-red-800 p-[2px] rounded-[3px] w-4 h-4 bg-red-950/10 flex-shrink-0"
                  title="Non-Veg"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-700" />
                </span>
              )}
              <h3 className="font-semibold text-white text-base tracking-tight truncate">
                {item.name}
              </h3>
            </div>
            {item.description && (
              <p className="text-xs text-[#a8a8a8] line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-sm font-semibold text-white tracking-wide">
              {formatPrice(Number(item.price))}
            </span>

            {/* In-place Action Button or Stepper */}
            <div className="relative z-10">
              {quantity === 0 ? (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center h-9 px-5 text-sm font-medium text-white bg-[#0007cd] hover:bg-[#0005a3] active:bg-[#0005a3] rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a26ff] focus:ring-offset-2 focus:ring-offset-[#181818]"
                >
                  Add
                </button>
              ) : (
                <div className="flex items-center bg-[#222222] border border-[#333333] rounded-md h-9 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="flex items-center justify-center w-9 h-full text-white text-lg font-semibold hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors duration-150 focus:outline-none"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-semibold text-white min-w-[24px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="flex items-center justify-center w-9 h-full text-white text-lg font-semibold hover:bg-[#2a2a2a] active:bg-[#333333] transition-colors duration-150 focus:outline-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image or Placeholder */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#0f0f0f] border border-[#222222]">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#181818] to-[#222222] text-[#666666]">
              <svg
                className="w-8 h-8 opacity-40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Optional Note Input (Appears only when quantity > 0) */}
      {quantity > 0 && (
        <div className="mt-3 pt-3 border-t border-[#222222]/50 animate-fadeIn">
          <input
            type="text"
            placeholder="Add customized notes (e.g. no onions, extra spicy)..."
            value={cartItem?.notes || ''}
            onChange={(e) => updateNotes(item.id, e.target.value)}
            className="w-full text-xs bg-[#0f0f0f] border border-[#222222] focus:border-[#0007cd] focus:ring-1 focus:ring-[#1a26ff] rounded-md px-2.5 py-1.5 text-white placeholder-[#666666] outline-none transition-all duration-200"
          />
        </div>
      )}
    </div>
  )
}
