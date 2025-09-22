import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      license_number,
      license_expiry_date,
      license_state,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      vehicle_plate_number
    } = body

    // Check if user is already setup as driver
    const { data: existingDriver } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (existingDriver) {
      return NextResponse.json(
        { error: 'Driver profile already exists' },
        { status: 400 }
      )
    }

    // Update user profile to driver type with pending verification
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: 'driver',
        account_status: 'pending_verification',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }

    // Create driver profile
    const { error: driverError } = await supabase
      .from('driver_profiles')
      .insert({
        user_id: user.id,
        license_number,
        license_expiry_date,
        license_state,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        vehicle_plate_number,
        verification_status: 'pending',
        documents_submitted_at: null,
        is_online: false,
        can_receive_rides: false,
        total_rides: 0,
        avg_rating: 0.0
      })

    if (driverError) {
      console.error('Error creating driver profile:', driverError)
      
      // Rollback profile update
      await supabase
        .from('profiles')
        .update({
          user_type: 'passenger',
          account_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      return NextResponse.json(
        { error: 'Failed to create driver profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Driver profile created successfully',
      next_step: 'document_upload',
      verification_status: 'pending'
    })

  } catch (error) {
    console.error('Complete driver profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}