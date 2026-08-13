'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

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
    <DashboardLayout
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      activePage="analytics"
      headerActions={
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="h-8 px-3 rounded-md text-xs font-medium bg-[#0f1011] hover:bg-[#141516] text-[#f7f8f8] border border-[#23252a] hover:border-[#34343a] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5e6ad2]"
        >
          <svg
            className={`w-3.5 h-3.5 text-[#8a8f98] shrink-0 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
        
        {/* Date Selector Control Rail (Linear Pill-Segment Spec) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0f1011] border border-[#23252a] border-t-[#34343a]/60 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="space-y-0.5">
            <div className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
              Reporting Window
            </div>
            <h2 className="text-sm font-semibold text-[#f7f8f8] tracking-tight">
              Date Filter
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-[#010102] border border-[#23252a] p-1 rounded-full overflow-x-auto max-w-full whitespace-nowrap scrollbar-none">
              <button
                type="button"
                onClick={() => setRange('today')}
                className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none ${
                  range === 'today'
                    ? 'bg-[#141516] text-[#f7f8f8] border border-[#34343a] shadow-xs'
                    : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setRange('7days')}
                className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none ${
                  range === '7days'
                    ? 'bg-[#141516] text-[#f7f8f8] border border-[#34343a] shadow-xs'
                    : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('30days')}
                className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none ${
                  range === '30days'
                    ? 'bg-[#141516] text-[#f7f8f8] border border-[#34343a] shadow-xs'
                    : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('custom')}
                className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none ${
                  range === 'custom'
                    ? 'bg-[#141516] text-[#f7f8f8] border border-[#34343a] shadow-xs'
                    : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#0f1011]'
                }`}
              >
                Custom Range
              </button>
            </div>

            {range === 'custom' && (
              <form onSubmit={handleApplyCustomRange} className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                    aria-label="Start Date"
                    className="w-full min-w-0 bg-[#0f1011] border border-[#23252a] text-xs text-[#f7f8f8] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-colors font-mono"
                  />
                  <span className="text-xs text-[#62666d] shrink-0 font-mono">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                    aria-label="End Date"
                    className="w-full min-w-0 bg-[#0f1011] border border-[#23252a] text-xs text-[#f7f8f8] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#5e6ad2] focus:ring-1 focus:ring-[#5e6ad2]/40 transition-colors font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto text-xs bg-[#5e6ad2] hover:bg-[#828fff] active:bg-[#5e69d1] text-white px-3.5 py-1.5 rounded-md transition-colors font-medium text-center cursor-pointer focus-visible:ring-1 focus-visible:ring-[#5e6ad2] focus-visible:outline-none"
                >
                  Apply
                </button>
              </form>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-[#181011] border border-[#3e1b1e] text-[#f7f8f8] p-4 rounded-lg text-xs flex items-start space-x-3">
            <svg className="w-4 h-4 text-[#ff4d4d] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1.5 flex-1">
              <span className="font-semibold text-white block">Connection Error</span>
              <p className="text-[#d0d6e0]">{error}</p>
              <div className="pt-1">
                <button 
                  onClick={fetchAnalytics}
                  className="bg-[#2b1517] hover:bg-[#3d1c1f] text-[#ff4d4d] text-xs px-2.5 py-1 rounded border border-[#522024] font-medium transition-all cursor-pointer"
                >
                  Retry Query
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-3 bg-[#0f1011] border border-[#23252a] rounded-xl">
            <div className="w-8 h-8 border-2 border-[#5e6ad2]/20 border-t-[#5e6ad2] rounded-full animate-spin" />
            <p className="text-xs text-[#8a8f98] font-mono">Aggregating database metrics…</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPI Summary Cards Grid (4-up desktop, 2-up tablet, 1-up mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Revenue */}
              <div className="bg-[#0f1011] hover:bg-[#141516] border border-[#23252a] hover:border-[#34343a] border-t-[#34343a]/60 rounded-lg p-5 transition-all duration-150 relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                      Total Revenue
                    </span>
                    <div className="w-7 h-7 rounded-md bg-[#141516] border border-[#23252a] text-[#8a8f98] group-hover:text-[#5e6ad2] group-hover:border-[#5e6ad2]/40 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 mb-1">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-[#f7f8f8] tracking-tight font-sans">
                      ₹{Number(summary?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[#62666d] mt-2">
                  Paid order total in period
                </p>
              </div>

              {/* Total Orders */}
              <div className="bg-[#0f1011] hover:bg-[#141516] border border-[#23252a] hover:border-[#34343a] border-t-[#34343a]/60 rounded-lg p-5 transition-all duration-150 relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                      Total Orders
                    </span>
                    <div className="w-7 h-7 rounded-md bg-[#141516] border border-[#23252a] text-[#8a8f98] group-hover:text-[#5e6ad2] group-hover:border-[#5e6ad2]/40 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 mb-1">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-[#f7f8f8] tracking-tight font-sans">
                      {Number(summary?.total_orders || 0)}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[#62666d] mt-2">
                  Placed orders in range
                </p>
              </div>

              {/* Average Order Value */}
              <div className="bg-[#0f1011] hover:bg-[#141516] border border-[#23252a] hover:border-[#34343a] border-t-[#34343a]/60 rounded-lg p-5 transition-all duration-150 relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                      Avg Order Value
                    </span>
                    <div className="w-7 h-7 rounded-md bg-[#141516] border border-[#23252a] text-[#8a8f98] group-hover:text-[#5e6ad2] group-hover:border-[#5e6ad2]/40 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 mb-1">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-[#f7f8f8] tracking-tight font-sans">
                      ₹{Number(summary?.avg_order_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[#62666d] mt-2">
                  Average revenue per order ticket
                </p>
              </div>

              {/* Kitchen Speed */}
              <div className="bg-[#0f1011] hover:bg-[#141516] border border-[#23252a] hover:border-[#34343a] border-t-[#34343a]/60 rounded-lg p-5 transition-all duration-150 relative overflow-hidden group shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[#8a8f98] uppercase tracking-wider font-medium">
                      Avg Kitchen Speed
                    </span>
                    <div className="w-7 h-7 rounded-md bg-[#141516] border border-[#23252a] text-[#8a8f98] group-hover:text-[#5e6ad2] group-hover:border-[#5e6ad2]/40 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 mb-1">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-[#f7f8f8] tracking-tight font-sans">
                      {formatServeTime(Number(summary?.avg_serve_time_seconds || 0))}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[#62666d] mt-2">
                  Order placement to fulfillment time
                </p>
              </div>

            </div>

            {/* Visual Charts & Technical Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Revenue Chart + Payment Channels Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Revenue Chart Panel */}
                <CustomRevenueChart data={revenueData} />

                {/* Payment Channels Breakdown Panel */}
                <div className="bg-[#0f1011] border border-[#23252a] border-t-[#34343a]/60 rounded-lg p-5 sm:p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-[#f7f8f8] tracking-tight">Payment Channels</h3>
                      <p className="text-xs text-[#8a8f98] mt-0.5">Order distribution by payment option</p>
                    </div>
                    <span className="font-mono text-[11px] text-[#8a8f98] bg-[#141516] border border-[#23252a] px-2 py-0.5 rounded">
                      {totalOrders} total
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Online Now */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#f7f8f8]">Online Instant (Prepaid)</span>
                        <span className="font-mono text-[#d0d6e0]">
                          {onlineNowCount} <span className="text-[#62666d]">({onlineNowPct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#141516] h-2 rounded-full overflow-hidden border border-[#23252a]">
                        <div
                          className="bg-[#5e6ad2] h-full rounded-full transition-all duration-500"
                          style={{ width: `${onlineNowPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Online at End */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#f7f8f8]">Pay at End (Digital)</span>
                        <span className="font-mono text-[#d0d6e0]">
                          {onlineAtEndCount} <span className="text-[#62666d]">({onlineAtEndPct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#141516] h-2 rounded-full overflow-hidden border border-[#23252a]">
                        <div
                          className="bg-[#7a7fad] h-full rounded-full transition-all duration-500"
                          style={{ width: `${onlineAtEndPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Cash */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#f7f8f8]">Cash at Counter</span>
                        <span className="font-mono text-[#d0d6e0]">
                          {cashAtCounterCount} <span className="text-[#62666d]">({cashAtCounterPct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#141516] h-2 rounded-full overflow-hidden border border-[#23252a]">
                        <div
                          className="bg-[#27a644] h-full rounded-full transition-all duration-500"
                          style={{ width: `${cashAtCounterPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Popular Items Ranking Panel */}
              <div className="bg-[#0f1011] border border-[#23252a] border-t-[#34343a]/60 rounded-lg p-5 sm:p-6 space-y-4 flex flex-col shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-[#f7f8f8] tracking-tight">Popular Menu Items</h3>
                  <p className="text-xs text-[#8a8f98] mt-0.5">Top performing dishes in selected window</p>
                </div>

                {popularItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-8 h-8 rounded-md bg-[#141516] border border-[#23252a] flex items-center justify-center text-[#62666d] mb-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-[#f7f8f8]">No Sales Activity</p>
                    <p className="text-[11px] text-[#62666d] max-w-[180px] mx-auto mt-0.5 font-mono">
                      Completed item sales will aggregate here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                    {popularItems.map((item, idx) => {
                      const maxQty = Number(popularItems[0]?.total_quantity || 1)
                      const itemRatio = maxQty > 0 ? (Number(item.total_quantity) / maxQty) * 100 : 0
                      
                      return (
                        <div key={idx} className="relative group flex flex-col space-y-1.5 p-2 rounded-md hover:bg-[#141516] transition-colors border border-transparent hover:border-[#23252a]">
                          <div className="flex items-center justify-between text-xs z-10">
                            <div className="flex items-center space-x-2.5 truncate pr-2">
                              <span className="font-mono text-[10px] text-[#5e6ad2] font-semibold bg-[#141516] border border-[#23252a] w-5 h-5 flex items-center justify-center rounded shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[#f7f8f8] font-medium truncate">
                                {item.menu_item_name}
                              </span>
                            </div>
                            <span className="font-mono text-xs text-[#d0d6e0] font-semibold shrink-0">
                              {Number(item.total_quantity)} <span className="text-[10px] text-[#62666d] font-normal">sold</span>
                            </span>
                          </div>

                          {/* Linear Hairline Bar Indicator */}
                          <div className="w-full bg-[#141516] h-1.5 rounded overflow-hidden border border-[#23252a]">
                            <div
                              className="bg-[#5e6ad2]/40 group-hover:bg-[#5e6ad2] h-full rounded transition-colors duration-200"
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

      </div>
    </DashboardLayout>
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
    <div className="relative bg-[#0f1011] border border-[#23252a] border-t-[#34343a]/60 rounded-lg p-5 sm:p-6 w-full shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#f7f8f8] tracking-tight">Revenue Trend</h3>
          <p className="text-xs text-[#8a8f98] mt-0.5">Sales trajectory across selected timeframe</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-[#141516] border border-[#23252a] px-2.5 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-[#5e6ad2]" />
            <span className="text-[#d0d6e0]">Revenue (₹)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[230px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (height - 2 * paddingY)
            const val = maxRevenue - ratio * maxRevenue
            return (
              <g key={idx}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#23252a" strokeDasharray="3 3" strokeWidth="1" />
                <text x={paddingX - 8} y={y + 3} fill="#62666d" fontSize="9" textAnchor="end" className="font-mono">
                  ₹{Math.round(val)}
                </text>
              </g>
            )
          })}

          {fillD && <path d={fillD} fill="url(#chartGradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="#5e6ad2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

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
                  <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#5e6ad2" strokeWidth="1" strokeDasharray="3 3" className="pointer-events-none opacity-60" />
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === i ? 4 : 2}
                  fill="#010102"
                  stroke="#5e6ad2"
                  strokeWidth={hoveredIdx === i ? 2 : 1.5}
                  className="pointer-events-none transition-all duration-150"
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
              <text key={i} x={p.x} y={height - 6} fill="#62666d" fontSize="9" textAnchor="middle" className="font-mono">
                {d.label}
              </text>
            )
          })}
        </svg>

        {/* Floating Technical Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute z-20 bg-[#141516] border border-[#34343a] p-2.5 rounded-md shadow-2xl text-xs flex flex-col pointer-events-none space-y-0.5"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${Math.max(8, (points[hoveredIdx].y / height) * 100 - 25)}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px'
            }}
          >
            <span className="font-medium text-[#f7f8f8] text-[11px]">{data[hoveredIdx].label}</span>
            <span className="text-[#828fff] font-mono font-semibold">
              Revenue: ₹{Number(data[hoveredIdx].revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[#62666d] font-mono text-[10px]">
              Orders: {data[hoveredIdx].orderCount}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
