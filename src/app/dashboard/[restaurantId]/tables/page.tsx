import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { getSupabaseForSession } from '@/lib/supabase/session-client'
import { redirect, notFound } from 'next/navigation'
import { TableManager } from './TableManager'
import QRCode from 'qrcode'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

// Helper to generate QR code on the fly
async function getQRCodeDataUrl(restaurantId: string, tableId: string) {
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const menuUrl = `${baseDomain}/menu/${restaurantId}/${tableId}`
  return await QRCode.toDataURL(menuUrl, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}

export default async function TablesDashboardPage({ params }: PageProps) {
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

  // 3. Fetch all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, restaurant_id, table_number, qr_code_url, created_at')
    .eq('restaurant_id', restaurantId)

  // Sort tables: attempt to sort numerically if possible, otherwise alphabetically
  const sortedTables = (tables || []).sort((a, b) => {
    const numA = parseInt(a.table_number, 10)
    const numB = parseInt(b.table_number, 10)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.table_number.localeCompare(b.table_number)
  })

  // 4. Auto-generate QR codes for any tables where qr_code_url is missing
  const processedTables = await Promise.all(
    sortedTables.map(async (table) => {
      if (!table.qr_code_url) {
        try {
          const qr = await getQRCodeDataUrl(restaurantId, table.id)
          await supabase
            .from('tables')
            .update({ qr_code_url: qr })
            .eq('id', table.id)
          return { ...table, qr_code_url: qr }
        } catch (err) {
          console.error(`Failed to auto-generate QR code for table ${table.table_number}:`, err)
          return table
        }
      }
      return table
    })
  )

  return (
    <TableManager
      restaurantId={restaurantId}
      restaurantName={restaurant.name}
      initialTables={processedTables}
    />
  )
}
