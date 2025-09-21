import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/drivers - Get available drivers or driver search
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is a search for available drivers near a location
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '10' // Default 10km radius

    if (lat && lng) {
      // Search for available drivers near pickup location
      const { data: drivers, error } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          user:profiles!driver_profiles_user_id_fkey(full_name, phone, avatar_url)
        `)
        .eq('status', 'online')
        .eq('is_available', true)
        .not('current_location', 'is', null)

      if (error) {
        console.error('Error fetching drivers:', error)
        return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
      }

      // Filter drivers by distance (simplified - in production use PostGIS ST_DWithin)
      const nearbyDrivers = drivers?.filter(driver => {
        if (!driver.current_location) return false
        
        // Parse location from PostGIS point format
        // This is a simplified distance calculation - use proper geospatial functions in production
        try {
          const locationStr = driver.current_location.replace('POINT(', '').replace(')', '')
          const [driverLng, driverLat] = locationStr.split(' ').map(Number)
          
          const distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            driverLat, driverLng
          )
          
          return distance <= parseFloat(radius)
        } catch {
          return false
        }
      }) || []

      return NextResponse.json({ drivers: nearbyDrivers })
    }

    // Default: Get all drivers (admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: drivers, error } = await supabase
      .from('driver_profiles')
      .select(`
        *,
        user:profiles!driver_profiles_user_id_fkey(full_name, phone, avatar_url, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching drivers:', error)
      return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
    }

    return NextResponse.json({ drivers })
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