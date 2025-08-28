import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { getVehicleSize, getSizeInfo } from '@/lib/utils/vehicle-size'
import { logger } from '@/lib/utils/logger'

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
      .single()

    if (vehicleError || !existingVehicle) {
      return NextResponse.json({
        success: false,
        error: { message: 'Vehicle not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Prepare update object
    const updateObject: Record<string, unknown> = {}
    
    if (updateData.make) updateObject.make = updateData.make.trim()
    if (updateData.model) updateObject.model = updateData.model.trim()
    if (updateData.year) updateObject.year = parseInt(updateData.year)
    if (updateData.color) updateObject.color = updateData.color.trim()
    // Normalize plate fields and keep both columns in sync
    if (updateData.license_plate !== undefined || updateData.registration !== undefined) {
      const normalizedPlate: string | null = (updateData.registration?.trim() || updateData.license_plate?.trim() || null)
      updateObject.license_plate = normalizedPlate
      updateObject.registration = normalizedPlate
    }

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
        registration,
        is_primary,
        is_default
      `)
      .single()

    if (updateError) {
      logger.error('Vehicle update error', updateError instanceof Error ? updateError : undefined)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to update vehicle', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Handle setting as default vehicle
    if (updateData.set_as_default === true) {
      // First, unset all other default vehicles for this user
      const { error: unsetError } = await supabase
        .from('customer_vehicles')
        .update({ is_default: false })
        .eq('user_id', profile.id)
        .neq('id', vehicleId)

      if (unsetError) {
        logger.error('Failed to unset other default vehicles', unsetError instanceof Error ? unsetError : undefined)
        // Continue anyway, this is not critical
      }

      // Then set this vehicle as default
      const { error: setDefaultError } = await supabase
        .from('customer_vehicles')
        .update({ is_default: true })
        .eq('id', vehicleId)
        .eq('user_id', profile.id)

      if (setDefaultError) {
        logger.error('Failed to set vehicle as default', setDefaultError instanceof Error ? setDefaultError : undefined)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to set vehicle as default', code: 'DATABASE_ERROR' }
        }, { status: 500 })
      }

      // Update the response data to reflect the change
      ;(updatedVehicle as { is_default: boolean }).is_default = true
    }

    // Transform the response with computed size information
    const detectedSize = await getVehicleSize(updatedVehicle.make, updatedVehicle.model)
    const sizeInfo = getSizeInfo(detectedSize)
    
    const transformedVehicle = {
      id: updatedVehicle.id,
      make: updatedVehicle.make,
      model: updatedVehicle.model,
      year: updatedVehicle.year,
      color: updatedVehicle.color,
      license_plate: updatedVehicle.license_plate,
      registration: updatedVehicle.registration,
      is_primary: updatedVehicle.is_primary,
      is_default: updatedVehicle.is_default,
      // Add computed size information
      vehicle_size: {
        size: detectedSize,
        label: sizeInfo.label,
        multiplier: sizeInfo.multiplier,
        examples: sizeInfo.examples
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedVehicle
    })

  } catch (error) {
    logger.error('Update vehicle API error', error instanceof Error ? error : undefined)
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
      .single()

    if (vehicleError || !existingVehicle) {
      return NextResponse.json({
        success: false,
        error: { message: 'Vehicle not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Check if this is the only vehicle for the user
    const { data: allVehicles, error: allVehiclesError } = await supabase
      .from('customer_vehicles')
      .select('id')
      .eq('user_id', profile.id)

    if (allVehiclesError) {
      logger.error('Error checking vehicle count:', allVehiclesError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check vehicle count', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    const vehicleCount = allVehicles?.length || 0

    // Allow deletion of default vehicle if it's the only vehicle
    // Prevent deletion of default vehicle if user has multiple vehicles
    if (existingVehicle.is_default && vehicleCount > 1) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Cannot delete default vehicle. Please set another vehicle as default first.', 
          code: 'CANNOT_DELETE_DEFAULT' 
        }
      }, { status: 400 })
    }

    // Check if vehicle is used in any bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .limit(1)

    if (bookingsError) {
      logger.error('Bookings check error:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check vehicle usage', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Prevent deletion if vehicle has been used in any bookings
    if (bookings && bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Cannot delete vehicle that has been used in bookings. Vehicle data is required for booking history.', 
          code: 'VEHICLE_HAS_BOOKINGS' 
        }
      }, { status: 400 })
    }

    // Hard delete - no is_active column exists for soft delete
    const { error: deleteError } = await supabase
      .from('customer_vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', profile.id)

    if (deleteError) {
      logger.error('Vehicle delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to delete vehicle', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { id: vehicleId, deleted: true }
    })

  } catch (error) {
    logger.error('Delete vehicle API error', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}