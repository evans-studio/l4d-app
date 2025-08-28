import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }
    
    // Use admin client for database queries
    const supabase = supabaseAdmin

    // Calculate date ranges for operational dashboard
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // End of current week (Saturday)

    // Format dates for SQL queries
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

    // Get today's bookings with customer and services
    const { data: todayBookingsRaw, error: todayError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        scheduled_start_time,
        total_price,
        booking_reference,
        customer_id
      `)
      .eq('scheduled_date', todayStr)

    if (todayError) {
      logger.error('Today bookings error:', todayError)
    }

    // Get tomorrow's bookings (counts only)
    const { data: tomorrowBookings, error: tomorrowError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('scheduled_date', tomorrowStr)

    if (tomorrowError) {
      logger.error('Tomorrow bookings error:', tomorrowError)
    }

    // Get this week's bookings (for revenue/utilization)
    const { data: weekBookings, error: weekError } = await supabase
      .from('bookings')
      .select('id, status, scheduled_date, total_price, booking_reference, created_at, customer_id')
      .gte('scheduled_date', startOfWeekStr)
      .lte('scheduled_date', endOfWeekStr)

    if (weekError) {
      logger.error('Week bookings error:', weekError)
    }

    // Get previous week's bookings for comparison
    const previousWeekStart = new Date(startOfWeek)
    previousWeekStart.setDate(startOfWeek.getDate() - 7)
    const previousWeekEnd = new Date(endOfWeek)
    previousWeekEnd.setDate(endOfWeek.getDate() - 7)
    const previousWeekStartStr = previousWeekStart.toISOString().split('T')[0]
    const previousWeekEndStr = previousWeekEnd.toISOString().split('T')[0]

    const { data: previousWeekBookings, error: previousWeekError } = await supabase
      .from('bookings')
      .select('id, total_price')
      .gte('scheduled_date', previousWeekStartStr)
      .lte('scheduled_date', previousWeekEndStr)

    if (previousWeekError) {
      logger.error('Previous week bookings error:', previousWeekError)
    }

    // Get this month's bookings for revenue calculation
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0]
    const endOfMonthStr = endOfMonth.toISOString().split('T')[0]

    const { data: monthBookings, error: monthError } = await supabase
      .from('bookings')
      .select('id, total_price, scheduled_date')
      .gte('scheduled_date', startOfMonthStr)
      .lte('scheduled_date', endOfMonthStr)

    if (monthError) {
      logger.error('Month bookings error:', monthError)
    }

    // Get customer activity data - bookings created this week with customer and services
    const { data: customerBookingsRaw, error: customerError } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_id,
        created_at
      `)
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString())
      .order('created_at', { ascending: false })

    if (customerError) {
      logger.error('Customer bookings error:', customerError)
    }

    // Get unique customers from this week vs previous periods to determine new vs returning
    const thisWeekCustomersFromBookings = [...new Set(customerBookingsRaw?.map(b => b.customer_id) || [])]

    // Also include brand new signups this week (even if they haven't booked yet)
    const { data: thisWeekProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, role, created_at')
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString())

    if (profilesError) {
      logger.error('Profiles this week error:', profilesError)
    }

    type ProfileLite = { id: string; role?: string }
    const signupIdsThisWeek = new Set(
      (thisWeekProfiles || [])
        .filter((p: ProfileLite) => !['admin', 'super_admin'].includes(p.role || ''))
        .map((p: ProfileLite) => p.id)
    )
    
    const { data: existingCustomers, error: existingCustomersError } = await supabase
      .from('bookings')
      .select('customer_id')
      .lt('created_at', startOfWeek.toISOString())
      .in('customer_id', thisWeekCustomersFromBookings)

    if (existingCustomersError) {
      logger.error('Existing customers error:', existingCustomersError)
    }

    const existingCustomerIds = [...new Set(existingCustomers?.map(b => b.customer_id) || [])]

    // Compute unions for activity metrics
    const thisWeekUnionIds = new Set<string>([
      ...thisWeekCustomersFromBookings.filter(Boolean) as string[],
      ...Array.from(signupIdsThisWeek)
    ])

    // Get all pending bookings that require admin action
    const { data: actionBookings, error: actionError } = await supabase
      .from('bookings')
      .select('id, status, scheduled_date, booking_reference, customer_id')
      .eq('status', 'pending') // Only pending bookings need admin action
      .order('scheduled_date', { ascending: true })

    if (actionError) {
      logger.error('Action bookings error:', actionError)
    }

    // Get all pending reschedule requests that require admin action
    const { data: rescheduleRequests, error: rescheduleError } = await supabase
      .from('booking_reschedule_requests')
      .select('id, booking_id, requested_date, requested_time, reason, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (rescheduleError) {
      logger.error('Reschedule requests error:', rescheduleError)
    }

    // Transform today bookings with customer_name and service list
    // Lookup profiles for "today" names
    const todayCustomerIds = [...new Set((todayBookingsRaw || []).map((b: { customer_id: string }) => b.customer_id).filter(Boolean))]
    let todayProfiles: Record<string, { id: string; first_name?: string; last_name?: string; email?: string }> = {}
    if (todayCustomerIds.length > 0) {
      const { data: p } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .in('id', todayCustomerIds)
      todayProfiles = (p || []).reduce((acc: typeof todayProfiles, prof: { id: string; first_name?: string; last_name?: string; email?: string }) => {
        acc[prof.id] = prof
        return acc
      }, {})
    }
    const todayBookings = (todayBookingsRaw || []).map((b: { id: string; status: string; scheduled_start_time: string; total_price: number; booking_reference: string; customer_id: string }) => {
      const profile = todayProfiles[b.customer_id] || null
      const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Customer'
      return {
        id: b.id,
        status: b.status,
        scheduled_start_time: b.scheduled_start_time,
        total_price: b.total_price,
        booking_reference: b.booking_reference,
        customer_id: b.customer_id,
        customer_name: name || profile?.email || 'Customer',
        services: [] as string[]
      }
    })

    // Calculate today's schedule stats with completed bookings
    const todayTotal = todayBookings.length || 0
    const todayCompleted = todayBookings.filter((b) => b.status === 'completed')?.length || 0
    const todayInProgress = todayBookings.filter((b) => b.status === 'in_progress')?.length || 0
    const todayPending = todayBookings.filter((b) => ['pending', 'confirmed'].includes(b.status))?.length || 0
    const todayRevenue = todayBookings.reduce((sum: number, booking) => sum + (booking.total_price || 0), 0) || 0
    
    // Calculate tomorrow's schedule stats
    const tomorrowTotal = tomorrowBookings?.length || 0
    const tomorrowCapacity = 8 // Same capacity
    const tomorrowRemaining = Math.max(0, tomorrowCapacity - tomorrowTotal)
    const tomorrowFullyBooked = tomorrowTotal >= tomorrowCapacity

    // Calculate this week's stats
    const weekTotal = weekBookings?.length || 0
    const weekCapacity = 56 // 8 slots × 7 days
    const weekUtilization = weekCapacity > 0 ? Math.round((weekTotal / weekCapacity) * 100) : 0
    const weekRevenue = weekBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

    // Calculate previous week revenue for comparison
    const previousWeekRevenue = previousWeekBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    const revenueChange = previousWeekRevenue > 0 
      ? Math.round(((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100)
      : 0

    // Calculate monthly revenue
    const monthRevenue = monthBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

    // Transform customer activity
    const newFromBookingsIds = new Set<string>(
      thisWeekCustomersFromBookings.filter(customerId => !existingCustomerIds.includes(customerId)) as string[]
    )
    // New customers are unique union of signups this week and first-time bookers this week
    const newCustomersIds = new Set<string>([...Array.from(signupIdsThisWeek), ...Array.from(newFromBookingsIds)])
    const newCustomers = Array.from(newCustomersIds)
    const returningCustomers = thisWeekCustomersFromBookings.filter(customerId => existingCustomerIds.includes(customerId))
    // Resolve names for activity
    const activityCustomerIds = [...new Set((customerBookingsRaw || []).map((b: { customer_id: string }) => b.customer_id).filter(Boolean))]
    let activityProfiles: Record<string, { id: string; first_name?: string; last_name?: string; email?: string }> = {}
    if (activityCustomerIds.length > 0) {
      const { data: ap } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email')
        .in('id', activityCustomerIds)
      activityProfiles = (ap || []).reduce((acc: typeof activityProfiles, prof: { id: string; first_name?: string; last_name?: string; email?: string }) => {
        acc[prof.id] = prof
        return acc
      }, {})
    }
    const latestCustomerActivity = (customerBookingsRaw || []).slice(0, 3).map((b: { id: string; customer_id: string; created_at: string }) => {
      const profile = activityProfiles[b.customer_id] as { id: string; first_name?: string; last_name?: string; email?: string } | undefined
      const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''
      return {
        id: b.id,
        customer_id: b.customer_id,
        customer_name: name || 'Customer',
        services: [] as { name: string }[],
        created_at: b.created_at
      }
    })

    // Calculate action required stats - pending bookings AND reschedule requests need action
    const pendingBookings = actionBookings?.length || 0
    const pendingRescheduleRequests = rescheduleRequests?.length || 0
    const totalActionRequired = pendingBookings + pendingRescheduleRequests

    const stats = {
      // Today's Schedule Widget - Enhanced with real data
      today: {
        booked: todayTotal,
        completed: todayCompleted,
        inProgress: todayInProgress,
        remaining: todayPending,
        revenue: todayRevenue,
        bookings: todayBookings
      },
      
      // Customer Activity Widget - Real customer metrics
      customerActivity: {
        thisWeek: thisWeekUnionIds.size,
        newCustomers: newCustomers.length,
        returningCustomers: returningCustomers.length,
        latestActivity: latestCustomerActivity
      },
      
      // Revenue Pulse Widget - Real revenue data with trends
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        previousWeek: previousWeekRevenue,
        changePercent: revenueChange,
        trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable'
      },
      
      // Legacy fields for backward compatibility
      tomorrow: {
        booked: tomorrowTotal,
        capacity: tomorrowCapacity,
        remaining: tomorrowRemaining,
        fullyBooked: tomorrowFullyBooked,
        utilizationPercent: tomorrowCapacity > 0 ? Math.round((tomorrowTotal / tomorrowCapacity) * 100) : 0,
        bookings: tomorrowBookings || []
      },
      
      thisWeek: {
        booked: weekTotal,
        capacity: weekCapacity,
        utilizationPercent: weekUtilization,
        revenue: weekRevenue,
        bookings: weekBookings || []
      },
      
      // Requiring Action Widget
      requiresAction: {
        total: totalActionRequired,
        pending: pendingBookings,
        rescheduleRequests: pendingRescheduleRequests,
        toConfirm: 0, // No separate "to confirm" - confirmed bookings don't need action
        bookings: actionBookings?.slice(0, 5) || [], // Show top 5 bookings that need attention
        reschedules: rescheduleRequests?.slice(0, 5) || [] // Show top 5 reschedule requests
      }
    }

    return ApiResponseHandler.success(stats)

  } catch (error) {
    logger.error('Admin stats error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch admin statistics')
  }
}