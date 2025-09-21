import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/driver - Get current driver profile and statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a driver
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, full_name, phone, avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can access this endpoint' }, { status: 403 })
    }

    // Get driver profile
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (driverError) {
      console.error('Error fetching driver profile:', driverError)
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 })
    }

    // Get ride statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Today's rides
    const { data: todayRides } = await supabase
      .from('rides')
      .select('id, fare, status, created_at')
      .eq('driver_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // Recent rides (last 10)
    const { data: recentRides } = await supabase
      .from('rides')
      .select(`
        id,
        fare,
        status,
        created_at,
        pickup_location,
        dropoff_location,
        profiles!rides_passenger_id_fkey(full_name)
      `)
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate statistics
    const todayEarnings = todayRides?.reduce((sum, ride) => {
      return ride.status === 'completed' ? sum + parseFloat(ride.fare) : sum
    }, 0) || 0

    const completedTodayRides = todayRides?.filter(ride => ride.status === 'completed').length || 0

    // Format response
    const driverData = {
      id: user.id,
      name: profile.full_name,
      email: user.email,
      phone: profile.phone,
      avatar: profile.avatar_url,
      rating: driverProfile.rating,
      ridesCompleted: driverProfile.total_rides,
      status: driverProfile.is_available ? 'online' : 'offline',
      vehicle: {
        make: driverProfile.vehicle_make,
        model: driverProfile.vehicle_model,
        year: driverProfile.vehicle_year,
        color: driverProfile.vehicle_color,
        licensePlate: driverProfile.license_plate,
      },
      earnings: {
        total: driverProfile.total_earnings,
        today: todayEarnings,
        thisWeek: 0, // Would need weekly calculation
        pending: 0, // Would need pending calculation
      },
      todayStats: {
        earnings: todayEarnings,
        completedRides: completedTodayRides,
      },
      recentActivity: recentRides?.map(ride => {
        const profile = Array.isArray(ride.profiles) ? ride.profiles[0] : ride.profiles;
        return {
          id: ride.id,
          from: ride.pickup_location,
          to: ride.dropoff_location,
          amount: parseFloat(ride.fare),
          passenger: profile?.full_name || 'Unknown',
          status: ride.status,
          time: new Date(ride.created_at).toLocaleTimeString(),
        };
      }) || [],
      documents: {
        verified: driverProfile.documents_verified,
        backgroundCheck: driverProfile.background_check_status === 'approved',
      }
    }

    return NextResponse.json(driverData)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/driver - Update driver availability status
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a driver
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can update availability' }, { status: 403 })
    }

    const body = await request.json()
    const { is_available } = body

    if (typeof is_available !== 'boolean') {
      return NextResponse.json({ error: 'is_available must be a boolean' }, { status: 400 })
    }

    // Update driver availability
    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update({ is_available })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating driver availability:', updateError)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    return NextResponse.json({ success: true, is_available })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}