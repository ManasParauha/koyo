import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { SettingsClientView } from './SettingsClientView'
import { StaffMember } from './WorkplaceTeamManager'

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

  const isOwnerOrSuperAdmin = ['owner', 'super_admin'].includes(session.user.role)
  let staffList: StaffMember[] = []

  if (isOwnerOrSuperAdmin) {
    const adminSupabase = await createAdminClient()
    const { data: staffData, error: staffError } = await adminSupabase
      .from('staff_details')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (staffError) {
      console.error('Error fetching staff list for settings:', staffError)
    } else {
      staffList = (staffData || []) as StaffMember[]
    }
  }

  return (
    <DashboardLayout
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      activePage="settings"
    >
      <SettingsClientView
        isOwnerOrSuperAdmin={isOwnerOrSuperAdmin}
        restaurantId={restaurantId}
        staffList={staffList}
        currentUserId={session.user.id}
        userEmail={session.user.email || ''}
      />
    </DashboardLayout>
  )
}


