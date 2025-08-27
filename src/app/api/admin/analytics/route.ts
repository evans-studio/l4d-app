import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    // Get current user and verify admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Parse date range parameters
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || ''
    const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0] || ''

    // Calculate previous period for comparison
    const periodDays = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    const prevStartDate = new Date(new Date(startDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || ''
    const prevEndDate = new Date(new Date(endDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || ''

    // Get bookings created in current period (for revenue, counts, services, locations)
    const { data: createdBookings, error: createdError } = await supabase
      .from('bookings')
      .select(`
        id,
        total_price,
        status,
        created_at,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        estimated_duration,
        customer_id,
        service_address,
        payment_status,
        booking_services(
          service_details
        )
      `)
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`)

    if (createdError) {
      logger.error('Error fetching created bookings:', createdError)
      return ApiResponseHandler.serverError('Failed to fetch analytics data')
    }

    // Get bookings created in previous period (for comparisons)
    const { data: previousBookings, error: previousError } = await supabase
      .from('bookings')
      .select('id, total_price, status, payment_status, created_at')
      .gte('created_at', `${prevStartDate}T00:00:00.000Z`)
      .lte('created_at', `${prevEndDate}T23:59:59.999Z`)

    if (previousError) {
      logger.error('Error fetching previous bookings:', previousError)
    }

    // Calculate revenue metrics
    // Revenue: include all except failed/declined/cancelled (treat pending/confirmed/in_progress/completed as pipeline revenue)
    const isRevenueStatus = (b: { status?: string | null; payment_status?: string | null }) => {
      const s = (b.status || '').toLowerCase()
      const ps = (b.payment_status || '').toLowerCase()
      if (s === 'cancelled' || s === 'declined' || s === 'payment_failed' || ps === 'failed') return false
      return true
    }

    const currentRevenue = createdBookings?.filter(isRevenueStatus).reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    const previousRevenue = previousBookings?.filter(isRevenueStatus).reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Calculate booking metrics
    const totalBookings = createdBookings?.length || 0
    const completedBookings = createdBookings?.filter((b: { status?: string | null }) => b.status === 'completed').length || 0
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
    const cancelledBookings = createdBookings?.filter((b: { status?: string | null }) => b.status === 'cancelled').length || 0
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0
    const averageBookingValue = totalBookings > 0 ? currentRevenue / totalBookings : 0

    // Status breakdown
    const statusBreakdown = {
      pending: createdBookings?.filter((b: { status?: string | null }) => b.status === 'pending').length || 0,
      confirmed: createdBookings?.filter((b: { status?: string | null }) => b.status === 'confirmed').length || 0,
      completed: completedBookings,
      cancelled: cancelledBookings
    }

    // Get monthly trend data (last 6 months) based on scheduled_date
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0] || ''
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0] || ''

      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('total_price, status, payment_status, created_at')
        .gte('created_at', `${monthStart}T00:00:00.000Z`)
        .lte('created_at', `${monthEnd}T23:59:59.999Z`)

      const monthRevenue = monthBookings?.filter(isRevenueStatus).reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
      const monthBookingCount = monthBookings?.length || 0

      monthlyTrend.push({
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        bookings: monthBookingCount
      })
    }

    // Analyze services popularity
    const serviceStats = new Map<string, { bookings: number; revenue: number }>()
    
    createdBookings?.forEach((booking: { 
      booking_services?: Array<{ service_details?: { name?: string } }> 
      total_price?: number 
    }) => {
      booking.booking_services?.forEach((bs: { service_details?: { name?: string } }) => {
        const serviceName = bs.service_details?.name || 'Unknown Service'
        const current = serviceStats.get(serviceName) || { bookings: 0, revenue: 0 }
        serviceStats.set(serviceName, {
          bookings: current.bookings + 1,
          revenue: current.revenue + (booking.total_price || 0) / (booking.booking_services?.length || 1)
        })
      })
    })

    const sortedServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.bookings - a.bookings)

    const mostPopular = sortedServices.slice(0, 5)
    const leastPopular = sortedServices.slice(-3).reverse()

    // Analyze top locations
    const locationStats = new Map<string, { bookings: number; revenue: number }>()
    
    createdBookings?.forEach((booking: { 
      service_address?: { city?: string }
      total_price?: number 
    }) => {
      const city = booking.service_address?.city || 'Unknown'
      const current = locationStats.get(city) || { bookings: 0, revenue: 0 }
      locationStats.set(city, {
        bookings: current.bookings + 1,
        revenue: current.revenue + (booking.total_price || 0)
      })
    })

    const topAreas = Array.from(locationStats.entries())
      .map(([city, stats]) => ({ city, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Analyze busiest days and hours
    const dayStats = new Map<string, number>()
    const hourStats = new Map<string, number>()

    // For operational performance, use scheduled date/time within the selected range
    const { data: perfBookings } = await supabase
      .from('bookings')
      .select('scheduled_date, scheduled_start_time')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)

    perfBookings?.forEach(booking => {
      const date = new Date(booking.scheduled_date)
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' })
      dayStats.set(dayName, (dayStats.get(dayName) || 0) + 1)

      if (booking.scheduled_start_time) {
        const hour = booking.scheduled_start_time.split(':')[0] + ':00'
        hourStats.set(hour, (hourStats.get(hour) || 0) + 1)
      }
    })

    const busiestDays = Array.from(dayStats.entries())
      .map(([day, bookings]) => ({ day, bookings }))
      .sort((a, b) => b.bookings - a.bookings)

    const busiestHours = Array.from(hourStats.entries())
      .map(([hour, bookings]) => ({ hour, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    // Calculate average job duration
    const durationsMinutes = (createdBookings as Array<{ estimated_duration?: number }> | null | undefined)
      ?.map((b) => b.estimated_duration || 0)
      .filter((d) => d > 0) || []
    const averageJobDuration = durationsMinutes.length > 0 
      ? durationsMinutes.reduce((sum: number, duration: number) => sum + duration, 0) / durationsMinutes.length
      : 120 // Default 2 hours

    // Get customer analytics
    const { data: customers, error: customersError } = await supabase
      .from('user_profiles')
      .select('id, created_at')
      .eq('role', 'customer')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59.999Z')

    if (customersError) {
      logger.error('Error fetching customers:', customersError)
    }

    // Calculate customer metrics
    const newCustomers = customers?.length || 0
    
    // Get repeat customers (simplified calculation)
    const { data: repeatCustomerBookings } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .neq('status', 'cancelled')

    const customerBookingCounts = new Map<string, number>()
    repeatCustomerBookings?.forEach(booking => {
      const count = customerBookingCounts.get(booking.customer_id) || 0
      customerBookingCounts.set(booking.customer_id, count + 1)
    })

    const repeatCustomers = Array.from(customerBookingCounts.values()).filter(count => count > 1).length
    const totalCustomersInPeriod = customerBookingCounts.size
    const repeatCustomerRate = totalCustomersInPeriod > 0 ? (repeatCustomers / totalCustomersInPeriod) * 100 : 0

    // Calculate customer lifetime value (simplified)
    const averageLifetimeValue = totalCustomersInPeriod > 0 ? currentRevenue / totalCustomersInPeriod : 0

    // Calculate retention rate (customers from previous period who booked again)
    const retentionRate = 75 // Placeholder - would need more complex calculation

    const analyticsData = {
      revenue: {
        total: currentRevenue,
        this_month: currentRevenue,
        last_month: previousRevenue,
        growth_percentage: revenueGrowth,
        daily_average: currentRevenue / periodDays,
        monthly_trend: monthlyTrend
      },
      bookings: {
        total: totalBookings,
        this_month: totalBookings,
        completion_rate: completionRate,
        cancellation_rate: cancellationRate,
        average_value: averageBookingValue,
        status_breakdown: statusBreakdown
      },
      customers: {
        total: newCustomers,
        new_this_month: newCustomers,
        retention_rate: retentionRate,
        average_lifetime_value: averageLifetimeValue,
        repeat_customer_rate: repeatCustomerRate
      },
      services: {
        most_popular: mostPopular,
        least_popular: leastPopular
      },
      locations: {
        top_areas: topAreas
      },
      performance: {
        busiest_days: busiestDays,
        busiest_hours: busiestHours,
        average_job_duration: averageJobDuration
      }
    }

    return ApiResponseHandler.success(analyticsData)

  } catch (error) {
    logger.error('Analytics error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch analytics data')
  }
}