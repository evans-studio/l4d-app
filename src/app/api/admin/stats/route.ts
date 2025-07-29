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

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Get booking stats
    const { data: bookingStats, error: bookingError } = await supabase
      .from('bookings')
      .select('status, total_price, created_at')

    if (bookingError) {
      console.error('Booking stats error:', bookingError)
      return ApiResponseHandler.serverError('Failed to fetch booking statistics')
    }

    // Calculate statistics
    const totalBookings = bookingStats?.length || 0
    const pendingBookings = bookingStats?.filter(b => b.status === 'pending').length || 0
    const confirmedBookings = bookingStats?.filter(b => b.status === 'confirmed').length || 0
    const completedBookings = bookingStats?.filter(b => b.status === 'completed').length || 0

    // Calculate revenue
    const completedBookingsList = bookingStats?.filter(b => b.status === 'completed') || []
    const totalRevenue = completedBookingsList.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
    
    const monthlyCompletedBookings = completedBookingsList.filter(b => 
      new Date(b.created_at) >= startOfMonth
    )
    const monthlyRevenue = monthlyCompletedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)

    // Get customer stats
    const { data: customerStats, error: customerError } = await supabase
      .from('user_profiles')
      .select('id, created_at')
      .eq('role', 'customer')

    if (customerError) {
      console.error('Customer stats error:', customerError)
      return ApiResponseHandler.serverError('Failed to fetch customer statistics')
    }

    const totalCustomers = customerStats?.length || 0
    
    // Active customers are those with at least one booking in the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: activeCustomerData, error: activeCustomerError } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('created_at', sixMonthsAgo.toISOString())
      .not('customer_id', 'is', null)

    if (activeCustomerError) {
      console.error('Active customer stats error:', activeCustomerError)
    }

    const uniqueActiveCustomers = new Set(activeCustomerData?.map(b => b.customer_id).filter(Boolean) || [])
    const activeCustomers = uniqueActiveCustomers.size

    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue,
      monthlyRevenue,
      totalCustomers,
      activeCustomers
    }

    return ApiResponseHandler.success(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return ApiResponseHandler.serverError('Failed to fetch admin statistics')
  }
}