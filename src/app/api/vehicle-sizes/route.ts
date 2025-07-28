import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get vehicle sizes
    const { data: vehicleSizes, error: vehicleSizesError } = await supabase
      .from('vehicle_sizes')
      .select(`
        id,
        name,
        description,
        multiplier,
        sort_order
      `)
      .order('sort_order', { ascending: true })

    if (vehicleSizesError) {
      console.error('Error fetching vehicle sizes:', vehicleSizesError)
      return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
    }

    return ApiResponseHandler.success(vehicleSizes || [])

  } catch (error) {
    console.error('Vehicle sizes error:', error)
    return ApiResponseHandler.serverError('Failed to fetch vehicle sizes')
  }
}