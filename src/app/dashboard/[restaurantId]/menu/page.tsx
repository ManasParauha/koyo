import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { redirect, notFound } from 'next/navigation'
import { MenuManager } from './MenuManager'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export default async function MenuDashboardPage({ params }: PageProps) {
  const { restaurantId } = await params

  // 1. DAL security check for Owner or Manager role
  const { isAuthorized, reason, session } = await checkAuthorization(['owner', 'manager'], restaurantId)

  if (!isAuthorized || !session) {
    if (reason === 'UNAUTHENTICATED') {
      redirect('/dashboard/login')
    }
    redirect(`/dashboard/${restaurantId}`)
  }

  const supabase = getSupabaseForSession(session)

  // 2. Fetch restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // 3. Fetch all menu items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, restaurant_id, name, description, price, category, image_url, is_available, is_veg, created_at')
    .eq('restaurant_id', restaurantId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  return (
    <MenuManager
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      initialMenuItems={menuItems || []}
    />
  )
}
