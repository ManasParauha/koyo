'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

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

type FilterTab = 'all' | 'received' | 'preparing' | 'ready'

export function KitchenFeed({ restaurantId, restaurantName, initialOrders }: KitchenFeedProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [now, setNow] = useState<Date>(new Date())
  const [updateError, setUpdateError] = useState<{ orderId: string; message: string } | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

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
                if (prev.some((o) => o.id === data.id)) return prev
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
              setOrders((prev) => prev.filter((o) => o.id !== updated.id))
            } else {
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
      setOrders(originalOrders)
      setUpdateError({
        orderId,
        message: `Failed to update status to "${newStatus}": ${error.message}`,
      })
    } else {
      setUpdateError(null)
    }
  }

  // Handle manual payment status updates for Cash At Counter orders
  const handleMarkPaidCash = async (orderId: string) => {
    const supabase = createClient()

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

  // Helper: Determine urgency styling based on wait time (minutes)
  const getUrgencyConfig = (minutes: number) => {
    if (minutes < 10) {
      return {
        textColor: 'text-[#8a8f98]',
        badgeBg: 'bg-[#141516]',
        dotColor: 'bg-[#5e6ad2]',
        isOverdue: false,
      }
    } else if (minutes <= 20) {
      return {
        textColor: 'text-amber-400/90 font-mono',
        badgeBg: 'bg-amber-500/10',
        dotColor: 'bg-amber-400',
        isOverdue: false,
      }
    } else {
      return {
        textColor: 'text-rose-400 font-mono font-medium',
        badgeBg: 'bg-rose-500/10 border border-rose-500/20',
        dotColor: 'bg-rose-500 animate-pulse',
        isOverdue: true,
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

  // Count active orders by status
  const receivedCount = orders.filter((o) => o.status === 'received').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length

  return (
    <DashboardLayout
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      activePage="kitchen"
      activeOrdersCount={orders.length}
      isConnected={isConnected}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-[#8a8f98] hidden sm:inline">Active Orders:</span>
          <span className="px-2 py-0.5 rounded-md bg-[#141516] border border-[#23252a] text-[#5e6ad2] font-medium">
            {orders.length}
          </span>
        </div>
      }
    >
      <div className="p-6 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Top Control Bar: Status Filter Tabs (DESIGN.md pricing-tab-default / selected pattern) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#23252a] pb-4">
          <div className="w-full sm:w-auto max-w-full overflow-x-auto scrollbar-none flex items-center gap-1 sm:gap-1.5 bg-[#0f1011] p-1 rounded-full border border-[#23252a] scroll-smooth">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-medium rounded-full transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer outline-none focus:outline-none border ${
                activeFilter === 'all'
                  ? 'bg-[#141516] text-[#f7f8f8] border-[#23252a] shadow-sm'
                  : 'bg-transparent text-[#8a8f98] border-transparent hover:text-[#f7f8f8] hover:bg-[#141516]/50'
              }`}
            >
              <span>All Orders</span>
              <span className="font-mono text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-[#010102] border border-[#23252a]">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('received')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-medium rounded-full transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer outline-none focus:outline-none border ${
                activeFilter === 'received'
                  ? 'bg-[#141516] text-[#f7f8f8] border-[#23252a] shadow-sm'
                  : 'bg-transparent text-[#8a8f98] border-transparent hover:text-[#f7f8f8] hover:bg-[#141516]/50'
              }`}
            >
              <span>Received</span>
              {receivedCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/30">
                  {receivedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('preparing')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-medium rounded-full transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer outline-none focus:outline-none border ${
                activeFilter === 'preparing'
                  ? 'bg-[#141516] text-[#f7f8f8] border-[#23252a] shadow-sm'
                  : 'bg-transparent text-[#8a8f98] border-transparent hover:text-[#f7f8f8] hover:bg-[#141516]/50'
              }`}
            >
              <span>Preparing</span>
              {preparingCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {preparingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ready')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-medium rounded-full transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 cursor-pointer outline-none focus:outline-none border ${
                activeFilter === 'ready'
                  ? 'bg-[#141516] text-[#f7f8f8] border-[#23252a] shadow-sm'
                  : 'bg-transparent text-[#8a8f98] border-transparent hover:text-[#f7f8f8] hover:bg-[#141516]/50'
              }`}
            >
              <span>Ready</span>
              {readyCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#27a644]/20 text-[#27a644] border border-[#27a644]/30">
                  {readyCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-[#8a8f98] font-mono flex items-center gap-2 self-end sm:self-center">
            <span className="w-2 h-2 rounded-full bg-[#27a644] animate-pulse" />
            <span>Live Sync Active</span>
          </div>
        </div>

        {/* Feed Content */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-lg border border-[#23252a] bg-[#0f1011]/50">
            <div className="w-12 h-12 rounded-lg bg-[#141516] border border-[#23252a] flex items-center justify-center text-[#8a8f98] mb-4">
              <svg className="w-6 h-6 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[#f7f8f8] tracking-tight mb-1">
              All Kitchen Orders Cleared
            </h2>
            <p className="text-xs text-[#8a8f98] max-w-sm leading-relaxed">
              No active pending orders. New customer dine-in orders will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(() => {
              const filtered = orders.filter((order) => {
                // Apply search filter
                if (searchQuery && !order.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false
                }
                // Apply tab filter
                if (activeFilter !== 'all' && order.status !== activeFilter) {
                  return false
                }
                return true
              })

              if (filtered.length === 0) {
                return (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center rounded-lg border border-[#23252a] bg-[#0f1011]">
                    <h3 className="text-sm font-medium text-[#f7f8f8] mb-1">
                      No matching orders found
                    </h3>
                    <p className="text-xs text-[#8a8f98]">
                      Try clearing your search query or switching status tabs.
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
                    className="group relative flex flex-col bg-[#0f1011] border border-[#23252a] hover:border-[#34343a] rounded-lg transition-all duration-150 overflow-hidden shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#34343a] before:to-transparent"
                  >
                    {/* Card Header: Table Number & Urgency status */}
                    <div className="p-4 bg-[#141516]/60 border-b border-[#23252a] flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[11px] text-[#8a8f98] tracking-wider uppercase block">
                          {order.receipt_number || 'No Receipt'}
                        </span>
                        <h2 className="text-lg font-semibold text-[#f7f8f8] tracking-[-0.4px] font-display mt-0.5">
                          Table {order.tables?.table_number || '?'}
                        </h2>
                      </div>

                      <div className="flex flex-col items-end space-y-1.5">
                        {/* Live Ticker display */}
                        <div
                          className={`text-xs flex items-center space-x-1.5 px-2 py-0.5 rounded-full ${urgency.badgeBg} ${urgency.textColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                          <span>{formatElapsedTime(waitMinutes)}</span>
                        </div>

                        {/* Order status Badge (Linear status-badge style) */}
                        <span
                          className={`inline-block text-[10px] uppercase font-mono font-medium tracking-wider px-2 py-0.5 rounded-full border ${
                            order.status === 'received'
                              ? 'bg-[#5e6ad2]/10 text-[#828fff] border-[#5e6ad2]/30'
                              : order.status === 'preparing'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : order.status === 'ready'
                              ? 'bg-[#27a644]/10 text-[#27a644] border-[#27a644]/20'
                              : 'bg-[#18191a] text-[#d0d6e0] border-[#23252a]'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Warning if update fails */}
                    {updateError?.orderId === order.id && (
                      <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs px-4 py-2 leading-tight font-sans">
                        {updateError.message}
                      </div>
                    )}

                    {/* Card Body: Order Items list */}
                    <div className="flex-1 p-4 space-y-3">
                      <ul className="space-y-2.5">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="text-sm">
                            <div className="flex items-start">
                              <span className="font-mono text-xs font-semibold text-[#828fff] bg-[#5e6ad2]/15 border border-[#5e6ad2]/25 px-1.5 py-0.5 rounded mr-2 mt-0.5 flex-shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="text-[#f7f8f8] font-normal leading-snug">
                                {item.menu_items?.name || 'Unknown Item'}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="text-xs text-[#8a8f98] bg-[#141516] border border-[#23252a] rounded px-2.5 py-1.5 mt-1.5 flex items-start gap-1.5">
                                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="truncate italic">"{item.notes}"</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Card Secondary details: Payment Mode & Status */}
                    <div className="px-4 py-2 bg-[#010102] border-t border-[#23252a] flex items-center justify-between text-xs font-mono text-[#8a8f98]">
                      <span>{formatPaymentMode(order.payment_mode)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          order.payment_status === 'paid'
                            ? 'text-[#27a644] bg-[#27a644]/10 border-[#27a644]/20'
                            : order.payment_status.startsWith('pending')
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            : 'text-[#8a8f98] bg-[#141516] border-[#23252a]'
                        }`}
                      >
                        {formatPaymentStatus(order.payment_status)}
                      </span>
                    </div>

                    {/* Card Footer: Status Action Controls (Linear button specs) */}
                    <div className="p-3 bg-[#0f1011] border-t border-[#23252a] flex flex-col gap-2">
                      {/* Primary Flow Stepper Button (button-primary style from DESIGN.md) */}
                      {order.status === 'received' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="w-full py-2 px-3 text-xs font-medium text-white bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]"
                        >
                          <span>Start Preparing</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="w-full py-2 px-3 text-xs font-medium text-white bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]"
                        >
                          <span>Mark as Ready</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'served')}
                          className="w-full py-2 px-3 text-xs font-medium text-white bg-[#27a644] hover:bg-[#27a644]/90 active:bg-[#27a644]/80 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#27a644]"
                        >
                          <span>Complete & Serve</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}

                      {order.payment_mode === 'cash_at_counter' && order.payment_status === 'pending_cash' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaidCash(order.id)}
                          className="w-full py-2 px-3 text-xs font-medium text-[#f7f8f8] bg-[#141516] hover:bg-[#18191a] border border-[#23252a] hover:border-[#34343a] rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Mark as Paid (Cash)</span>
                          <svg className="w-3.5 h-3.5 text-[#27a644]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}

                      {/* Secondary Status Stepper Options */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#23252a]">
                        {order.status !== 'received' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'received')}
                            className="py-1 px-2 text-[11px] font-medium text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#141516] rounded transition-colors"
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
                          className="py-1 px-2 text-[11px] font-medium text-[#8a8f98] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors ml-auto"
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
      </div>
    </DashboardLayout>
  )
}
