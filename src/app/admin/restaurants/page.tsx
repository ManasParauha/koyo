import React from 'react'
import { createClient } from '@/lib/supabase/server'
import RestaurantsClient, { RestaurantSummary } from './RestaurantsClient'

export const dynamic = 'force-dynamic'

export default async function AdminRestaurantsPage() {
  const supabase = await createClient()

  // Fetch all restaurants with nested counts of tables and menu items
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select(`
      id,
      name,
      upi_id,
      address,
      created_at,
      tables (count),
      menu_items (count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching restaurants for admin:', error)
  }

  const list = (restaurants || []) as unknown as RestaurantSummary[]

  return <RestaurantsClient initialRestaurants={list} />
}
