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
        // Create profile from user metadata - SECURITY: ALWAYS default to passenger, NEVER trust client for roles
        const userMetadata = data.user.user_metadata
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userMetadata.full_name,
            email: data.user.email,
            phone: userMetadata.phone,
            user_type: 'passenger', // SECURITY: Always passenger by default - no client role assignment
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        // SECURITY: If user wants to be a driver, store as pending application (not auto-approve)
        if (userMetadata.registration_type === 'driver') {
          // TODO: Create pending driver application for admin review
          // This would be stored in a separate table for approval workflow
          console.log('Driver application submitted for:', data.user.id)
        }
      }

      // Redirect based on user type - SECURE: Always query database for role, never trust metadata
      let userType = 'passenger'
      
      if (existingProfile) {
        userType = existingProfile.user_type
      } else {
        // Re-query database after profile creation to ensure accuracy
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single()
        
        userType = newProfile?.user_type || 'passenger'
      }

      // SECURITY: Whitelist safe redirect paths and ignore client-controlled 'next' for role-based routing
      const safeRedirectPaths = ['/main', '/profile']
      let redirectPath = '/main' // Default safe path

      if (next && safeRedirectPaths.includes(next)) {
        redirectPath = next
      } else {
        // Role-based redirect (ignore potentially malicious 'next' parameter)
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