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
      // Check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create profile from user metadata
        const userMetadata = data.user.user_metadata
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userMetadata.full_name,
            email: data.user.email,
            phone: userMetadata.phone,
            user_type: userMetadata.user_type || 'passenger',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        // If user is a driver, create driver profile entry
        if (userMetadata.user_type === 'driver') {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              user_id: data.user.id,
              vehicle_make: '',
              vehicle_model: '',
              vehicle_year: null,
              vehicle_color: '',
              vehicle_plate: '',
              license_number: '',
              is_available: false,
              rating: 5.0,
              total_rides: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (driverProfileError) {
            console.error('Error creating driver profile:', driverProfileError)
          }
        }
      }

      // Redirect based on user type
      const userType = existingProfile?.user_type || data.user.user_metadata?.user_type
      let redirectPath = next

      if (next === '/') {
        switch (userType) {
          case 'driver':
            redirectPath = '/driver-profile'
            break
          case 'admin':
            redirectPath = '/admin'
            break
          default:
            redirectPath = '/main'
        }
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}