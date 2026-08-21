import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ChangePasswordForm } from './ChangePasswordForm'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { restaurantId } = await params

  // Authorize all staff & admin roles
  const { isAuthorized, reason, session } = await checkAuthorization(
    ['owner', 'manager', 'kitchen', 'super_admin'],
    restaurantId
  )

  if (!isAuthorized || !session) {
    if (reason === 'UNAUTHENTICATED') {
      redirect('/dashboard/login')
    }
    redirect(`/dashboard/${restaurantId}`)
  }

  const supabase = getSupabaseForSession(session)

  // Fetch restaurant details for breadcrumbs
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    notFound()
  }

  return (
    <DashboardLayout
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      activePage="settings"
    >
      <ChangePasswordForm userEmail={session.user.email || ''} />
    </DashboardLayout>
  )
}
