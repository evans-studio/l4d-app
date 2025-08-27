import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
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

    // Get total customers count
    const { count: totalCustomers, error: totalError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')

    if (totalError) {
      logger.error('Error counting total customers:', totalError)
    }

    // Get customers who have made bookings in the last 90 days (active)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: activeCustomerIds, error: activeError } = await supabase
      .from('bookings')
      .select('customer_id')
      .gte('scheduled_date', ninetyDaysAgo.toISOString().split('T')[0])
      .neq('status', 'cancelled')

    if (activeError) {
      logger.error('Error fetching active customers:', activeError)
    }

    const activeCustomers = new Set(activeCustomerIds?.map(b => b.customer_id) || []).size

    // Get new customers this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newThisMonth, error: newError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', startOfMonth.toISOString())

    if (newError) {
      logger.error('Error counting new customers:', newError)
    }

    // Get VIP customers (those who have spent £500 or more)
    const { data: customerSpending, error: spendingError } = await supabase
      .from('bookings')
      .select('customer_id, total_price')
      .neq('status', 'cancelled')

    if (spendingError) {
      logger.error('Error fetching customer spending:', spendingError)
    }

    // Calculate VIP customers and average customer value
    const customerTotals = new Map<string, number>()
    let totalRevenue = 0

    customerSpending?.forEach(booking => {
      const currentTotal = customerTotals.get(booking.customer_id) || 0
      const newTotal = currentTotal + (booking.total_price || 0)
      customerTotals.set(booking.customer_id, newTotal)
      totalRevenue += booking.total_price || 0
    })

    const vipCustomers = Array.from(customerTotals.values()).filter(total => total >= 500).length
    const avgCustomerValue = customerTotals.size > 0 
      ? Math.round(totalRevenue / customerTotals.size) 
      : 0

    // Calculate customer retention rate (customers who have made repeat bookings)
    const customerBookingCounts = new Map<string, number>()
    customerSpending?.forEach(booking => {
      const count = customerBookingCounts.get(booking.customer_id) || 0
      customerBookingCounts.set(booking.customer_id, count + 1)
    })

    const repeatCustomers = Array.from(customerBookingCounts.values()).filter(count => count > 1).length
    const retentionRate = customerTotals.size > 0 
      ? Math.round((repeatCustomers / customerTotals.size) * 100) 
      : 0

    const stats = {
      total_customers: totalCustomers || 0,
      active_customers: activeCustomers,
      new_this_month: newThisMonth || 0,
      vip_customers: vipCustomers,
      avg_customer_value: avgCustomerValue,
      customer_retention_rate: retentionRate
    }

    return ApiResponseHandler.success(stats)

  } catch (error) {
    logger.error('Customer stats error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch customer statistics')
  }
}