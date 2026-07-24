import React from 'react'
import { createClient } from '@/lib/supabase/server'
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

  // 4. Fetch all tables
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

  // 5. Auto-generate QR codes for any tables where qr_code_url is missing
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
