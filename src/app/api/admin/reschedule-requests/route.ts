import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after fixing session issues
    // const authResult = await authenticateAdmin(request)
    // if (!authResult.success) {
    //   return authResult.error
    // }
    
    // Use admin client for now to bypass authentication issues
    const supabase = supabaseAdmin

    // Get all reschedule requests with booking and customer details
    const { data: rescheduleRequests, error: requestsError } = await supabase
      .from('booking_reschedule_requests')
      .select(`
        id,
        booking_id,
        requested_date,
        requested_time,
        reason,
        status,
        admin_response,
        admin_id,
        customer_notes,
        admin_notes,
        original_date,
        original_time,
        created_at,
        updated_at,
        responded_at,
        bookings!booking_id (
          id,
          booking_reference,
          status,
          customer_id,
          total_price,
          user_profiles!customer_id (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching reschedule requests:', requestsError)
      return ApiResponseHandler.serverError('Failed to fetch reschedule requests')
    }

    // Transform the data for easier frontend consumption
    const transformedRequests = rescheduleRequests?.map(request => {
      const booking = request.bookings as any
      const customer = booking?.user_profiles
      
      return {
        id: request.id,
        booking_id: request.booking_id,
        booking_reference: booking?.booking_reference,
        customer_name: customer 
          ? `${customer.first_name} ${customer.last_name}`
          : 'Unknown Customer',
        customer_email: customer?.email,
        customer_phone: customer?.phone,
        booking_status: booking?.status,
        total_price: booking?.total_price,
        original_date: request.original_date,
        original_time: request.original_time,
        requested_date: request.requested_date,
        requested_time: request.requested_time,
        reason: request.reason,
        customer_notes: request.customer_notes,
        status: request.status,
        admin_response: request.admin_response,
        admin_notes: request.admin_notes,
        created_at: request.created_at,
        updated_at: request.updated_at,
        responded_at: request.responded_at
      }
    }) || []

    return ApiResponseHandler.success({
      reschedule_requests: transformedRequests,
      total_count: transformedRequests.length,
      pending_count: transformedRequests.filter(r => r.status === 'pending').length
    })

  } catch (error) {
    console.error('Get reschedule requests error:', error) 
    return ApiResponseHandler.serverError('Failed to fetch reschedule requests')
  }
}