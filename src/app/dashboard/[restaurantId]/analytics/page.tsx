import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { redirect, notFound } from 'next/navigation'
import { AnalyticsDashboardClient } from './AnalyticsDashboardClient'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export default async function AnalyticsDashboardPage({ params }: PageProps) {
  const { restaurantId } = await params

  // 1. Perform DAL security check for Owner or Manager role
  const { isAuthorized, reason, session } = await checkAuthorization(['owner', 'manager'], restaurantId)

  if (!isAuthorized || !session) {
    if (reason === 'UNAUTHENTICATED') {
      redirect('/dashboard/login')
    }
    // If forbidden role or wrong restaurant, redirect to main kitchen feed
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

  return (
    <AnalyticsDashboardClient
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
    />
  )
}
