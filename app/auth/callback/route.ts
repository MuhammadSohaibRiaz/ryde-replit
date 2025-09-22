import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if profile exists, if not it should be auto-created by trigger
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_type, account_status, full_name')
        .eq('id', data.user.id)
        .single()

      // If user registered as driver, check if driver profile needs to be created
      const userMetadata = data.user.user_metadata
      if (existingProfile?.user_type === 'driver') {
        // Check if driver profile exists
        const { data: driverProfile } = await supabase
          .from('driver_profiles')
          .select('verification_status')
          .eq('user_id', data.user.id)
          .single()

        // If no driver profile and this was a driver registration, create it
        if (!driverProfile && userMetadata.registration_type === 'driver') {
          // Driver profile should be created during registration
          // This is a fallback in case it wasn't created
          console.log('Driver profile missing for user:', data.user.id)
        }
      }

      // Update last login timestamp
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)

      if (existingProfile) {
        const { user_type, account_status } = existingProfile

        // Handle different account statuses
        if (account_status === 'suspended' || account_status === 'banned') {
          return NextResponse.redirect(`${origin}/auth/account-suspended`)
        }

        // Role-based redirect with verification status check
        switch (user_type) {
          case 'driver':
            if (account_status === 'pending_verification') {
              return NextResponse.redirect(`${origin}/auth/verification-pending`)
            }
            return NextResponse.redirect(`${origin}/driver-profile`)
          case 'admin':
            return NextResponse.redirect(`${origin}/admin`)
          case 'passenger':
          default:
            return NextResponse.redirect(`${origin}/main`)
        }
      }

      // Fallback redirect if profile not found
      return NextResponse.redirect(`${origin}/main`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}