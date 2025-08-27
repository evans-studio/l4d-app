import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

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

    // Get customer data (similar to main customers API but simplified for export)
    const { data: customerProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    if (profilesError) {
      logger.error('Error fetching customer profiles:', profilesError)
      return ApiResponseHandler.serverError('Failed to fetch customers')
    }

    if (!customerProfiles || customerProfiles.length === 0) {
      // Return empty CSV
      const csvContent = 'Name,Email,Phone,Registration Date,Total Bookings,Total Spent,Status\n'
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="customers.csv"'
        }
      })
    }

    // Get customer IDs for bulk queries
    const customerIds = customerProfiles.map(p => p.id)

    // Get booking statistics
    const { data: bookingStats, error: statsError } = await supabase
      .from('bookings')
      .select('customer_id, total_price, scheduled_date, status')
      .in('customer_id', customerIds)
      .neq('status', 'cancelled')

    if (statsError) {
      logger.error('Error fetching booking stats:', statsError)
    }

    // Process data and create CSV
    const csvRows = ['Name,Email,Phone,Registration Date,Total Bookings,Total Spent,Status']

    for (const profile of customerProfiles) {
      const customerBookings = bookingStats?.filter(b => b.customer_id === profile.id) || []
      const totalBookings = customerBookings.length
      const totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
      
      // Determine status
      const lastBooking = customerBookings
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())[0]
      
      const daysSinceLastBooking = lastBooking 
        ? Math.floor((Date.now() - new Date(lastBooking.scheduled_date).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      let status = 'Inactive'
      if (totalSpent >= 500) {
        status = 'VIP'
      } else if (daysSinceLastBooking !== null && daysSinceLastBooking <= 90) {
        status = 'Active'
      }

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
      const email = profile.email || ''
      const phone = profile.phone || ''
      const registrationDate = new Date(profile.created_at).toLocaleDateString('en-GB')

      // Escape CSV values that might contain commas or quotes
      const escapeCsvValue = (value: string | number) => {
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      csvRows.push([
        escapeCsvValue(fullName),
        escapeCsvValue(email),
        escapeCsvValue(phone),
        escapeCsvValue(registrationDate),
        totalBookings,
        totalSpent.toFixed(2),
        escapeCsvValue(status)
      ].join(','))
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    logger.error('Customer export error:', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to export customers')
  }
}