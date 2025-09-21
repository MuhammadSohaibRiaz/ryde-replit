import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rides/history - Get ride history for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check user type
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let rides;
    
    if (profile.user_type === 'passenger') {
      // Get rides as passenger
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          fare,
          status,
          created_at,
          distance_km,
          estimated_duration,
          actual_duration,
          driver:profiles!rides_driver_id_fkey(full_name, avatar_url),
          driver_profiles!rides_driver_id_fkey(rating, vehicle_make, vehicle_model, vehicle_color)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching passenger rides:', error)
        return NextResponse.json({ error: 'Failed to fetch ride history' }, { status: 500 })
      }

      rides = data
    } else if (profile.user_type === 'driver') {
      // Get rides as driver
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          fare,
          status,
          created_at,
          distance_km,
          estimated_duration,
          actual_duration,
          passenger:profiles!rides_passenger_id_fkey(full_name, avatar_url)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching driver rides:', error)
        return NextResponse.json({ error: 'Failed to fetch ride history' }, { status: 500 })
      }

      rides = data
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    // Format the response
    const formattedRides = rides?.map(ride => {
      const driver = profile.user_type === 'passenger' && 'driver' in ride
        ? (Array.isArray(ride.driver) ? ride.driver[0] : ride.driver)
        : null
      const passenger = profile.user_type === 'driver' && 'passenger' in ride
        ? (Array.isArray(ride.passenger) ? ride.passenger[0] : ride.passenger)
        : null
      const driverProfile = profile.user_type === 'passenger' && 'driver_profiles' in ride
        ? (Array.isArray(ride.driver_profiles) ? ride.driver_profiles[0] : ride.driver_profiles)
        : null

      return {
        id: ride.id,
        from: ride.pickup_location,
        to: ride.dropoff_location,
        amount: parseFloat(ride.fare),
        status: ride.status,
        date: new Date(ride.created_at).toLocaleDateString(),
        time: new Date(ride.created_at).toLocaleTimeString(),
        distance: ride.distance_km ? `${ride.distance_km} km` : 'N/A',
        duration: ride.actual_duration ? `${ride.actual_duration} min` : 
                 ride.estimated_duration ? `~${ride.estimated_duration} min` : 'N/A',
        // Include counterpart details
        ...(profile.user_type === 'passenger' && driver && {
          driverName: driver.full_name || 'Unknown Driver',
          driverAvatar: driver.avatar_url,
          driverRating: driverProfile?.rating || 5.0,
          vehicle: driverProfile ? 
            `${driverProfile.vehicle_make} ${driverProfile.vehicle_model} (${driverProfile.vehicle_color})` : 
            'Vehicle info unavailable'
        }),
        ...(profile.user_type === 'driver' && passenger && {
          passengerName: passenger.full_name || 'Unknown Passenger',
          passengerAvatar: passenger.avatar_url,
        })
      }
    }) || []

    return NextResponse.json({ 
      rides: formattedRides,
      userType: profile.user_type,
      totalCount: formattedRides.length,
      hasMore: formattedRides.length === limit
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}