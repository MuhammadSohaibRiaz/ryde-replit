import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rides/[id] - Get specific ride details
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

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Fetch ride with passenger and driver details
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger:profiles!rides_passenger_id_fkey(full_name, phone, avatar_url),
        driver:profiles!rides_driver_id_fkey(full_name, phone, avatar_url)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Check authorization - only passenger, driver, or admin can view
    const isAuthorized = 
      profile?.user_type === 'admin' ||
      ride.passenger_id === user.id ||
      ride.driver_id === user.id

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ ride })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/rides/[id] - Update ride status and details
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
    const { status, driver_notes, cancellation_reason } = body

    // Get current ride to check permissions
    const { data: currentRide, error: fetchError } = await supabase
      .from('rides')
      .select('passenger_id, driver_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Check if user can update this ride
    const canUpdate = 
      profile?.user_type === 'admin' ||
      currentRide.passenger_id === user.id ||
      currentRide.driver_id === user.id

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() }

    // Handle status changes with timestamps
    if (status && status !== currentRide.status) {
      updateData.status = status
      
      switch (status) {
        case 'assigned':
          updateData.assigned_at = new Date().toISOString()
          break
        case 'in_progress':
          updateData.pickup_at = new Date().toISOString()
          break
        case 'completed':
          updateData.dropoff_at = new Date().toISOString()
          break
        case 'canceled':
          updateData.canceled_at = new Date().toISOString()
          updateData.canceled_by = user.id
          if (cancellation_reason) {
            updateData.cancellation_reason = cancellation_reason
          }
          break
      }
    }

    // Add driver notes if provided (only drivers can add these)
    if (driver_notes && currentRide.driver_id === user.id) {
      updateData.driver_notes = driver_notes
    }

    // Update the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating ride:', updateError)
      return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 })
    }

    return NextResponse.json({ ride: updatedRide })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/rides/[id] - Cancel ride (soft delete by updating status)
export async function DELETE(
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

    // Get current ride to check permissions
    const { data: currentRide, error: fetchError } = await supabase
      .from('rides')
      .select('passenger_id, driver_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Check if ride can be cancelled
    if (['completed', 'canceled'].includes(currentRide.status)) {
      return NextResponse.json({ error: 'Cannot cancel completed or already canceled ride' }, { status: 400 })
    }

    // Check if user can cancel this ride
    const canCancel = 
      currentRide.passenger_id === user.id ||
      currentRide.driver_id === user.id

    if (!canCancel) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update ride to canceled status
    const { data: canceledRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error canceling ride:', updateError)
      return NextResponse.json({ error: 'Failed to cancel ride' }, { status: 500 })
    }

    return NextResponse.json({ ride: canceledRide })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}