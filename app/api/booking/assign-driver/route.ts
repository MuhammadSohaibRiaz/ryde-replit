import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/booking/assign-driver - Assign a driver to a ride request
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, driver_id } = body

    if (!ride_id || !driver_id) {
      return NextResponse.json({ error: 'Ride ID and Driver ID are required' }, { status: 400 })
    }

    // Get current ride details
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('passenger_id, driver_id, status')
      .eq('id', ride_id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Verify user is the passenger who created this ride or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const canAssign = 
      profile?.user_type === 'admin' ||
      ride.passenger_id === user.id

    if (!canAssign) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if ride is in correct status for assignment
    if (ride.status !== 'requested') {
      return NextResponse.json({ 
        error: 'Ride cannot be assigned. Current status: ' + ride.status 
      }, { status: 400 })
    }

    // Check if driver is available
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select('status, is_available, documents_verified, background_check_verified')
      .eq('user_id', driver_id)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    if (driver.status !== 'online' || !driver.is_available) {
      return NextResponse.json({ error: 'Driver is not available' }, { status: 400 })
    }

    if (!driver.documents_verified || !driver.background_check_verified) {
      return NextResponse.json({ error: 'Driver is not verified' }, { status: 400 })
    }

    // Start transaction: Assign driver to ride and update driver availability
    const { data: updatedRide, error: assignError } = await supabase
      .from('rides')
      .update({
        driver_id: driver_id,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ride_id)
      .eq('status', 'requested') // Double-check status hasn't changed
      .select(`
        *,
        passenger:profiles!rides_passenger_id_fkey(full_name, phone),
        driver:profiles!rides_driver_id_fkey(full_name, phone, avatar_url)
      `)
      .single()

    if (assignError) {
      console.error('Error assigning driver:', assignError)
      return NextResponse.json({ error: 'Failed to assign driver' }, { status: 500 })
    }

    // Update driver availability
    const { error: driverUpdateError } = await supabase
      .from('driver_profiles')
      .update({
        is_available: false,
        status: 'busy',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', driver_id)

    if (driverUpdateError) {
      console.error('Error updating driver status:', driverUpdateError)
      // Note: This could lead to inconsistent state, but the ride assignment succeeded
    }

    // TODO: Send notifications to driver about new ride assignment
    // TODO: Send notification to passenger that driver has been assigned

    return NextResponse.json({
      ride: updatedRide,
      message: 'Driver successfully assigned to ride'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}