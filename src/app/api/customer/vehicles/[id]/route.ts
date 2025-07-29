import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const vehicleId = params.id
    const updateData = await request.json()

    // Verify vehicle ownership
    const { data: existingVehicle, error: vehicleError } = await supabase
      .from('customer_vehicles')
      .select('id, is_default')
      .eq('id', vehicleId)
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .single()

    if (vehicleError || !existingVehicle) {
      return NextResponse.json({
        success: false,
        error: { message: 'Vehicle not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Prepare update object
    const updateObject: any = {}
    
    if (updateData.make) updateObject.make = updateData.make.trim()
    if (updateData.model) updateObject.model = updateData.model.trim()
    if (updateData.year) updateObject.year = parseInt(updateData.year)
    if (updateData.color) updateObject.color = updateData.color.trim()
    if (updateData.license_plate !== undefined) updateObject.license_plate = updateData.license_plate?.trim() || null
    if (updateData.vehicle_size_id) updateObject.vehicle_size_id = updateData.vehicle_size_id

    // Update the vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('customer_vehicles')
      .update(updateObject)
      .eq('id', vehicleId)
      .eq('user_id', profile.id)
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

    if (updateError) {
      console.error('Vehicle update error:', updateError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to update vehicle', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Transform the response
    const vehicleSize = Array.isArray(updatedVehicle.vehicle_sizes) 
      ? updatedVehicle.vehicle_sizes[0] 
      : updatedVehicle.vehicle_sizes

    const transformedVehicle = {
      id: updatedVehicle.id,
      make: updatedVehicle.make,
      model: updatedVehicle.model,
      year: updatedVehicle.year,
      color: updatedVehicle.color,
      license_plate: updatedVehicle.license_plate,
      vehicle_size: {
        id: vehicleSize?.id,
        size: vehicleSize?.size || 'M',
        multiplier: vehicleSize?.multiplier || 1.3,
        name: vehicleSize?.name || 'Medium',
        description: vehicleSize?.description || ''
      },
      is_primary: updatedVehicle.is_primary,
      is_default: updatedVehicle.is_default
    }

    return NextResponse.json({
      success: true,
      data: transformedVehicle
    })

  } catch (error) {
    console.error('Update vehicle API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const vehicleId = params.id

    // Verify vehicle ownership and check if it's default
    const { data: existingVehicle, error: vehicleError } = await supabase
      .from('customer_vehicles')
      .select('id, is_default, is_primary')
      .eq('id', vehicleId)
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .single()

    if (vehicleError || !existingVehicle) {
      return NextResponse.json({
        success: false,
        error: { message: 'Vehicle not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Prevent deletion of default vehicle
    if (existingVehicle.is_default) {
      return NextResponse.json({
        success: false,
        error: { message: 'Cannot delete default vehicle', code: 'CANNOT_DELETE_DEFAULT' }
      }, { status: 400 })
    }

    // Check if vehicle is used in any bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .limit(1)

    if (bookingsError) {
      console.error('Bookings check error:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check vehicle usage', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // If vehicle has bookings, soft delete
    if (bookings && bookings.length > 0) {
      const { error: softDeleteError } = await supabase
        .from('customer_vehicles')
        .update({ is_active: false })
        .eq('id', vehicleId)
        .eq('user_id', profile.id)

      if (softDeleteError) {
        console.error('Vehicle soft delete error:', softDeleteError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to delete vehicle', code: 'DATABASE_ERROR' }
        }, { status: 500 })
      }
    } else {
      // Hard delete if no bookings
      const { error: deleteError } = await supabase
        .from('customer_vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', profile.id)

      if (deleteError) {
        console.error('Vehicle delete error:', deleteError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to delete vehicle', code: 'DATABASE_ERROR' }
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: vehicleId, deleted: true }
    })

  } catch (error) {
    console.error('Delete vehicle API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}