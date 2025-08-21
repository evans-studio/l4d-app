import { NextRequest } from 'next/server'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { ApiResponseHandler } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/direct'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    const supabase = supabaseAdmin

    const [bookings, customers, services, categories, vehicleSizes] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('user_profiles').select('*'),
      supabase.from('services').select('*'),
      supabase.from('service_categories').select('*'),
      supabase.from('vehicle_sizes').select('*')
    ])

    const anyError = bookings.error || customers.error || services.error || categories.error || vehicleSizes.error
    if (anyError) {
      console.error('System export error:', anyError)
      return ApiResponseHandler.serverError('Failed to export data')
    }

    const payload = {
      exported_at: new Date().toISOString(),
      bookings: bookings.data || [],
      customers: customers.data || [],
      services: services.data || [],
      service_categories: categories.data || [],
      vehicle_sizes: vehicleSizes.data || []
    }

    return new Response(JSON.stringify({ success: true, data: payload }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="system-export-${new Date().toISOString().slice(0,10)}.json"`
      }
    })
  } catch (error) {
    console.error('System export exception:', error)
    return ApiResponseHandler.serverError('Failed to export data')
  }
}


