import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/drivers/[id] - Get specific driver profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch driver profile with user details
    const { data: driver, error } = await supabase
      .from('driver_profiles')
      .select(`
        *,
        user:profiles!driver_profiles_user_id_fkey(full_name, phone, avatar_url, email)
      `)
      .eq('user_id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Check authorization - driver can view own profile, admin can view all
    const isAuthorized = 
      profile?.user_type === 'admin' ||
      driver.user_id === user.id

    if (!isAuthorized) {
      // For passengers, return limited public info only
      return NextResponse.json({
        driver: {
          user_id: driver.user_id,
          full_name: driver.user.full_name,
          avatar_url: driver.user.avatar_url,
          rating: driver.rating,
          total_rides: driver.total_rides,
          vehicle_make: driver.vehicle_make,
          vehicle_model: driver.vehicle_model,
          vehicle_color: driver.vehicle_color,
          vehicle_plate: driver.vehicle_plate,
          status: driver.status
        }
      })
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/drivers/[id] - Update driver profile or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Check authorization - only the driver themselves or admin can update
    const canUpdate = 
      profile?.user_type === 'admin' ||
      params.id === user.id

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() }

    // Handle different types of updates
    const {
      status,
      is_available,
      current_location,
      current_heading,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      vehicle_plate,
      license_number,
      license_expiry
    } = body

    // Status updates (online/offline/busy)
    if (status && ['online', 'offline', 'busy'].includes(status)) {
      updateData.status = status
      if (status === 'online') {
        updateData.is_available = true
      } else if (status === 'offline') {
        updateData.is_available = false
      }
    }

    // Availability toggle
    if (typeof is_available === 'boolean') {
      updateData.is_available = is_available
    }

    // Location updates
    if (current_location && current_location.lat && current_location.lng) {
      updateData.current_location = `POINT(${current_location.lng} ${current_location.lat})`
      updateData.last_location_update = new Date().toISOString()
    }

    if (typeof current_heading === 'number') {
      updateData.current_heading = current_heading
    }

    // Vehicle information updates (only by driver or admin)
    if (vehicle_make) updateData.vehicle_make = vehicle_make
    if (vehicle_model) updateData.vehicle_model = vehicle_model
    if (vehicle_year) updateData.vehicle_year = vehicle_year
    if (vehicle_color) updateData.vehicle_color = vehicle_color
    if (vehicle_plate) updateData.vehicle_plate = vehicle_plate

    // License information (admin only for verification)
    if (profile?.user_type === 'admin') {
      if (license_number) updateData.license_number = license_number
      if (license_expiry) updateData.license_expiry = license_expiry
    }

    // Update the driver profile
    const { data: updatedDriver, error: updateError } = await supabase
      .from('driver_profiles')
      .update(updateData)
      .eq('user_id', params.id)
      .select(`
        *,
        user:profiles!driver_profiles_user_id_fkey(full_name, phone, avatar_url, email)
      `)
      .single()

    if (updateError) {
      console.error('Error updating driver:', updateError)
      return NextResponse.json({ error: 'Failed to update driver profile' }, { status: 500 })
    }

    return NextResponse.json({ driver: updatedDriver })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}