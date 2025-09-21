import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get total drivers count
    const { count: totalDrivers } = await supabase
      .from('driver_profiles')
      .select('*', { count: 'exact', head: true })

    // Get total rides count
    const { count: totalRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })

    // Get completed rides for revenue calculation
    const { data: completedRides } = await supabase
      .from('rides')
      .select('fare')
      .eq('status', 'completed')

    // Calculate total revenue
    const totalRevenue = completedRides?.reduce((sum, ride) => sum + parseFloat(ride.fare), 0) || 0

    // Get average rating from driver profiles
    const { data: driverRatings } = await supabase
      .from('driver_profiles')
      .select('rating')
      .not('rating', 'is', null)

    const avgRating = driverRatings && driverRatings.length > 0 
      ? driverRatings.reduce((sum, driver) => sum + driver.rating, 0) / driverRatings.length 
      : 0

    // Get today's statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: todayRides } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    const { data: todayCompletedRides } = await supabase
      .from('rides')
      .select('fare')
      .eq('status', 'completed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    const todayRevenue = todayCompletedRides?.reduce((sum, ride) => sum + parseFloat(ride.fare), 0) || 0

    // Get recent rides for activity
    const { data: recentRides } = await supabase
      .from('rides')
      .select(`
        id,
        fare,
        status,
        created_at,
        pickup_location,
        dropoff_location,
        passenger:profiles!rides_passenger_id_fkey(full_name),
        driver:profiles!rides_driver_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent reviews
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name),
        reviewee:profiles!reviews_reviewee_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const stats = {
      overview: {
        totalUsers: totalUsers || 0,
        totalDrivers: totalDrivers || 0,
        totalRides: totalRides || 0,
        totalRevenue: totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      today: {
        rides: todayRides || 0,
        revenue: todayRevenue,
      },
      recentActivity: {
        rides: recentRides?.map(ride => {
          const passenger = Array.isArray(ride.passenger) ? ride.passenger[0] : ride.passenger;
          const driver = Array.isArray(ride.driver) ? ride.driver[0] : ride.driver;
          
          return {
            id: ride.id,
            amount: parseFloat(ride.fare),
            status: ride.status,
            passenger: passenger?.full_name || 'Unknown',
            driver: driver?.full_name || 'Unknown',
            from: ride.pickup_location,
            to: ride.dropoff_location,
            time: new Date(ride.created_at).toLocaleString(),
          };
        }) || [],
        reviews: recentReviews?.map(review => {
          const reviewer = Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer;
          const reviewee = Array.isArray(review.reviewee) ? review.reviewee[0] : review.reviewee;
          
          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            reviewer: reviewer?.full_name || 'Anonymous',
            reviewee: reviewee?.full_name || 'Unknown',
            time: new Date(review.created_at).toLocaleString(),
          };
        }) || [],
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}