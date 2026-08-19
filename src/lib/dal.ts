import 'server-only'
import { cache } from 'react'
import { auth } from '@/auth'

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'kitchen'

/**
 * Retrieves and memoizes the current authenticated Auth.js session during a render pass.
 */
export const verifySession = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    return null
  }
  return session
})

/**
 * Utility to verify if the active session possesses one of the required roles and matches the restaurantId scope.
 */
export const checkAuthorization = cache(
  async (allowedRoles: UserRole[], targetRestaurantId?: string) => {
    const session = await verifySession()

    if (!session?.user) {
      return { isAuthorized: false, reason: 'UNAUTHENTICATED' as const, session: null }
    }

    const { role, restaurantId: userRestaurantId } = session.user

    // Super Admin has global platform authorization
    if (role === 'super_admin') {
      return { isAuthorized: true, reason: 'OK' as const, session }
    }

    // Role check
    if (!allowedRoles.includes(role)) {
      return { isAuthorized: false, reason: 'FORBIDDEN_ROLE' as const, session }
    }

    // Restaurant boundary check
    if (targetRestaurantId && userRestaurantId !== targetRestaurantId) {
      return { isAuthorized: false, reason: 'FORBIDDEN_RESTAURANT' as const, session }
    }

    return { isAuthorized: true, reason: 'OK' as const, session }
  }
)
