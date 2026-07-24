import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MenuManager } from './MenuManager'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export default async function MenuDashboardPage({ params }: PageProps) {
  const { restaurantId } = await params

  const supabase = await createClient()

  // 1. Fetch current user session to ensure authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/dashboard/login')
  }

  // 2. Fetch staff details to verify access to this restaurantId
  const { data: staff } = await supabase
    .from('staff')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!staff || staff.restaurant_id !== restaurantId) {
    redirect('/dashboard/login')
  }

  // 3. Fetch restaurant details
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // 4. Fetch all menu items (available and unavailable)
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
