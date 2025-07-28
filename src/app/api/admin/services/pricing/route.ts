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

    // Get all service pricing data
    const { data: servicePricing, error: pricingError } = await supabase
      .from('service_pricing')
      .select(`
        service_id,
        vehicle_size_id,
        price,
        profit_margin,
        cost_basis
      `)

    if (pricingError) {
      console.error('Error fetching service pricing:', pricingError)
      return ApiResponseHandler.serverError('Failed to fetch pricing data')
    }

    // Transform into matrix format
    interface PricingMatrix {
      [serviceId: string]: {
        [vehicleSizeId: string]: {
          service_id: string
          vehicle_size_id: string
          price: number
          // Add other pricing properties as needed
        }
      }
    }
    
    const pricingMatrix: PricingMatrix = {}
    if (servicePricing && servicePricing.length > 0) {
      servicePricing.forEach(pricing => {
        if (pricing && pricing.service_id && pricing.vehicle_size_id) {
          if (!pricingMatrix[pricing.service_id]) {
            pricingMatrix[pricing.service_id] = {}
          }
          pricingMatrix[pricing.service_id]![pricing.vehicle_size_id] = {
            service_id: pricing.service_id,
            vehicle_size_id: pricing.vehicle_size_id,
            price: pricing.price
          }
        }
      })
    }

    return ApiResponseHandler.success(pricingMatrix)

  } catch (error) {
    console.error('Pricing data error:', error)
    return ApiResponseHandler.serverError('Failed to fetch pricing data')
  }
}

export async function PUT(request: NextRequest) {
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

    const { pricingMatrix } = await request.json()

    if (!pricingMatrix) {
      return ApiResponseHandler.badRequest('Pricing matrix is required')
    }

    // Convert matrix back to records
    interface PricingRecord {
      service_id: string
      vehicle_size_id: string
      price: number
      effective_date: string
      created_by: string
    }
    const pricingRecords: PricingRecord[] = []
    Object.entries(pricingMatrix).forEach(([serviceId, vehicleSizes]) => {
      Object.entries(vehicleSizes as Record<string, { price: number }>).forEach(([vehicleSizeId, pricing]) => {
        pricingRecords.push({
          service_id: serviceId,
          vehicle_size_id: vehicleSizeId,
          price: pricing.price,
          effective_date: new Date().toISOString(),
          created_by: 'admin'
        })
      })
    })

    // Delete existing pricing data
    const { error: deleteError } = await supabase
      .from('service_pricing')
      .delete()
      .neq('service_id', 'none') // Delete all

    if (deleteError) {
      console.error('Error deleting existing pricing:', deleteError)
      return ApiResponseHandler.serverError('Failed to update pricing')
    }

    // Insert new pricing data
    const { error: insertError } = await supabase
      .from('service_pricing')
      .insert(pricingRecords)

    if (insertError) {
      console.error('Error inserting pricing:', insertError)
      return ApiResponseHandler.serverError('Failed to update pricing')
    }

    return ApiResponseHandler.success({ message: 'Pricing matrix updated successfully' })

  } catch (error) {
    console.error('Pricing update error:', error)
    return ApiResponseHandler.serverError('Failed to update pricing data')
  }
}