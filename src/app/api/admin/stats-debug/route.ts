import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Admin Stats API called ===')
    
    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    console.log('Date ranges calculated')

    // Get booking stats using admin client (bypasses RLS)
    const { data: bookingStats, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('status, total_price, created_at')

    console.log('Booking stats query result:', {
      count: bookingStats?.length || 0,
      error: bookingError,
      sample: bookingStats?.slice(0, 2)
    })

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

    console.log('Revenue calculations:', {
      totalRevenue,
      monthlyRevenue,
      completedCount: completedBookingsList.length
    })

    // Get customer stats
    const { data: customerStats, error: customerError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, created_at')
      .eq('role', 'customer')

    console.log('Customer stats query result:', {
      count: customerStats?.length || 0,
      error: customerError
    })

    if (customerError) {
      console.error('Customer stats error:', customerError)
      return ApiResponseHandler.serverError('Failed to fetch customer statistics')
    }

    const totalCustomers = customerStats?.length || 0
    
    // Active customers are those with at least one booking in the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: activeCustomerData, error: activeCustomerError } = await supabaseAdmin
      .from('bookings')
      .select('customer_id')
      .gte('created_at', sixMonthsAgo.toISOString())
      .not('customer_id', 'is', null)

    if (activeCustomerError) {
      console.error('Active customer stats error:', activeCustomerError)
    }

    const uniqueActiveCustomers = new Set(activeCustomerData?.map(b => b.customer_id).filter(Boolean) || [])
    const activeCustomers = uniqueActiveCustomers.size

    console.log('Active customer calculation:', {
      activeCustomerDataCount: activeCustomerData?.length || 0,
      uniqueActiveCustomers: activeCustomers
    })

    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalRevenue,
      monthlyRevenue,
      totalCustomers,
      activeCustomers,
      debug: {
        bookingStatsCount: bookingStats?.length || 0,
        customerStatsCount: customerStats?.length || 0,
        activeCustomerDataCount: activeCustomerData?.length || 0
      }
    }

    console.log('Final stats:', stats)
    return ApiResponseHandler.success(stats)

  } catch (error) {
    console.error('Admin stats debug error:', error)
    return ApiResponseHandler.serverError('Failed to fetch admin statistics')
  }
}