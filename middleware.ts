import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes
  const protectedRoutes = {
    passenger: ['/main'],
    driver: ['/driver-profile', '/driver-dashboard'],
    admin: ['/admin', '/onlyforadmin'], // CRITICAL: Protect admin PIN page
    authenticated: ['/profile'] // Routes accessible to any authenticated user
  }

  const currentPath = request.nextUrl.pathname
  
  // Check if the current path requires authentication
  const isProtectedRoute = Object.values(protectedRoutes).flat().includes(currentPath) ||
    currentPath.startsWith('/admin')

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    // Redirect to appropriate login page
    if (currentPath.startsWith('/driver') || currentPath === '/driver-profile') {
      return NextResponse.redirect(new URL('/auth/driver/login', request.url))
    } else if (currentPath.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth/passenger/login?message=Admin access restricted', request.url))
    } else {
      return NextResponse.redirect(new URL('/auth/passenger/login', request.url))
    }
  }

  // If user is authenticated, check role-based access
  if (user && isProtectedRoute) {
    try {
      // Get user profile to check role and account status
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, account_status')
        .eq('id', user.id)
        .single()

      const userType = profile?.user_type
      const accountStatus = profile?.account_status

      // Check account status first
      if (accountStatus === 'suspended' || accountStatus === 'banned') {
        return NextResponse.redirect(new URL('/auth/account-suspended', request.url))
      }

      // Check if driver is pending verification and trying to access driver routes
      if (userType === 'driver' && accountStatus === 'pending_verification' && 
          (protectedRoutes.driver.includes(currentPath) || currentPath.startsWith('/driver'))) {
        return NextResponse.redirect(new URL('/auth/verification-pending', request.url))
      }

      // Check role-based access - Apply to all admin routes
      if ((currentPath.startsWith('/admin') || protectedRoutes.admin.includes(currentPath)) && userType !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (protectedRoutes.driver.includes(currentPath) && userType !== 'driver') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (protectedRoutes.passenger.includes(currentPath) && userType !== 'passenger') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Allow any authenticated user to access /profile
      if (currentPath === '/profile') {
        // This is handled by the authenticated routes - allow access
      }

      // Redirect to appropriate dashboard if user tries to access wrong auth pages
      if (currentPath.startsWith('/auth/') && user) {
        switch (userType) {
          case 'passenger':
            return NextResponse.redirect(new URL('/main', request.url))
          case 'driver':
            return NextResponse.redirect(new URL('/driver-profile', request.url))
          case 'admin':
            return NextResponse.redirect(new URL('/admin', request.url))
        }
      }
    } catch (error) {
      // If there's an error fetching profile, redirect to login
      return NextResponse.redirect(new URL('/auth/passenger/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}