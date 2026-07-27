'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface MenuItem {
  name: string
}

interface OrderItem {
  id: string
  quantity: number
  notes: string | null
  item_status: string
  price_at_order: number | string
  menu_items: MenuItem | null
}

interface Table {
  table_number: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  status: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled'
  payment_mode: 'online_now' | 'online_at_end' | 'cash_at_counter'
  payment_status: 'unpaid' | 'pending_online' | 'pending_cash' | 'paid'
  receipt_number: string | null
  total_amount: number | string
  created_at: string
  updated_at: string
  tables: Table | null
  order_items: OrderItem[]
}

interface KitchenFeedProps {
  restaurantId: string
  restaurantName: string
  initialOrders: Order[]
}

export function KitchenFeed({ restaurantId, restaurantName, initialOrders }: KitchenFeedProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [now, setNow] = useState<Date>(new Date())
  const [updateError, setUpdateError] = useState<{ orderId: string; message: string } | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
    }
    router.push('/dashboard/login')
    router.refresh()
  }

  // 1. Live ticker for calculating elapsed time (every 30 seconds)
  useEffect(() => {
    const ticker = setInterval(() => {
      setNow(new Date())
    }, 30000)
    return () => clearInterval(ticker)
  }, [])

  // 2. Setup Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`kitchen-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          console.log('Realtime orders payload received:', payload)

          if (payload.eventType === 'INSERT') {
            // Fetch newly inserted order details with joined tables and items
            const { data, error } = await supabase
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
              .eq('id', payload.new.id)
              .single()

            if (!error && data) {
              setOrders((prev) => {
                // Prevent duplicate addition
                if (prev.some((o) => o.id === data.id)) return prev
                // Append and sort by created_at ascending (oldest first)
                const updatedList = [...prev, data as unknown as Order]
                return updatedList.sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              })
            } else {
              console.error('Error fetching full order details for realtime insert:', error)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            if (updated.status === 'served' || updated.status === 'cancelled') {
              // Served or Cancelled orders are removed from the active kitchen dashboard
              setOrders((prev) => prev.filter((o) => o.id !== updated.id))
            } else {
              // Update details locally
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === updated.id
                    ? {
                        ...o,
                        status: updated.status,
                        payment_status: updated.payment_status,
                        payment_mode: updated.payment_mode,
                        updated_at: updated.updated_at
                      }
                    : o
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Supabase realtime channel subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  // 3. Handle manual order status updates from buttons
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const supabase = createClient()

    // Optimistic local state update to keep UI instant
    const originalOrders = [...orders]
    setOrders((prev) => {
      if (newStatus === 'served' || newStatus === 'cancelled') {
        return prev.filter((o) => o.id !== orderId)
      }
      return prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    })

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update order status in Supabase:', error)
      // Rollback optimistic update
      setOrders(originalOrders)
      setUpdateError({
        orderId,
        message: `Failed to update status to "${newStatus}": ${error.message}. Make sure your staff user is linked to this restaurant and logged in.`,
      })
    } else {
      setUpdateError(null)
    }
  }

  // Handle manual payment status updates for Cash At Counter orders
  const handleMarkPaidCash = async (orderId: string) => {
    const supabase = createClient()

    // Optimistic local state update to keep UI instant
    const originalOrders = [...orders]
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'paid' as const } : o))
    )

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update payment status in Supabase:', error)
      // Rollback optimistic update
      setOrders(originalOrders)
      setUpdateError({
        orderId,
        message: `Failed to mark order as paid: ${error.message}`,
      })
    } else {
      setUpdateError(null)
    }
  }

  // Helper: Get order duration in minutes
  const getMinutesElapsed = (createdAtStr: string) => {
    const createdAt = new Date(createdAtStr)
    const diffMs = now.getTime() - createdAt.getTime()
    return Math.max(0, Math.floor(diffMs / 60000))
  }

  // Helper: Format elapsed time
  const formatElapsedTime = (minutes: number) => {
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m ago`
  }

  // Helper: Determine color coding based on wait time (minutes)
  const getUrgencyConfig = (minutes: number) => {
    if (minutes < 10) {
      return {
        borderColor: 'border-t-emerald-500',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        dotColor: 'bg-emerald-500',
        accentShadow: '',
      }
    } else if (minutes <= 20) {
      return {
        borderColor: 'border-t-amber-500',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        dotColor: 'bg-amber-500',
        accentShadow: '',
      }
    } else {
      return {
        borderColor: 'border-t-rose-500 border-x-rose-950/20 border-b-rose-950/20',
        textColor: 'text-rose-400 font-semibold',
        bgColor: 'bg-rose-500/15',
        dotColor: 'bg-rose-500 animate-pulse',
        accentShadow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-rose-500/30',
      }
    }
  }

  // Helper: Translate payment modes to readable text
  const formatPaymentMode = (mode: Order['payment_mode']) => {
    switch (mode) {
      case 'online_now':
        return 'Online Now'
      case 'online_at_end':
        return 'Pay at End'
      case 'cash_at_counter':
        return 'Cash'
      default:
        return mode
    }
  }

  // Helper: Translate payment statuses
  const formatPaymentStatus = (status: Order['payment_status']) => {
    switch (status) {
      case 'unpaid':
        return 'Unpaid'
      case 'pending_online':
        return 'Pending Online'
      case 'pending_cash':
        return 'Pending Cash'
      case 'paid':
        return 'Paid'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col">
      {/* Top Navigation / Dashboard Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] w-full">
        {/* Main Header Bar */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="font-bold text-white text-base sm:text-lg tracking-tight uppercase whitespace-nowrap">
              Kitchen Dashboard
            </span>
            <span className="text-[#333333] hidden sm:inline">|</span>
            <span className="text-[#a8a8a8] text-xs sm:text-sm hidden md:inline truncate max-w-[120px] lg:max-w-none">
              {restaurantName}
            </span>
            {/* Desktop Navigation Links */}
            <span className="text-[#333333] hidden md:inline">|</span>
            <nav className="hidden md:flex items-center space-x-3">
              <Link
                href={`/dashboard/${restaurantId}/tables`}
                className="text-xs text-white bg-[#181818] border border-[#222222] px-3 py-1.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
              >
                Manage Tables
              </Link>
              <span className="text-[#333333]">|</span>
              <Link
                href={`/dashboard/${restaurantId}/menu`}
                className="text-xs text-white bg-[#181818] border border-[#222222] px-3 py-1.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
              >
                Manage Menu
              </Link>
              <span className="text-[#333333]">|</span>
              <Link
                href={`/dashboard/${restaurantId}/analytics`}
                className="text-xs text-white bg-[#181818] border border-[#222222] px-3 py-1.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          {/* Desktop Search input by receipt number */}
          <div className="hidden md:block flex-1 max-w-[200px] lg:max-w-xs mx-4">
            <input
              type="text"
              placeholder="Search receipt #…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 text-xs lg:text-sm bg-[#181818] text-white border border-[#222222] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] font-mono placeholder:text-[#666666]"
            />
          </div>

          {/* Desktop Realtime Status Indicators & Logout */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className={isConnected ? 'text-[#a8a8a8]' : 'text-red-400'}>
                {isConnected ? 'Syncing Live' : 'Offline'}
              </span>
            </div>

            <div className="text-xs bg-[#181818] border border-[#222222] px-3 py-1 rounded-md text-white">
              <span className="font-mono text-indigo-400 font-semibold">{orders.length}</span> active
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 px-3 py-1.5 rounded-md font-semibold transition-[color,background-color] flex items-center space-x-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <span>Logout</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Mobile Right: Hamburger Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <div className="text-xs bg-[#181818] border border-[#222222] px-2.5 py-1 rounded-md text-white flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="font-mono text-indigo-400 font-bold">{orders.length}</span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#a8a8a8] hover:text-white bg-[#181818] border border-[#222222] rounded-md transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd] cursor-pointer"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Container */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#222222] bg-[#0f0f0f]/95 backdrop-blur-md px-4 py-4 space-y-4 flex flex-col transition-all duration-300">
            <div className="text-[10px] tracking-wider text-[#a8a8a8] font-bold border-b border-[#222222] pb-2 flex justify-between items-center">
              <span>RESTAURANT</span>
              <span className="text-white font-semibold">{restaurantName}</span>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="mobile-search-receipt" className="text-[10px] uppercase font-semibold text-ink-subtle tracking-wider">
                Search Receipt
              </label>
              <input
                id="mobile-search-receipt"
                type="text"
                placeholder="Search receipt #…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 text-sm bg-[#181818] text-white border border-[#222222] rounded-md focus:outline-none focus:border-[#0007cd] focus:ring-1 focus:ring-[#0007cd] transition-[border-color,box-shadow] font-mono placeholder:text-[#666666]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <Link
                href={`/dashboard/${restaurantId}/tables`}
                className="text-[11px] sm:text-xs text-center text-white bg-[#181818] border border-[#222222] py-2.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tables
              </Link>
              <Link
                href={`/dashboard/${restaurantId}/menu`}
                className="text-[11px] sm:text-xs text-center text-white bg-[#181818] border border-[#222222] py-2.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Menu
              </Link>
              <Link
                href={`/dashboard/${restaurantId}/analytics`}
                className="text-[11px] sm:text-xs text-center text-white bg-[#181818] border border-[#222222] py-2.5 rounded-md hover:bg-[#222222] transition-[color,background-color] font-medium flex items-center justify-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0007cd]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-[#222222] border-b border-[#222222] pt-2 pb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span className={isConnected ? 'text-[#a8a8a8]' : 'text-red-400'}>
                  {isConnected ? 'Syncing Live' : 'Offline'}
                </span>
              </div>
              <div className="text-[#a8a8a8]">
                <span className="font-mono text-indigo-400 font-semibold">{orders.length}</span> active orders
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full text-center py-2.5 text-xs bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-md font-semibold transition-[color,background-color] flex items-center justify-center space-x-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <span>Logout</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#181818] border border-[#222222] text-[#888888] mb-6 shadow-md">
              <svg
                className="w-10 h-10 opacity-40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
              All Orders Cleared!
            </h2>
            <p className="text-sm text-[#888888] max-w-md leading-relaxed">
              No active orders in the kitchen. New customer orders will show up here instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(() => {
              const filtered = orders.filter((order) => {
                if (!searchQuery) return true
                return order.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase())
              })

              if (filtered.length === 0) {
                return (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-1">
                      No matching orders
                    </h3>
                    <p className="text-sm text-[#888888] leading-relaxed">
                      We couldn't find any active orders matching "{searchQuery}".
                    </p>
                  </div>
                )
              }

              return filtered.map((order) => {
                const waitMinutes = getMinutesElapsed(order.created_at)
              const urgency = getUrgencyConfig(waitMinutes)

              return (
                <div
                  key={order.id}
                  className={`flex flex-col bg-[#181818] border border-[#222222] border-t-4 ${urgency.borderColor} rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-700 ${urgency.accentShadow}`}
                >
                  {/* Card Header: Table Number & Urgency status */}
                  <div className="p-4 bg-[#1e1e1e] border-b border-[#262626] flex items-center justify-between">
                    <div>
                      <div className="text-xs text-[#888888] uppercase tracking-wider font-mono">
                        {order.receipt_number || 'No Receipt'}
                      </div>
                      <div className="text-2xl font-black text-white tracking-tight flex items-center mt-1">
                        Table {order.tables?.table_number || '?'}
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Live Ticker display */}
                      <div className={`text-xs flex items-center justify-end space-x-1.5 ${urgency.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                        <span>{formatElapsedTime(waitMinutes)}</span>
                      </div>

                      {/* Order status Badge */}
                      <span
                        className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-2 rounded-md ${
                          order.status === 'received'
                            ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                            : order.status === 'preparing'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                            : order.status === 'ready'
                            ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Warning if update fails */}
                  {updateError?.orderId === order.id && (
                    <div className="bg-red-950/30 border-b border-red-900/20 text-red-400 text-xs px-4 py-2.5 leading-normal">
                      {updateError.message}
                    </div>
                  )}

                  {/* Card Body: Order Items list */}
                  <div className="flex-1 p-4 space-y-4">
                    <ul className="space-y-3">
                      {order.order_items?.map((item) => (
                        <li key={item.id} className="text-sm">
                          <div className="flex items-start justify-between space-x-2">
                            <span className="text-white">
                              <strong className="text-indigo-400 font-bold mr-2 text-base font-mono">
                                {item.quantity}x
                              </strong>
                              {item.menu_items?.name || 'Unknown Item'}
                            </span>
                          </div>
                          {item.notes && (
                            <div className="flex items-center space-x-1.5 text-xs text-amber-500/80 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1 mt-1.5 italic">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="truncate">"{item.notes}"</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Secondary details: Payment Mode & Status */}
                  <div className="px-4 py-2.5 bg-[#151515] border-t border-[#222222] flex items-center justify-between text-[11px] text-[#666666] font-medium font-mono">
                    <span className="truncate" title={`Mode: ${order.payment_mode}`}>
                      {formatPaymentMode(order.payment_mode)}
                    </span>
                    <span
                      className={`${
                        order.payment_status === 'paid'
                          ? 'text-emerald-500'
                          : order.payment_status.startsWith('pending')
                          ? 'text-amber-500'
                          : 'text-[#888888]'
                      }`}
                    >
                      {formatPaymentStatus(order.payment_status)}
                    </span>
                  </div>

                  {/* Card Footer: Status Action Controls */}
                  <div className="p-3 bg-[#1e1e1e] border-t border-[#262626] flex flex-col gap-2">
                    {/* Primary Flow Stepper Button */}
                    {order.status === 'received' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#0007cd] hover:bg-[#0005a3] rounded-md transition-colors duration-150 flex items-center justify-center space-x-1"
                      >
                        <span>Start Preparing</span>
                        <span>⚡</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="w-full py-2 px-3 text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-500 rounded-md transition-colors duration-150 flex items-center justify-center space-x-1"
                      >
                        <span>Mark as Ready</span>
                        <span>🍽️</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors duration-150 flex items-center justify-center space-x-1"
                      >
                        <span>Complete & Serve</span>
                        <span>✔️</span>
                      </button>
                    )}

                    {order.payment_mode === 'cash_at_counter' && order.payment_status === 'pending_cash' && (
                      <button
                        type="button"
                        onClick={() => handleMarkPaidCash(order.id)}
                        className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>Mark as Paid (Cash)</span>
                        <span>💵</span>
                      </button>
                    )}

                    {/* Secondary Status Stepper Options (Allowing custom state jumps or cancels) */}
                    <div className="flex items-center justify-between gap-1 mt-1 border-t border-[#2a2a2a] pt-2">
                      {order.status !== 'received' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'received')}
                          className="flex-1 py-1 text-[10px] text-[#888888] hover:text-white hover:bg-zinc-800 rounded transition-all font-medium"
                          title="Reset to Received status"
                        >
                          Reset
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            handleUpdateStatus(order.id, 'cancelled')
                          }
                        }}
                        className="py-1 px-2 text-[10px] text-red-500 hover:text-white hover:bg-red-950/30 rounded transition-all font-medium ml-auto"
                        title="Cancel this order"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
            })()}
          </div>
        )}
      </main>
    </div>
  )
}
