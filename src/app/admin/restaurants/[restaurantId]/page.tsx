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
          className="inline-flex items-center space-x-1.5 text-xs text-ink-subtle hover:text-ink transition-colors font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Restaurants</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-hairline pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink font-display">{restaurant.name}</h1>
          <p className="text-xs text-ink-tertiary mt-1 font-mono">
            ID: {restaurant.id}
          </p>
        </div>
      </div>

      {/* Section 1: General Information & Staff Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Restaurant info card (Span 2) */}
        <div className="lg:col-span-2 bg-surface-1 border border-hairline rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink font-display mb-4">General Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-ink-tertiary font-mono text-[10px] uppercase tracking-wider block">UPI ID</span>
                <span className="font-mono text-ink select-all">{restaurant.upi_id || 'Not configured'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-ink-tertiary font-mono text-[10px] uppercase tracking-wider block">Registered On</span>
                <span className="text-ink-muted font-mono">
                  {new Date(restaurant.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-ink-tertiary font-mono text-[10px] uppercase tracking-wider block">Address</span>
                <span className="text-ink-muted leading-relaxed">{restaurant.address || 'No address provided'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-hairline text-center">
            <div className="bg-surface-2 border border-hairline p-4 rounded-lg">
              <span className="text-xl font-semibold font-display text-ink block">{tables?.length || 0}</span>
              <span className="text-[10px] text-ink-tertiary uppercase font-mono tracking-wider">Active Tables</span>
            </div>
            <div className="bg-surface-2 border border-hairline p-4 rounded-lg">
              <span className="text-xl font-semibold font-display text-ink block">{menuCount || 0}</span>
              <span className="text-[10px] text-ink-tertiary uppercase font-mono tracking-wider">Menu Items</span>
            </div>
          </div>
        </div>

        {/* Linked Staff Accounts list (Span 1) */}
        <div className="lg:col-span-1 bg-surface-1 border border-hairline rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink font-display mb-3">Staff Accounts ({staffItems.length})</h3>

            {staffItems.length === 0 ? (
              <p className="text-xs text-ink-tertiary text-center py-6">No staff profiles linked.</p>
            ) : (
              <div className="divide-y divide-hairline max-h-[220px] overflow-y-auto pr-1">
                {staffItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                    <div className="space-y-0.5 truncate">
                      <p className="text-ink font-medium truncate font-sans">{item.email}</p>
                      <p className="text-[10px] text-ink-tertiary font-mono">
                        Added {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wide shrink-0 ${
                      item.role === 'owner'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface-2 text-ink-muted border border-hairline'
                    }`}>
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-ink-tertiary border-t border-hairline pt-3 font-mono">
            {staffItems.length} active login{staffItems.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Section 2: Active Tables & Add Staff Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Tables layout card (Span 2) */}
        <div className="lg:col-span-2 bg-surface-1 border border-hairline rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink font-display mb-4">Active Tables ({tables?.length || 0})</h3>

            {!tables || tables.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-tertiary my-auto">
                No tables registered for this restaurant yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tables.map((t) => (
                  <div key={t.id} className="bg-surface-2 border border-hairline p-3 rounded-lg text-center text-xs space-y-1 hover:border-hairline-strong transition-colors">
                    <span className="text-ink-tertiary block text-[10px] uppercase font-mono tracking-wider">Table</span>
                    <span className="text-ink font-semibold text-sm font-display">{t.table_number}</span>
                    {t.qr_code_url && (
                      <a
                        href={t.qr_code_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-primary-hover block text-[10px] pt-1 font-mono font-medium transition-colors"
                      >
                        View QR Code
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {tables && tables.length > 0 && (
            <p className="text-[11px] text-ink-tertiary border-t border-hairline pt-3 font-mono">
              Total {tables.length} table placard{tables.length === 1 ? '' : 's'} configured
            </p>
          )}
        </div>

        {/* Add Staff Action form component (Span 1) */}
        <div className="lg:col-span-1 flex flex-col">
          <AddStaffForm restaurantId={restaurantId} />
        </div>
      </div>
    </div>
  )
}
