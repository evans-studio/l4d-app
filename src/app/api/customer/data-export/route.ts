import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    const userId = session.user.id

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Get user bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        vehicle:vehicles(*),
        address:addresses(*),
        booking_services(*)
      `)
      .eq('customer_id', userId)

    // Get user vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', userId)

    // Get user addresses
    const { data: addresses } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', userId)

    // Get notification settings
    const { data: notificationSettings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Compile data export
    const exportData = {
      exportDate: new Date().toISOString(),
      profile: {
        id: profile?.id,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        email: profile?.email,
        phone: profile?.phone,
        role: profile?.role,
        createdAt: profile?.created_at,
        updatedAt: profile?.updated_at
      },
      bookings: bookings || [],
      vehicles: vehicles || [],
      addresses: addresses || [],
      notificationSettings: notificationSettings || null,
      totalBookings: bookings?.length || 0,
      totalSpent: bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    }

    // Return JSON data (in production, you might want to generate a downloadable file)
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="love4detailing-data-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Data export error:', error)
    return ApiResponseHandler.serverError('Failed to export data')
  }
}