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

    // Fetch customer addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('customer_addresses')
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
        is_default,
        created_at,
        updated_at
      `)
      .eq('user_id', profile.id)
      .order('is_default', { ascending: false })
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressesError) {
      console.error('Addresses fetch error:', addressesError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to fetch addresses', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // Get usage statistics for each address
    const addressIds = addresses?.map(a => a.id) || []
    let addressStats: Record<string, { last_used: string; booking_count: number }> = {}

    if (addressIds.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from('bookings')
        .select(`
          address_id,
          scheduled_date,
          created_at
        `)
        .in('address_id', addressIds)
        .eq('customer_id', profile.id)
        .order('scheduled_date', { ascending: false })

      if (!statsError && stats) {
        // Calculate usage statistics
        addressStats = stats.reduce((acc, booking) => {
          const addressId = booking.address_id
          if (!acc[addressId]) {
            acc[addressId] = {
              last_used: booking.scheduled_date,
              booking_count: 0
            }
          }
          acc[addressId].booking_count += 1
          // Keep the most recent date
          if (booking.scheduled_date > acc[addressId].last_used) {
            acc[addressId].last_used = booking.scheduled_date
          }
          return acc
        }, {} as Record<string, { last_used: string; booking_count: number }>)
      }
    }

    // Transform the data for frontend consumption
    const transformedAddresses = addresses?.map(address => ({
      id: address.id,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      city: address.city,
      county: address.county,
      postal_code: address.postal_code,
      country: address.country,
      distance_from_business: address.distance_from_business,
      is_primary: address.is_primary,
      is_default: address.is_default,
      last_used: addressStats[address.id]?.last_used || null,
      booking_count: addressStats[address.id]?.booking_count || 0,
      created_at: address.created_at,
      updated_at: address.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedAddresses
    })

  } catch (error) {
    console.error('Customer addresses API error:', error)
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

    const addressData = await request.json()

    // Validate required fields
    if (!addressData.address_line_1 || !addressData.city || !addressData.postal_code) {
      return NextResponse.json({
        success: false,
        error: { message: 'Missing required fields: address_line_1, city, postal_code', code: 'VALIDATION_ERROR' }
      }, { status: 400 })
    }

    // Calculate distance from business using postcode lookup
    let distanceFromBusiness = null
    if (addressData.postal_code) {
      try {
        const distanceResponse = await fetch(`${request.nextUrl.origin}/api/pricing/distance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postcode: addressData.postal_code })
        })
        
        if (distanceResponse.ok) {
          const distanceResult = await distanceResponse.json()
          if (distanceResult.success && distanceResult.data?.distance !== undefined) {
            distanceFromBusiness = distanceResult.data.distance
          }
        }
      } catch (distanceError) {
        console.error('Distance calculation failed:', distanceError)
        // Continue without distance - it's not critical for address creation
      }
    }

    // Check if this is the user's first address (make it default)
    const { data: existingAddresses, error: countError } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('user_id', profile.id)

    if (countError) {
      console.error('Count addresses error:', countError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to check existing addresses', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    const isFirstAddress = !existingAddresses || existingAddresses.length === 0

    // Insert new address
    const { data: newAddress, error: insertError } = await supabase
      .from('customer_addresses')
      .insert({
        user_id: profile.id,
        address_line_1: addressData.address_line_1.trim(),
        address_line_2: addressData.address_line_2?.trim() || null,
        city: addressData.city.trim(),
        county: addressData.county?.trim() || null,
        postal_code: addressData.postal_code.trim().toUpperCase(),
        country: addressData.country?.trim() || 'United Kingdom',
        distance_from_business: distanceFromBusiness,
        is_primary: isFirstAddress,
        is_default: isFirstAddress || addressData.set_as_default === true,
      })
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

    if (insertError) {
      console.error('Address insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: { message: 'Failed to create address', code: 'DATABASE_ERROR' }
      }, { status: 500 })
    }

    // If setting as default, unset other defaults
    if (addressData.set_as_default === true && !isFirstAddress) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', profile.id)
        .neq('id', newAddress.id)
    }

    // Transform the response
    const transformedAddress = {
      id: newAddress.id,
      address_line_1: newAddress.address_line_1,
      address_line_2: newAddress.address_line_2,
      city: newAddress.city,
      county: newAddress.county,
      postal_code: newAddress.postal_code,
      country: newAddress.country,
      distance_from_business: newAddress.distance_from_business,
      is_primary: newAddress.is_primary,
      is_default: newAddress.is_default,
      last_used: null,
      booking_count: 0
    }

    return NextResponse.json({
      success: true,
      data: transformedAddress
    })

  } catch (error) {
    console.error('Create address API error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Internal server error', code: 'SERVER_ERROR' }
    }, { status: 500 })
  }
}