import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const path = nextUrl.pathname
  const session = req.auth
  const user = session?.user

  // 1. Admin Root Redirect (/admin -> /admin/restaurants)
  if (path === '/admin') {
    return NextResponse.redirect(new URL('/admin/restaurants', req.url))
  }

  // 2. Admin Login Route (/admin/login)
  if (path === '/admin/login') {
    if (user?.role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin/restaurants', req.url))
    }
    return NextResponse.next()
  }

  // 3. Protected Admin Routes (/admin/*)
  if (path.startsWith('/admin')) {
    if (!user || user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next()
  }

  // 4. Dashboard Login Route (/dashboard/login)
  if (path === '/dashboard/login') {
    if (user) {
      if (user.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/restaurants', req.url))
      }
      if (user.restaurantId) {
        return NextResponse.redirect(new URL(`/dashboard/${user.restaurantId}`, req.url))
      }
    }
    return NextResponse.next()
  }

  // 5. Protected Dashboard Routes (/dashboard/[restaurantId]/*)
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/dashboard/login', req.url))
    }

    const pathParts = path.split('/').filter(Boolean) // ["dashboard", restaurantId, ...]
    const targetRestaurantId = pathParts[1]

    // Super Admin has global access to all restaurant dashboards
    if (user.role !== 'super_admin') {
      // Enforce restaurant boundary scoping
      if (targetRestaurantId && targetRestaurantId !== user.restaurantId) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Access Denied - Kitchen Dashboard</title>
            <style>
              body {
                background-color: #010102;
                color: #f7f8f8;
                font-family: ui-sans-serif, system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .container {
                max-width: 400px;
                background-color: #0f1011;
                border: 1px solid #23252a;
                padding: 32px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              }
              .icon {
                color: #ff4d4d;
                background-color: rgba(255, 77, 77, 0.1);
                border: 1px solid rgba(255, 77, 77, 0.2);
                width: 64px;
                height: 64px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
              }
              h1 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; }
              p { color: #8a8f98; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
              .btn {
                background-color: #5e6ad2;
                color: #ffffff;
                border: none;
                padding: 10px 18px;
                font-size: 14px;
                font-weight: 500;
                border-radius: 8px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: background-color 0.15s;
              }
              .btn:hover { background-color: #828fff; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m0-8v6m0 5h.01M3.34 16L12 4l8.66 12H3.34z" />
                </svg>
              </div>
              <h1>Access Denied</h1>
              <p>You don't have access to this restaurant's dashboard.</p>
              <a href="/dashboard/login" class="btn">Sign In to Another Account</a>
            </div>
          </body>
          </html>`,
          {
            status: 403,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          }
        )
      }

      // Sub-route RBAC Checks
      const subRoute = pathParts[2] // e.g. "analytics", "menu", "tables"

      if (subRoute === 'analytics' || subRoute === 'menu' || subRoute === 'tables') {
        if (!['owner', 'manager'].includes(user.role)) {
          return NextResponse.redirect(new URL(`/dashboard/${targetRestaurantId}`, req.url))
        }
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
