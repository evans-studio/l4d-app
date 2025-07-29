import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      }, { status: 401 })
    }

    // Get user profile to get the actual customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    // Fetch customer vehicles with vehicle size information
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('customer_vehicles')
      .select(`
        id,
        make,
        model,
        year,
        color,
        license_plate,
        is_primary,
        is_default,
        created_at,
        updated_at,
        vehicle_sizes!vehicle_size_id (
          id,
          size,
          multiplier,
          name,
          description
        )
      `)
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (vehiclesError) {
      console.error('Vehicles fetch error:', vehiclesError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch vehicles', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Get usage statistics for each vehicle
    const vehicleIds = vehicles?.map(v => v.id) || []
    let vehicleStats: Record<string, { last_used: string; booking_count: number }> = {}

    if (vehicleIds.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from('bookings')
        .select(`
          vehicle_id,
          scheduled_date,
          created_at
        `)
        .in('vehicle_id', vehicleIds)
        .eq('customer_id', profile.id)
        .order('scheduled_date', { ascending: false })

      if (!statsError && stats) {
        // Calculate usage statistics
        vehicleStats = stats.reduce((acc, booking) => {
          const vehicleId = booking.vehicle_id
          if (!acc[vehicleId]) {
            acc[vehicleId] = {
              last_used: booking.scheduled_date,
              booking_count: 0
            }
          }
          acc[vehicleId].booking_count += 1
          // Keep the most recent date
          if (booking.scheduled_date > acc[vehicleId].last_used) {
            acc[vehicleId].last_used = booking.scheduled_date
          }
          return acc
        }, {} as Record<string, { last_used: string; booking_count: number }>)
      }
    }

    // Transform the data for frontend consumption
    const transformedVehicles = vehicles?.map(vehicle => {
      const vehicleSize = Array.isArray(vehicle.vehicle_sizes) 
        ? vehicle.vehicle_sizes[0] 
        : vehicle.vehicle_sizes

      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        license_plate: vehicle.license_plate,
        vehicle_size: {
          id: vehicleSize?.id,
          size: vehicleSize?.size || 'M',
          multiplier: vehicleSize?.multiplier || 1.3,
          name: vehicleSize?.name || 'Medium',
          description: vehicleSize?.description || ''
        },
        is_primary: vehicle.is_primary,
        is_default: vehicle.is_default,
        last_used: vehicleStats[vehicle.id]?.last_used || null,
        booking_count: vehicleStats[vehicle.id]?.booking_count || 0,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedVehicles
    })

  } catch (error) {
    console.error('Customer vehicles API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.is_active === false) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    const vehicleData = await request.json()

    // Validate required fields
    if (!vehicleData.make || !vehicleData.model || !vehicleData.year || !vehicleData.color || !vehicleData.vehicle_size_id) {
      return NextResponse.json({
        success: false,
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
      }, { status: 400 })
    }

    // Check if this is the user's first vehicle (make it default)
    const { data: existingVehicles, error: countError } = await supabase
      .from('customer_vehicles')
      .select('id')
      .eq('user_id', profile.id)
      .eq('is_active', true)

    if (countError) {
      console.error('Count vehicles error:', countError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check existing vehicles', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    const isFirstVehicle = !existingVehicles || existingVehicles.length === 0

    // Insert new vehicle
    const { data: newVehicle, error: insertError } = await supabase
      .from('customer_vehicles')
      .insert({
        user_id: profile.id,
        make: vehicleData.make.trim(),
        model: vehicleData.model.trim(),
        year: parseInt(vehicleData.year),
        color: vehicleData.color.trim(),
        license_plate: vehicleData.license_plate?.trim() || null,
        vehicle_size_id: vehicleData.vehicle_size_id,
        is_primary: isFirstVehicle,
        is_default: isFirstVehicle || vehicleData.set_as_default === true,
      })
      .select(`
        id,
        make,
        model,
        year,
        color,
        license_plate,
        is_primary,
        is_default,
        vehicle_sizes!vehicle_size_id (
          id,
          size,
          multiplier,
          name,
          description
        )
      `)
      .single()

    if (insertError) {
      console.error('Vehicle insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to create vehicle', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // If setting as default, unset other defaults
    if (vehicleData.set_as_default === true && !isFirstVehicle) {
      await supabase
        .from('customer_vehicles')
        .update({ is_default: false })
        .eq('user_id', profile.id)
        .neq('id', newVehicle.id)
        .eq('is_active', true)
    }

    // Transform the response
    const vehicleSize = Array.isArray(newVehicle.vehicle_sizes) 
      ? newVehicle.vehicle_sizes[0] 
      : newVehicle.vehicle_sizes

    const transformedVehicle = {
      id: newVehicle.id,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      color: newVehicle.color,
      license_plate: newVehicle.license_plate,
      vehicle_size: {
        id: vehicleSize?.id,
        size: vehicleSize?.size || 'M',
        multiplier: vehicleSize?.multiplier || 1.3,
        name: vehicleSize?.name || 'Medium',
        description: vehicleSize?.description || ''
      },
      is_primary: newVehicle.is_primary,
      is_default: newVehicle.is_default,
      last_used: null,
      booking_count: 0
    }

    return NextResponse.json({
      success: true,
      data: transformedVehicle
    })

  } catch (error) {
    console.error('Create vehicle API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}