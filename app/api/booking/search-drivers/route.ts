import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/booking/search-drivers - Search for available drivers for a ride request
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
      return NextResponse.json({ error: 'Only passengers can search for drivers' }, { status: 403 })
    }

    const body = await request.json()
    const { pickup_location, radius = 10 } = body

    if (!pickup_location || !pickup_location.lat || !pickup_location.lng) {
      return NextResponse.json({ error: 'Pickup location is required' }, { status: 400 })
    }

    // Find available drivers within radius using PostGIS
    const { data: drivers, error } = await supabase
      .from('driver_profiles')
      .select(`
        user_id,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        rating,
        total_rides,
        current_location,
        profiles!driver_profiles_user_id_fkey(full_name, avatar_url)
      `)
      .eq('is_available', true)
      .eq('documents_verified', true)
      .not('current_location', 'is', null)
      .limit(10)

    if (error) {
      console.error('Error fetching drivers:', error)
      return NextResponse.json({ error: 'Failed to search drivers' }, { status: 500 })
    }

    // Filter drivers by distance and calculate ETA
    const availableDrivers = drivers
      ?.map(driver => {
        if (!driver.current_location) return null

        try {
          // Parse PostGIS POINT format
          const locationStr = driver.current_location.replace('POINT(', '').replace(')', '')
          const [driverLng, driverLat] = locationStr.split(' ').map(Number)
          
          const distance = calculateDistance(
            pickup_location.lat, pickup_location.lng,
            driverLat, driverLng
          )
          
          // Only include drivers within radius
          if (distance > radius) return null

          // Calculate estimated arrival time (assuming 30 km/h average speed in city)
          const estimatedArrivalMinutes = Math.ceil(distance / 30 * 60)

          const profile = Array.isArray(driver.profiles) ? driver.profiles[0] : driver.profiles;
          
          return {
            id: driver.user_id,
            name: profile?.full_name || 'Unknown Driver',
            avatar_url: profile?.avatar_url || '',
            rating: driver.rating,
            total_rides: driver.total_rides,
            vehicle: {
              make: driver.vehicle_make,
              model: driver.vehicle_model,
              year: driver.vehicle_year,
              color: driver.vehicle_color,
            },
            location: {
              lat: driverLat,
              lng: driverLng
            },
            heading: null, // Will be added later when tracking is implemented
            distance_km: Math.round(distance * 100) / 100,
            estimated_arrival_minutes: estimatedArrivalMinutes,
            last_location_update: new Date().toISOString() // Current timestamp for now
          }
        } catch {
          return null
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => a!.distance_km - b!.distance_km) // Sort by closest first

    return NextResponse.json({ 
      drivers: availableDrivers,
      search_location: pickup_location,
      radius_km: radius,
      total_found: availableDrivers?.length || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}