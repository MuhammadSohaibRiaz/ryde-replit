import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      email,
      full_name,
      phone,
      license_number,
      license_expiry_date,
      license_state,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      vehicle_plate_number
    } = body

    // Validate required fields
    if (!email || !full_name || !license_number || !license_expiry_date || 
        !vehicle_make || !vehicle_model || !vehicle_year || !vehicle_plate_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate vehicle year
    const currentYear = new Date().getFullYear()
    if (vehicle_year < 2010 || vehicle_year > currentYear + 1) {
      return NextResponse.json(
        { error: 'Vehicle year must be between 2010 and current year' },
        { status: 400 }
      )
    }

    // Validate license expiry is in the future
    const expiryDate = new Date(license_expiry_date)
    if (expiryDate <= new Date()) {
      return NextResponse.json(
        { error: 'License expiry date must be in the future' },
        { status: 400 }
      )
    }

    // Check if license number already exists
    const { data: existingLicense } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('license_number', license_number)
      .eq('license_state', license_state)
      .single()

    if (existingLicense) {
      return NextResponse.json(
        { error: 'This license number is already registered' },
        { status: 400 }
      )
    }

    // Check if vehicle plate already exists
    const { data: existingPlate } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('vehicle_plate_number', vehicle_plate_number)
      .single()

    if (existingPlate) {
      return NextResponse.json(
        { error: 'This vehicle plate number is already registered' },
        { status: 400 }
      )
    }

    // Create Supabase auth user with OTP
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          full_name,
          phone,
          user_type: 'driver',
          registration_type: 'driver'
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Store driver details in temporary storage for completion after OTP verification
    // In production, you might use Redis or a temporary database table
    // For now, we'll return a success with instructions
    
    return NextResponse.json({
      success: true,
      message: 'Registration initiated! Check your email for verification link.',
      next_step: 'email_verification',
      driver_data: {
        license_number,
        license_expiry_date,
        license_state,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        vehicle_plate_number
      }
    })

  } catch (error) {
    console.error('Driver registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}