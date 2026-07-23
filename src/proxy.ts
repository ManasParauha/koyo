import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const url = new URL(request.url)
  const path = url.pathname

  // Match /dashboard/[restaurantId]/... but NOT /dashboard/login
  const isDashboardRoute = path.startsWith('/dashboard')
  const isLoginRoute = path === '/dashboard/login'

  if (isLoginRoute) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: staff } = await supabase
        .from('staff')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      if (staff?.restaurant_id) {
        return NextResponse.redirect(new URL(`/dashboard/${staff.restaurant_id}`, request.url))
      }
    }
  }

  if (isDashboardRoute && !isLoginRoute) {
    // Check if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // User is not logged in -> redirect to /dashboard/login
      const loginUrl = new URL('/dashboard/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated! Now verify if staff record's restaurant_id matches the [restaurantId] in the URL
    const pathParts = path.split('/').filter(Boolean) // e.g. ["dashboard", "restaurantId", ...]
    const restaurantId = pathParts[1]

    if (restaurantId && restaurantId !== 'login') {
      // Fetch staff record from database
      const { data: staff, error } = await supabase
        .from('staff')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      if (error || !staff || staff.restaurant_id !== restaurantId) {
        // Logged in but restaurant ID doesn't match!
        // Return a clean 403 Forbidden page as specified in requirement 4
        return new NextResponse(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Access Denied - Kitchen Dashboard</title>
            <style>
              body {
                background-color: #0f0f0f;
                color: #ffffff;
                font-family: ui-sans-serif, system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .container {
                max-width: 400px;
                background-color: #181818;
                border: 1px solid #222222;
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
              h1 {
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 12px 0;
              }
              p {
                color: #a8a8a8;
                font-size: 14px;
                line-height: 1.6;
                margin: 0 0 24px 0;
              }
              .btn {
                background-color: #0007cd;
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
              .btn:hover {
                background-color: #0005a3;
              }
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
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all dashboard paths (including deep nested ones)
    '/dashboard/:path*',
  ],
}
