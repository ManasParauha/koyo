import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { MenuItemCard } from './MenuItemCard'
import { HeaderCartBadge } from './HeaderCartBadge'
import { CartBottomBar } from './CartBottomBar'

interface PageProps {
  params: Promise<{
    restaurantId: string
    tableId: string
  }>
}

export default async function MenuPage({ params }: PageProps) {
  const { restaurantId, tableId } = await params

  const supabase = await createClient()

  // 1. Fetch restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name, upi_id')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Restaurant Not Found</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              We couldn't locate this restaurant. Please double check the QR code link.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 2. Fetch table & verify it belongs to restaurantId
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('table_number, restaurant_id')
    .eq('id', tableId)
    .single()

  if (tableError || !table || table.restaurant_id !== restaurantId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0f0f0f] text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] border border-[#222222] p-8 rounded-xl text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-[#ff4d4d] border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Invalid Table QR Code</h1>
            <p className="text-[#a8a8a8] text-sm leading-relaxed">
              This table link is invalid or doesn't belong to {restaurant.name}. Please scan the table's QR code again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 3. Fetch menu items where is_available = true
  const { data: menuItems, error: menuItemsError } = await supabase
    .from('menu_items')
    .select('id, name, description, price, category, image_url, is_available, is_veg')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  // Render empty state if there are no menu items
  const hasMenuItems = menuItems && menuItems.length > 0

  // Group menu items by category
  type MenuItem = NonNullable<typeof menuItems>[number]
  const menuByCategory: Record<string, MenuItem[]> = {}
  if (menuItems && menuItems.length > 0) {
    for (const item of menuItems) {
      if (!menuByCategory[item.category]) {
        menuByCategory[item.category] = []
      }
      menuByCategory[item.category].push(item)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#a8a8a8] font-sans pb-28 flex flex-col relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#222222] h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3 max-w-[80%]">
          <span className="font-semibold text-white text-base sm:text-lg tracking-tight truncate">
            {restaurant.name}
          </span>
          <span className="text-[#666666] flex-shrink-0">|</span>
          <span className="text-white text-xs font-semibold bg-[#181818] border border-[#222222] px-2 py-0.5 rounded-md flex-shrink-0">
            Table {table.table_number}
          </span>
        </div>
        <HeaderCartBadge />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {!hasMenuItems || menuItemsError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#181818] border border-[#222222] text-[#888888] mb-4">
              <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white tracking-tight mb-2">Menu coming soon</h2>
            <p className="text-sm text-[#888888] max-w-sm leading-relaxed">
              We are currently preparing our digital menu for this location. Please check back shortly!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(menuByCategory).map((category) => (
              <section key={category} className="space-y-6">
                <div className="flex items-center space-x-3 border-b border-[#1a1a1a] pb-2">
                  <div className="w-1.5 h-6 bg-[#0007cd] rounded-sm" />
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    {category}
                  </h2>
                  <span className="text-xs text-[#666666] bg-[#181818] px-2 py-0.5 rounded-md border border-[#222222]">
                    {menuByCategory[category].length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuByCategory[category].map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <CartBottomBar />
    </div>
  )
}


