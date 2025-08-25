import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }
    
    const supabase = supabaseAdmin

    // Get all reschedule requests first (avoiding joins to prevent PGRST200 errors)
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
        responded_at
      `)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching reschedule requests:', requestsError)
      return ApiResponseHandler.serverError('Failed to fetch reschedule requests')
    }

    // Fetch related booking and customer data separately to avoid join issues
    const transformedRequests = []
    
    if (rescheduleRequests && rescheduleRequests.length > 0) {
      // Get all booking IDs
      const bookingIds = rescheduleRequests.map(req => req.booking_id)
      
      // Fetch booking details separately
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference, status, customer_id, total_price')
        .in('id', bookingIds)
      
      // Get all customer IDs from bookings
      const customerIds = bookings?.map(booking => booking.customer_id).filter(Boolean) || []
      
      // Fetch customer details separately
      const { data: customers } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', customerIds)
      
      // Transform the data
      for (const request of rescheduleRequests) {
        const booking = bookings?.find(b => b.id === request.booking_id)
        const customer = customers?.find(c => c.id === booking?.customer_id)
        
        transformedRequests.push({
          id: request.id,
          booking_id: request.booking_id,
          booking_reference: booking?.booking_reference || 'Unknown',
          customer_name: customer 
            ? `${customer.first_name} ${customer.last_name}`
            : 'Unknown Customer',
          customer_email: customer?.email || '',
          customer_phone: customer?.phone || '',
          booking_status: booking?.status || 'unknown',
          total_price: booking?.total_price || 0,
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
        })
      }
    }

    return ApiResponseHandler.success({
      reschedule_requests: transformedRequests,
      total_count: transformedRequests.length,
      pending_count: transformedRequests.filter(r => r.status === 'pending').length,
      approved_count: transformedRequests.filter(r => r.status === 'approved').length,
      rejected_count: transformedRequests.filter(r => r.status === 'rejected').length
    })

  } catch (error) {
    console.error('Get reschedule requests error:', error) 
    return ApiResponseHandler.serverError('Failed to fetch reschedule requests')
  }
}