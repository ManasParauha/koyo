'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsDashboardClientProps {
  restaurantId: string
  restaurantName: string
}

interface ChartDataPoint {
  label: string
  revenue: number
  orderCount: number
}

interface SummaryData {
  total_revenue: number
  total_orders: number
  avg_order_value: number
  avg_serve_time_seconds: number
  count_online_now: number
  count_online_at_end: number
  count_cash_at_counter: number
}

interface PopularItem {
  menu_item_name: string
  total_quantity: number
}

export function AnalyticsDashboardClient({
  restaurantId,
  restaurantName,
}: AnalyticsDashboardClientProps) {
  const [range, setRange] = useState<'today' | '7days' | '30days' | 'custom'>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([])

  // Helper to calculate date range objects
  const getDateRange = (selectedRange: typeof range, startStr?: string, endStr?: string) => {
    const now = new Date()
    let start: Date
    let end: Date
    let interval: 'hour' | 'day'

    if (selectedRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      interval = 'hour'
    } else if (selectedRange === '7days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      interval = 'day'
    } else if (selectedRange === '30days') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      interval = 'day'
    } else {
      // custom range
      if (startStr) {
        const [y, m, d] = startStr.split('-').map(Number)
        start = new Date(y, m - 1, d, 0, 0, 0, 0)
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
      }
      if (endStr) {
        const [y, m, d] = endStr.split('-').map(Number)
        end = new Date(y, m - 1, d, 23, 59, 59, 999)
      } else {
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      }
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      interval = diffDays <= 1 ? 'hour' : 'day'
    }

    return { start, end, interval }
  }

  // Helper to fill timeline gaps
  const fillRevenueGaps = (rawData: any[], start: Date, end: Date, interval: 'hour' | 'day') => {
    if (interval === 'hour') {
      const filled: ChartDataPoint[] = []
      // 24 hours of today
      for (let i = 0; i < 24; i++) {
        const hDate = new Date(start.getTime() + i * 3600000)
        const label = hDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        filled.push({
          label,
          revenue: 0,
          orderCount: 0
        })
      }

      rawData.forEach(row => {
        const rDate = new Date(row.time_bucket)
        const hr = rDate.getHours()
        if (hr >= 0 && hr < 24) {
          filled[hr].revenue = Number(row.revenue)
          filled[hr].orderCount = Number(row.order_count)
        }
      })

      return filled
    } else {
      const filled: { label: string; dateKey: string; revenue: number; orderCount: number }[] = []
      const current = new Date(start)
      while (current <= end) {
        filled.push({
          label: current.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          dateKey: current.toDateString(),
          revenue: 0,
          orderCount: 0
        })
        current.setDate(current.getDate() + 1)
      }

      rawData.forEach(row => {
        const rDate = new Date(row.time_bucket)
        const dateKey = rDate.toDateString()
        const match = filled.find(f => f.dateKey === dateKey)
        if (match) {
          match.revenue = Number(row.revenue)
          match.orderCount = Number(row.order_count)
        }
      })

      return filled.map(f => ({
        label: f.label,
        revenue: f.revenue,
        orderCount: f.orderCount
      }))
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { start, end, interval } = getDateRange(range, customStart, customEnd)

      const startTimeStr = start.toISOString()
      const endTimeStr = end.toISOString()

      // Fetch analytics summary
      const { data: summaryData, error: summaryErr } = await supabase.rpc(
        'get_restaurant_analytics_summary',
        {
          p_restaurant_id: restaurantId,
          p_start_time: startTimeStr,
          p_end_time: endTimeStr,
        }
      )

      if (summaryErr) throw summaryErr

      // Fetch popular menu items
      const { data: itemsData, error: itemsErr } = await supabase.rpc(
        'get_restaurant_popular_items',
        {
          p_restaurant_id: restaurantId,
          p_start_time: startTimeStr,
          p_end_time: endTimeStr,
        }
      )

      if (itemsErr) throw itemsErr

      // Fetch revenue over time
      const { data: revOverTimeData, error: revErr } = await supabase.rpc(
        'get_restaurant_revenue_over_time',
        {
          p_restaurant_id: restaurantId,
          p_start_time: startTimeStr,
          p_end_time: endTimeStr,
          p_interval: interval,
        }
      )

      if (revErr) throw revErr

      setSummary(summaryData?.[0] || null)
      setPopularItems(itemsData || [])
      setRevenueData(fillRevenueGaps(revOverTimeData || [], start, end, interval))
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.message || 'Failed to load analytics. Make sure the database functions are applied.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (range !== 'custom') {
      fetchAnalytics()
    } else if (customStart && customEnd) {
      fetchAnalytics()
    }
  }, [range, restaurantId])

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault()
    if (customStart && customEnd) {
      fetchAnalytics()
    }
  }

  // Format helper for average serve time
  const formatServeTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'N/A'
    const totalMinutes = seconds / 60
    if (totalMinutes < 1) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(totalMinutes)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`
  }

  // Calculations for payment breakdowns
  const totalOrders = Number(summary?.total_orders || 0)
  const onlineNowCount = Number(summary?.count_online_now || 0)
  const onlineAtEndCount = Number(summary?.count_online_at_end || 0)
  const cashAtCounterCount = Number(summary?.count_cash_at_counter || 0)

  const onlineNowPct = totalOrders > 0 ? (onlineNowCount / totalOrders) * 100 : 0
  const onlineAtEndPct = totalOrders > 0 ? (onlineAtEndCount / totalOrders) * 100 : 0
  const cashAtCounterPct = totalOrders > 0 ? (cashAtCounterCount / totalOrders) * 100 : 0

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-6 sm:px-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/${restaurantId}`}
            className="text-xs bg-[#181818] border border-[#222222] text-[#a8a8a8] px-3 py-1.5 rounded-md hover:bg-[#222222] transition-colors font-medium flex items-center space-x-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-[#333333]">|</span>
          <span className="font-bold text-white text-md tracking-tight uppercase">
            Analytics
          </span>
          <span className="text-[#333333] hidden sm:inline">|</span>
          <span className="text-[#a8a8a8] text-sm hidden sm:inline">
            {restaurantName}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="text-xs bg-[#181818] hover:bg-[#222222] text-white border border-[#222222] px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1400px] w-full mx-auto space-y-8">
        
        {/* Date Selector Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181818] border border-[#222222] rounded-xl p-5">
          <div className="space-y-1">
            <h2 className="text-white font-semibold text-base">Date Filter</h2>
            <p className="text-xs text-[#a8a8a8]">Select analytics reporting window</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-[#0f0f0f] border border-[#222222] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRange('today')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  range === 'today' ? 'bg-[#0007cd] text-white' : 'text-[#a8a8a8] hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setRange('7days')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  range === '7days' ? 'bg-[#0007cd] text-white' : 'text-[#a8a8a8] hover:text-white'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('30days')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  range === '30days' ? 'bg-[#0007cd] text-white' : 'text-[#a8a8a8] hover:text-white'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('custom')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  range === 'custom' ? 'bg-[#0007cd] text-white' : 'text-[#a8a8a8] hover:text-white'
                }`}
              >
                Custom Range
              </button>
            </div>

            {range === 'custom' && (
              <form onSubmit={handleApplyCustomRange} className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border border-[#222222] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0007cd] transition-all font-mono"
                />
                <span className="text-xs text-[#a8a8a8]">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  required
                  className="bg-[#0f0f0f] border border-[#222222] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0007cd] transition-all font-mono"
                />
                <button
                  type="submit"
                  className="text-xs bg-[#0007cd] hover:bg-[#0005a3] text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Apply
                </button>
              </form>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-[#ff4d4d] p-4 rounded-xl text-sm flex items-start space-x-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1.5 flex-1">
              <span className="font-semibold block">Connection Error</span>
              <p className="opacity-90">{error}</p>
              <div className="pt-2">
                <button 
                  onClick={fetchAnalytics}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white text-xs px-3 py-1 rounded border border-red-500/30 font-semibold transition-all cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-[#a8a8a8]">Aggregating database analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      Total Revenue
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      ₹{Number(summary?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[11px] text-[#a8a8a8] leading-tight">
                      Sum of paid orders total amount
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      Total Orders
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {Number(summary?.total_orders || 0)}
                    </h3>
                    <p className="text-[11px] text-[#a8a8a8] leading-tight">
                      Total placed orders in range
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300" />
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      Avg Order Value
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      ₹{Number(summary?.avg_order_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[11px] text-[#a8a8a8] leading-tight">
                      Average total amount per order
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Kitchen Efficiency (Served Time) */}
              <div className="bg-[#181818] border border-[#222222] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-300" />
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      Avg Kitchen Speed
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {formatServeTime(Number(summary?.avg_serve_time_seconds || 0))}
                    </h3>
                    <p className="text-[11px] text-[#a8a8a8] leading-tight">
                      Average order placement to serve time
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Charts / Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Revenue Chart Panel (Takes up 2/3 cols on large screens) */}
              <div className="lg:col-span-2 space-y-6">
                <CustomRevenueChart data={revenueData} />

                {/* Payment Mode Card */}
                <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-5">
                  <div>
                    <h3 className="text-white text-sm font-semibold">Payment Modes</h3>
                    <p className="text-xs text-[#a8a8a8]">Order volume share by payment channel</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Online Now */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">Online Now (Instant Pay)</span>
                        <span className="text-white font-mono">{onlineNowCount} <span className="text-[#888888] font-sans">({onlineNowPct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="w-full bg-[#0f0f0f] h-2 rounded-full overflow-hidden border border-[#222222]">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${onlineNowPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Online at End */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">Pay at End (Online)</span>
                        <span className="text-white font-mono">{onlineAtEndCount} <span className="text-[#888888] font-sans">({onlineAtEndPct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="w-full bg-[#0f0f0f] h-2 rounded-full overflow-hidden border border-[#222222]">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${onlineAtEndPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Cash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">Cash at Counter</span>
                        <span className="text-white font-mono">{cashAtCounterCount} <span className="text-[#888888] font-sans">({cashAtCounterPct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="w-full bg-[#0f0f0f] h-2 rounded-full overflow-hidden border border-[#222222]">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${cashAtCounterPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Items Panel (Takes up 1/3 cols) */}
              <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 space-y-4 flex flex-col">
                <div>
                  <h3 className="text-white text-sm font-semibold">Popular Items</h3>
                  <p className="text-xs text-[#a8a8a8]">Top 10 menu items sold in range</p>
                </div>

                {popularItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <svg className="w-8 h-8 mb-2 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="text-xs font-medium text-white">No Sales Data</p>
                    <p className="text-[10px] text-[#888888] max-w-[180px] mx-auto mt-0.5">
                      Items sold during this period will be ranked here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4.5 flex-1 overflow-y-auto">
                    {popularItems.map((item, idx) => {
                      const maxQty = Number(popularItems[0]?.total_quantity || 1)
                      const itemRatio = maxQty > 0 ? (Number(item.total_quantity) / maxQty) * 100 : 0
                      
                      return (
                        <div key={idx} className="relative group flex flex-col space-y-1">
                          <div className="flex items-center justify-between text-xs z-10">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-indigo-400 font-bold bg-[#0f0f0f] border border-[#222222] w-5 h-5 flex items-center justify-center rounded">
                                {idx + 1}
                              </span>
                              <span className="text-white font-medium truncate max-w-[150px] sm:max-w-[180px]">
                                {item.menu_item_name}
                              </span>
                            </div>
                            <span className="font-mono text-white font-semibold">
                              {Number(item.total_quantity)} sold
                            </span>
                          </div>

                          {/* Progress bar indicator */}
                          <div className="w-full bg-[#0f0f0f]/50 h-2 rounded overflow-hidden border border-[#222222]/30">
                            <div
                              className="bg-indigo-500/20 group-hover:bg-indigo-500/35 h-full rounded transition-all duration-300"
                              style={{ width: `${itemRatio}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  )
}

function CustomRevenueChart({ data }: { data: ChartDataPoint[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100)
  const width = 600
  const height = 240
  const paddingX = 40
  const paddingY = 30

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (width - 2 * paddingX)
    const y = height - paddingY - (d.revenue / maxRevenue) * (height - 2 * paddingY)
    return { x, y }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const fillD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : ''

  return (
    <div className="relative bg-[#181818] border border-[#222222] rounded-xl p-5 w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-sm font-semibold">Revenue Trend</h3>
          <p className="text-xs text-[#a8a8a8]">Sales trend in selected range</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-white">Revenue (₹)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[240px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (height - 2 * paddingY)
            const val = maxRevenue - ratio * maxRevenue
            return (
              <g key={idx} className="opacity-20">
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#a8a8a8" strokeDasharray="3 3" strokeWidth="1" />
                <text x={paddingX - 8} y={y + 4} fill="#ffffff" fontSize="9" textAnchor="end" className="font-mono">
                  ₹{Math.round(val)}
                </text>
              </g>
            )
          })}

          {fillD && <path d={fillD} fill="url(#chartGradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {points.map((p, i) => {
            const barWidth = (width - 2 * paddingX) / Math.max(data.length - 1, 1)
            return (
              <g key={i}>
                <rect
                  x={p.x - barWidth / 2}
                  y={paddingY}
                  width={barWidth}
                  height={height - 2 * paddingY}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                
                {hoveredIdx === i && (
                  <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" className="pointer-events-none opacity-40" />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === i ? 4.5 : 2.5}
                  fill="#0f0f0f"
                  stroke="#10b981"
                  strokeWidth={hoveredIdx === i ? 2 : 1.5}
                  className="pointer-events-none transition-all duration-100"
                />
              </g>
            )
          })}

          {data.map((d, i) => {
            const total = data.length
            const shouldShow =
              total <= 8 ||
              (total <= 15 && i % 2 === 0) ||
              (total <= 31 && i % 4 === 0) ||
              i === 0 ||
              i === total - 1

            if (!shouldShow) return null
            const p = points[i]
            return (
              <text key={i} x={p.x} y={height - 8} fill="#a8a8a8" fontSize="9" textAnchor="middle" className="font-sans opacity-70">
                {d.label}
              </text>
            )
          })}
        </svg>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-10 bg-[#222222] border border-[#333333] p-2.5 rounded-lg shadow-xl text-xs flex flex-col pointer-events-none"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredIdx].y / height) * 100 - 30)}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px'
            }}
          >
            <span className="font-semibold text-white mb-0.5">{data[hoveredIdx].label}</span>
            <span className="text-emerald-400 font-mono">Revenue: ₹{Number(data[hoveredIdx].revenue).toFixed(2)}</span>
            <span className="text-indigo-400 font-mono">Orders: {data[hoveredIdx].orderCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
