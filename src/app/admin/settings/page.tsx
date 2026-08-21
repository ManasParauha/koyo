import React from 'react'
import { checkAuthorization } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from '@/app/dashboard/[restaurantId]/settings/ChangePasswordForm'

export default async function AdminSettingsPage() {
  const { isAuthorized, session } = await checkAuthorization(['super_admin'])

  if (!isAuthorized || !session) {
    redirect('/admin/login')
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#010102] py-8 px-4">
      <ChangePasswordForm userEmail={session.user.email || ''} />
    </main>
  )
}
