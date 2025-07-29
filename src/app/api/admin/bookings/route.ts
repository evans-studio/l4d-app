import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    // Use the new authentication handler with session refresh
    const authResult = await authenticateAdmin(request)
    
    if (!authResult.success) {
      return authResult.error
    }
    
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const dateFilter = searchParams.get('date')
    const sortBy = searchParams.get('sort') || 'created_at'

    // Build query with proper table joins instead of JSON fields
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        status,
        total_price,
        base_price,
        vehicle_size_multiplier,
        distance_surcharge,
        distance_km,
        pricing_breakdown,
        special_instructions,
        admin_notes,
        created_at,
        updated_at,
        confirmed_at,
        confirmation_sent_at,
        customer_id,
        user_profiles!bookings_customer_id_fkey(
          email,
          first_name,
          last_name,
          phone
        ),
        customer_vehicles!vehicle_id(
          make,
          model,
          year,
          color,
          license_plate,
          vehicle_sizes!vehicle_size_id(
            name,
            price_multiplier
          )
        ),
        customer_addresses!address_id(
          address_line_1,
          address_line_2,
          city,
          postal_code,
          county,
          country,
          distance_from_business
        ),
        services!service_id(
          name,
          short_description,
          service_categories!category_id(
            name
          )
        ),
        booking_services!booking_id(
          id,
          service_details,
          price,
          estimated_duration
        )
      `)

    // Apply date filter if provided
    if (dateFilter) {
      query = query.eq('scheduled_date', dateFilter)
    }

    // Apply sorting
    if (sortBy === 'time') {
      query = query.order('scheduled_date', { ascending: true })
                   .order('scheduled_start_time', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: bookings, error: bookingsError } = await query

    if (bookingsError) {
      console.error('Admin bookings error:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch bookings')
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Customer data is now included via database join

    // Transform the data for frontend consumption with proper relationships
    const adminBookings = bookings.map((booking: any) => {
      const customer = booking.user_profiles || { first_name: null, last_name: null, email: null, phone: null }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Service information from main service and booking services
      const mainService = booking.services || null
      const serviceDetails = booking.booking_services?.map((service: any) => ({
        name: service.service_details?.name || mainService?.name || 'Service',
        base_price: service.price || 0,
        estimated_duration: service.estimated_duration || 0
      })) || [{ 
        name: mainService?.name || 'Vehicle Detailing Service', 
        base_price: booking.total_price || 0,
        estimated_duration: 0
      }]

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customerName,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        scheduled_date: booking.scheduled_date,
        scheduled_start_time: booking.scheduled_start_time,
        scheduled_end_time: booking.scheduled_end_time,
        status: booking.status,
        total_price: booking.total_price || 0,
        base_price: booking.base_price,
        vehicle_size_multiplier: booking.vehicle_size_multiplier,
        distance_surcharge: booking.distance_surcharge,
        distance_km: booking.distance_km,
        pricing_breakdown: booking.pricing_breakdown,
        special_instructions: booking.special_instructions,
        admin_notes: booking.admin_notes,
        confirmed_at: booking.confirmed_at,
        confirmation_sent_at: booking.confirmation_sent_at,
        
        // Main service info
        service: mainService ? {
          name: mainService.name,
          short_description: mainService.short_description,
          category: mainService.service_categories?.[0]?.name || 'General'
        } : null,
        
        // Detailed service breakdown
        services: serviceDetails,
        
        // Vehicle information with size details
        vehicle: booking.customer_vehicles?.[0] ? {
          make: booking.customer_vehicles[0].make,
          model: booking.customer_vehicles[0].model,
          year: booking.customer_vehicles[0].year,
          color: booking.customer_vehicles[0].color,
          license_plate: booking.customer_vehicles[0].license_plate,
          vehicle_size: {
            name: booking.customer_vehicles[0].vehicle_sizes?.[0]?.name || 'Unknown',
            price_multiplier: booking.customer_vehicles[0].vehicle_sizes?.[0]?.price_multiplier || 1
          }
        } : null,
        
        // Address information with distance
        address: booking.customer_addresses?.[0] ? {
          address_line_1: booking.customer_addresses[0].address_line_1,
          address_line_2: booking.customer_addresses[0].address_line_2,
          city: booking.customer_addresses[0].city,
          postal_code: booking.customer_addresses[0].postal_code,
          county: booking.customer_addresses[0].county,
          country: booking.customer_addresses[0].country,
          distance_from_business: booking.customer_addresses[0].distance_from_business
        } : null,
        
        created_at: booking.created_at,
        updated_at: booking.updated_at
      }
    })

    return ApiResponseHandler.success(adminBookings)

  } catch (error) {
    console.error('Admin bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}