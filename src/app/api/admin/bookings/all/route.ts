import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { paypalService } from '@/lib/services/paypal'

export async function GET(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    
    // Use admin client for database queries
    const supabase = supabaseAdmin

    // Get all bookings with optimized query using joins and embedded data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        customer_id,
        scheduled_date,
        scheduled_start_time,
        status,
        payment_status,
        total_price,
        special_instructions,
        vehicle_details,
        service_address,
        pricing_breakdown,
        created_at,
        payment_deadline,
        booking_services (
          id,
          service_details,
          price,
          service_id
        )
      `)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('All bookings error:', bookingsError)
      return ApiResponseHandler.serverError(`Failed to fetch bookings: ${bookingsError.message}`)
    }

    if (!bookings || bookings.length === 0) {
      return ApiResponseHandler.success([])
    }

    // Get unique customer IDs and fetch user profiles separately
    const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))] as string[]
    let customerProfiles: any[] = []
    
    if (customerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds)
      
      if (profilesError) {
        console.error('Error fetching customer profiles:', profilesError)
      } else {
        customerProfiles = profiles || []
      }
    }

    // Reconciliation: find any approved reschedule requests for these bookings
    const bookingIds = bookings.map((b: any) => b.id)
    let approvedReschedules: Record<string, { requested_date: string, requested_time: string, responded_at: string }> = {}
    if (bookingIds.length > 0) {
      const { data: resReqs } = await supabase
        .from('booking_reschedule_requests')
        .select('booking_id, requested_date, requested_time, responded_at, status')
        .in('booking_id', bookingIds)
        .eq('status', 'approved')
        .order('responded_at', { ascending: false })
      if (resReqs) {
        for (const r of resReqs) {
          if (!approvedReschedules[r.booking_id]) {
            approvedReschedules[r.booking_id] = {
              requested_date: r.requested_date as unknown as string,
              requested_time: r.requested_time as unknown as string,
              responded_at: r.responded_at as unknown as string
            }
          }
        }
      }
    }

    // Transform the data for the frontend using embedded JSON and separate profile data
    const allBookings = bookings.map((booking: any) => {
      // Get customer info from separate profile data
      const customer = customerProfiles.find(p => p.id === booking.customer_id) || { first_name: '', last_name: '', email: '', phone: '' }
      const customerName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(' ') || 'Customer'
      
      // Get vehicle info from embedded JSON
      const vehicle = booking.vehicle_details || { make: 'Unknown', model: 'Vehicle', year: null, color: '' }
      
      // Get address info from embedded JSON
      const address = booking.service_address || { address_line_1: '', city: 'Unknown', postal_code: '' }
      
      // Get services from booking_services using service_details JSON
      const services = booking.booking_services?.map((bs: any) => ({
        name: bs.service_details?.name || 'Vehicle Detailing Service',
        base_price: bs.price || 0
      })) || [{
        name: 'Vehicle Detailing Service',
        base_price: booking.total_price || 0
      }]
      
      // Generate PayPal payment information for processing/payment_failed bookings
      const paymentInfo = (['processing', 'payment_failed'].includes(booking.status)) 
        ? paypalService.generatePaymentInstructions(
            booking.total_price || 0, 
            booking.booking_reference,
            customerName
          )
        : null

      // If booking status still reads pending but we have an approved reschedule recorded,
      // reflect it as rescheduled to avoid stale UI when approval and list read race.
      const approved = approvedReschedules[booking.id]
      const effectiveStatus = approved && booking.status === 'pending' ? 'rescheduled' : booking.status
      const effectiveDate = approved && booking.status === 'pending' ? approved.requested_date : booking.scheduled_date
      const effectiveStart = approved && booking.status === 'pending' ? approved.requested_time : booking.scheduled_start_time

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        customer_id: booking.customer_id,
        customer_name: customerName,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        scheduled_date: effectiveDate,
        start_time: effectiveStart,
        status: effectiveStatus,
        payment_status: booking.payment_status || 'pending',
        total_price: booking.total_price || 0,
        special_instructions: booking.special_instructions,
        services: services,
        vehicle: {
          make: vehicle.make || 'Unknown',
          model: vehicle.model || 'Vehicle',
          year: vehicle.year,
          color: vehicle.color
        },
        address: {
          address_line_1: address.address_line_1 || '',
          city: address.city || 'Unknown',
          postal_code: address.postal_code || ''
        },
        created_at: booking.created_at,
        payment_link: paymentInfo?.paymentLink,
        payment_deadline: booking.payment_deadline || paymentInfo?.deadline || (booking.created_at ? 
          new Date(new Date(booking.created_at).getTime() + 48 * 60 * 60 * 1000).toISOString() : 
          null)
      }
    })

    return ApiResponseHandler.success(allBookings)

  } catch (error) {
    console.error('All bookings error:', error)
    return ApiResponseHandler.serverError('Failed to fetch bookings')
  }
}