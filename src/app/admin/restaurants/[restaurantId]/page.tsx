import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AddStaffForm from '../AddStaffForm'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { restaurantId } = await params

  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  // 1. Fetch restaurant info
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single()

  if (restError || !restaurant) {
    notFound()
  }

  // 2. Fetch tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('table_number', { ascending: true })

  if (tablesError) {
    console.error('Error fetching tables:', tablesError)
  }

  // 3. Fetch menu items count
  const { count: menuCount, error: menuError } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)

  if (menuError) {
    console.error('Error fetching menu items count:', menuError)
  }

  // 4. Fetch linked staff accounts via admin client & our custom view
  const { data: staffList, error: staffError } = await adminSupabase
    .from('staff_details')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (staffError) {
    console.error('Error fetching staff list:', staffError)
  }

  const staffItems = staffList || []

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/admin/restaurants"
          className="inline-flex items-center space-x-1 text-xs text-[#a8a8a8] hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Restaurants</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#222222] pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">{restaurant.name}</h1>
        <p className="text-xs text-[#a8a8a8] mt-1 font-mono">
          ID: {restaurant.id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant info card */}
          <div className="bg-[#181818] border border-[#222222] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">General Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#666666] font-medium block">UPI ID</span>
                <span className="font-mono text-white select-all">{restaurant.upi_id || 'Not configured'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[#666666] font-medium block">Registered On</span>
                <span className="text-[#a8a8a8]">
                  {new Date(restaurant.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[#666666] font-medium block">Address</span>
                <span className="text-[#a8a8a8] leading-relaxed">{restaurant.address || 'No address provided'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#222222] text-center">
              <div className="bg-[#0f0f0f] border border-[#222222] p-4 rounded-md">
                <span className="text-[20px] font-bold text-white block">{tables?.length || 0}</span>
                <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider">Tables</span>
              </div>
              <div className="bg-[#0f0f0f] border border-[#222222] p-4 rounded-md">
                <span className="text-[20px] font-bold text-white block">{menuCount || 0}</span>
                <span className="text-[10px] text-[#666666] uppercase font-bold tracking-wider">Menu Items</span>
              </div>
            </div>
          </div>

          {/* Tables layout card */}
          <div className="bg-[#181818] border border-[#222222] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Active Tables ({tables?.length || 0})</h3>

            {!tables || tables.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#666666]">
                No tables registered for this restaurant yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tables.map((t) => (
                  <div key={t.id} className="bg-[#0f0f0f] border border-[#222222] p-3 rounded-md text-center text-xs space-y-1 hover:border-[#333333] transition-colors">
                    <span className="text-[#a8a8a8] block text-[10px] uppercase font-semibold">Table</span>
                    <span className="text-white font-semibold text-sm">{t.table_number}</span>
                    {t.qr_code_url && (
                      <a
                        href={t.qr_code_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00d4ff] hover:underline block text-[10px] pt-1"
                      >
                        View QR Code
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Linked Staff Accounts list */}
          <div className="bg-[#181818] border border-[#222222] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Staff Accounts ({staffItems.length})</h3>

            {staffItems.length === 0 ? (
              <p className="text-xs text-[#666666] text-center py-4">No staff profiles linked.</p>
            ) : (
              <div className="divide-y divide-[#222222] max-h-[300px] overflow-y-auto pr-1">
                {staffItems.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                    <div className="space-y-0.5 truncate">
                      <p className="text-white font-medium truncate">{item.email}</p>
                      <p className="text-[10px] text-[#666666]">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                      item.role === 'owner'
                        ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                        : 'bg-[#222222] text-[#a8a8a8] border border-[#333333]'
                    }`}>
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Staff Action form component */}
          <AddStaffForm restaurantId={restaurantId} />
        </div>
      </div>
    </div>
  )
}
