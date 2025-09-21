import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rides - Fetch rides (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('rides')
      .select(`
        *,
        passenger:profiles!rides_passenger_id_fkey(full_name, phone),
        driver:profiles!rides_driver_id_fkey(full_name, phone)
      `)

    // Apply role-based filters
    if (profile?.user_type === 'passenger') {
      query = query.eq('passenger_id', user.id)
    } else if (profile?.user_type === 'driver') {
      query = query.eq('driver_id', user.id)
    }
    // Admin can see all rides (no additional filter needed)

    // Apply optional filters from query params
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    const limit = searchParams.get('limit')
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false })

    const { data: rides, error } = await query

    if (error) {
      console.error('Error fetching rides:', error)
      return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
    }

    return NextResponse.json({ rides })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rides - Create new ride request
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a passenger
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'passenger') {
      return NextResponse.json({ error: 'Only passengers can request rides' }, { status: 403 })
    }

    const body = await request.json()
    const {
      pickup_address,
      pickup_location,
      dropoff_address,
      dropoff_location,
      distance_km,
      estimated_duration_min,
      fare_estimate,
      passenger_notes
    } = body

    // Validate required fields
    if (!pickup_address || !pickup_location || !dropoff_address || !dropoff_location) {
      return NextResponse.json({ error: 'Missing required location data' }, { status: 400 })
    }

    // Create new ride request
    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        passenger_id: user.id,
        status: 'requested',
        pickup_address,
        pickup_location: `POINT(${pickup_location.lng} ${pickup_location.lat})`,
        dropoff_address,
        dropoff_location: `POINT(${dropoff_location.lng} ${dropoff_location.lat})`,
        distance_km,
        estimated_duration_min,
        fare_estimate,
        surge_multiplier: 1.0, // Default surge
        passenger_notes,
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ride:', error)
      return NextResponse.json({ error: 'Failed to create ride request' }, { status: 500 })
    }

    return NextResponse.json({ ride }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}