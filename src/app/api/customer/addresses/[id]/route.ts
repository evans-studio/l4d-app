import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Service client for profile lookups (bypasses RLS)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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

    // Get user profile using service client to bypass RLS
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    const params = await context.params
    const addressId = params.id
    const updateData = await request.json()

    // Verify address ownership using service client
    const { data: existingAddress, error: addressError } = await supabaseService
      .from('customer_addresses')
      .select('id, is_default, postal_code')
      .eq('id', addressId)
      .eq('user_id', profile.id)
      .single()

    if (addressError || !existingAddress) {
      return NextResponse.json({
        success: false,
        error: { message: 'Address not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Prepare update object
    const updateObject: any = {}
    
    if (updateData.address_line_1) updateObject.address_line_1 = updateData.address_line_1.trim()
    if (updateData.address_line_2 !== undefined) updateObject.address_line_2 = updateData.address_line_2?.trim() || null
    if (updateData.city) updateObject.city = updateData.city.trim()
    if (updateData.county !== undefined) updateObject.county = updateData.county?.trim() || null
    if (updateData.postal_code) {
      updateObject.postal_code = updateData.postal_code.trim().toUpperCase()
      
      // Recalculate distance if postcode changed
      if (updateObject.postal_code !== existingAddress.postal_code) {
        try {
          const distanceResponse = await fetch(`${request.nextUrl.origin}/api/pricing/distance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postcode: updateObject.postal_code })
          })
          
          if (distanceResponse.ok) {
            const distanceResult = await distanceResponse.json()
            if (distanceResult.success && distanceResult.data?.distance !== undefined) {
              updateObject.distance_from_business = distanceResult.data.distance
            }
          }
        } catch (distanceError) {
          console.error('Distance calculation failed:', distanceError)
          // Continue without updating distance
        }
      }
    }
    if (updateData.country !== undefined) updateObject.country = updateData.country?.trim() || 'United Kingdom'

    // Update the address using service client
    const { data: updatedAddress, error: updateError } = await supabaseService
      .from('customer_addresses')
      .update(updateObject)
      .eq('id', addressId)
      .eq('user_id', profile.id)
      .select(`
        id,
        address_line_1,
        address_line_2,
        city,
        county,
        postal_code,
        country,
        distance_from_business,
        is_primary,
        is_default
      `)
      .single()

    if (updateError) {
      console.error('Address update error:', updateError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to update address', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Handle setting as default address
    if (updateData.set_as_default === true) {
      // First, unset all other default addresses for this user
      const { error: unsetError } = await supabaseService
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', profile.id)
        .neq('id', addressId)

      if (unsetError) {
        console.error('Failed to unset other default addresses:', unsetError)
        // Continue anyway, this is not critical
      }

      // Then set this address as default
      const { error: setDefaultError } = await supabaseService
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', profile.id)

      if (setDefaultError) {
        console.error('Failed to set address as default:', setDefaultError)
        return NextResponse.json({
          success: false,
          error: { message: 'Failed to set address as default', code: 'DATABASE_ERROR' }
        }, { status: 500 })
      }

      // Update the response data to reflect the change
      updatedAddress.is_default = true
    }

    // Transform the response
    const transformedAddress = {
      id: updatedAddress.id,
      address_line_1: updatedAddress.address_line_1,
      address_line_2: updatedAddress.address_line_2,
      city: updatedAddress.city,
      county: updatedAddress.county,
      postal_code: updatedAddress.postal_code,
      country: updatedAddress.country,
      distance_from_business: updatedAddress.distance_from_business,
      is_primary: updatedAddress.is_primary,
      is_default: updatedAddress.is_default
    }

    return NextResponse.json({
      success: true,
      data: transformedAddress
    })

  } catch (error) {
    console.error('Update address API error:', error)
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

    // Get user profile using service client to bypass RLS
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: { message: 'User account not found or inactive', code: 'USER_INACTIVE' }
      }, { status: 401 })
    }

    const params = await context.params
    const addressId = params.id

    // Verify address ownership and check if it's default using service client
    const { data: existingAddress, error: addressError } = await supabaseService
      .from('customer_addresses')
      .select('id, is_default, is_primary')
      .eq('id', addressId)
      .eq('user_id', profile.id)
      .single()

    if (addressError || !existingAddress) {
      return NextResponse.json({
        success: false,
        error: { message: 'Address not found', code: 'NOT_FOUND' }
      }, { status: 404 })
    }

    // Check if this is the only address for the user
    const { data: allAddresses, error: allAddressesError } = await supabaseService
      .from('customer_addresses')
      .select('id')
      .eq('user_id', profile.id)

    if (allAddressesError) {
      console.error('Error checking address count:', allAddressesError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check address count', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    const addressCount = allAddresses?.length || 0

    // Allow deletion of default address if it's the only address
    // Prevent deletion of default address if user has multiple addresses
    if (existingAddress.is_default && addressCount > 1) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Cannot delete default address. Please set another address as default first.', 
          code: 'CANNOT_DELETE_DEFAULT' 
        }
      }, { status: 400 })
    }

    // Check if address is used in any bookings using service client
    const { data: bookings, error: bookingsError } = await supabaseService
      .from('bookings')
      .select('id')
      .eq('address_id', addressId)
      .limit(1)

    if (bookingsError) {
      console.error('Bookings check error:', bookingsError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check address usage', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // If address has bookings, we cannot delete it (referential integrity)
    if (bookings && bookings.length > 0) {
      return NextResponse.json({
        success: false,
        error: { 
          message: 'Cannot delete address that has been used in bookings. Address data is required for booking history.', 
          code: 'ADDRESS_HAS_BOOKINGS' 
        }
      }, { status: 400 })
    }

    // Delete the address (only if no bookings exist) using service client
    const { error: deleteError } = await supabaseService
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', profile.id)

    if (deleteError) {
      console.error('Address delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to delete address', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { id: addressId, deleted: true }
    })

  } catch (error) {
    console.error('Delete address API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}