'use client'

import React, { createContext, useContext, useState, useMemo } from 'react'

export interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  notes?: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity' | 'notes'>) => void
  removeFromCart: (menu_item_id: string) => void
  updateQuantity: (menu_item_id: string, delta: number) => void
  updateNotes: (menu_item_id: string, notes: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (item: Omit<CartItem, 'quantity' | 'notes'>) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.menu_item_id)
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (menu_item_id: string) => {
    setCart((prev) => prev.filter((i) => i.menu_item_id !== menu_item_id))
  }

  const updateQuantity = (menu_item_id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menu_item_id === menu_item_id) {
            const newQty = i.quantity + delta
            return { ...i, quantity: newQty }
          }
          return i
        })
        .filter((i) => i.quantity > 0)
    })
  }

  const updateNotes = (menu_item_id: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.menu_item_id === menu_item_id
          ? { ...i, notes: notes || undefined }
          : i
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
