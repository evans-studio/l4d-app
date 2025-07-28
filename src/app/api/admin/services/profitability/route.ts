import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Get service profitability data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        total_price,
        estimated_duration,
        status,
        booking_services(
          service_details(
            id,
            name
          )
        )
      `)
      .eq('status', 'completed')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return ApiResponseHandler.serverError('Failed to fetch profitability data')
    }

    // Get service pricing data
    const { data: servicePricing, error: pricingError } = await supabase
      .from('service_pricing')
      .select(`
        service_id,
        price,
        profit_margin,
        cost_basis
      `)

    if (pricingError) {
      console.error('Error fetching service pricing:', pricingError)
    }

    // Calculate profitability metrics
    const serviceMetrics = new Map<string, {
      service_id: string
      service_name: string
      total_bookings: number
      total_revenue: number
      total_duration: number
      profit_margins: number[]
      cost_bases: number[]
    }>()

    // Process bookings
    bookings?.forEach(booking => {
      booking.booking_services?.forEach((bs: any) => {
        const service = bs.service_details
        if (!service) return

        const serviceId = service.id
        const serviceName = service.name
        
        if (!serviceMetrics.has(serviceId)) {
          serviceMetrics.set(serviceId, {
            service_id: serviceId,
            service_name: serviceName,
            total_bookings: 0,
            total_revenue: 0,
            total_duration: 0,
            profit_margins: [],
            cost_bases: []
          })
        }

        const metrics = serviceMetrics.get(serviceId)!
        metrics.total_bookings += 1
        metrics.total_revenue += booking.total_price || 0
        metrics.total_duration += booking.estimated_duration || 0
      })
    })

    // Add pricing data
    servicePricing?.forEach(pricing => {
      const metrics = serviceMetrics.get(pricing.service_id)
      if (metrics) {
        if (pricing.profit_margin) {
          metrics.profit_margins.push(pricing.profit_margin)
        }
        if (pricing.cost_basis) {
          metrics.cost_bases.push(pricing.cost_basis)
        }
      }
    })

    // Calculate final metrics
    const profitabilityData = Array.from(serviceMetrics.values()).map(metrics => {
      const avgPrice = metrics.total_bookings > 0 ? metrics.total_revenue / metrics.total_bookings : 0
      const avgProfitMargin = metrics.profit_margins.length > 0 
        ? metrics.profit_margins.reduce((sum, margin) => sum + margin, 0) / metrics.profit_margins.length
        : 0
      const avgCostBasis = metrics.cost_bases.length > 0
        ? metrics.cost_bases.reduce((sum, cost) => sum + cost, 0) / metrics.cost_bases.length
        : 0
      const avgHourlyDuration = metrics.total_duration > 0 ? metrics.total_duration / metrics.total_bookings / 60 : 2 // Default 2 hours
      const costPerHour = avgHourlyDuration > 0 ? avgCostBasis / avgHourlyDuration : 0

      // Calculate profitability score (0-100)
      let profitabilityScore = 0
      
      // Revenue factor (40% of score)
      const revenueScore = Math.min((metrics.total_revenue / 1000) * 10, 40) // £1000 = 40 points
      
      // Margin factor (40% of score)
      const marginScore = Math.min(avgProfitMargin * 0.4, 40) // 100% margin = 40 points
      
      // Volume factor (20% of score)
      const volumeScore = Math.min((metrics.total_bookings / 10) * 20, 20) // 10 bookings = 20 points
      
      profitabilityScore = revenueScore + marginScore + volumeScore

      return {
        service_id: metrics.service_id,
        service_name: metrics.service_name,
        avg_price: Math.round(avgPrice * 100) / 100,
        total_bookings: metrics.total_bookings,
        total_revenue: metrics.total_revenue,
        avg_profit_margin: Math.round(avgProfitMargin * 10) / 10,
        cost_per_hour: Math.round(costPerHour * 100) / 100,
        profitability_score: Math.round(profitabilityScore * 10) / 10
      }
    })

    // Sort by profitability score
    profitabilityData.sort((a, b) => b.profitability_score - a.profitability_score)

    return ApiResponseHandler.success(profitabilityData)

  } catch (error) {
    console.error('Profitability analysis error:', error)
    return ApiResponseHandler.serverError('Failed to analyze profitability')
  }
}