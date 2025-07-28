import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { createClientFromRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const validateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15, 'Phone number too long'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const body = await request.json()
    
    // Validate request body
    const validation = validateUserSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHandler.badRequest('Invalid request data', {
        errors: validation.error.issues
      })
    }
    
    const { email, phone } = validation.data
    
    // Check if user exists by email OR phone
    const { data: existingUsers, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, phone, first_name, last_name')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .limit(1)
    
    if (userError) {
      console.error('Error checking existing user:', userError)
      return ApiResponseHandler.serverError('Failed to validate user')
    }
    
    const existingUser = existingUsers?.[0]
    
    if (!existingUser) {
      // New user
      return ApiResponseHandler.success({
        isExistingUser: false,
        userId: null,
        vehicles: [],
        addresses: []
      })
    }
    
    // Existing user - fetch their vehicles and addresses
    const [vehiclesResult, addressesResult] = await Promise.all([
      supabase
        .from('customer_vehicles')
        .select(`
          *,
          vehicle_sizes(*)
        `)
        .eq('user_id', existingUser.id),
      
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', existingUser.id)
    ])
    
    if (vehiclesResult.error) {
      console.error('Error fetching user vehicles:', vehiclesResult.error)
    }
    
    if (addressesResult.error) {
      console.error('Error fetching user addresses:', addressesResult.error)
    }
    
    // Transform vehicles to match expected format
    const vehicles = vehiclesResult.data?.map(vehicle => ({
      id: vehicle.id,
      user_id: vehicle.user_id,
      vehicle_size_id: vehicle.vehicle_size_id,
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      license_plate: vehicle.license_plate,
      registration: vehicle.registration,
      notes: vehicle.notes,
      is_primary: vehicle.is_primary,
      is_default: vehicle.is_default,
      created_at: vehicle.created_at,
      updated_at: vehicle.updated_at,
      vehicle_size: vehicle.vehicle_sizes ? {
        id: vehicle.vehicle_sizes.id,
        name: vehicle.vehicle_sizes.name,
        price_multiplier: vehicle.vehicle_sizes.price_multiplier,
        description: vehicle.vehicle_sizes.description,
        sort_order: vehicle.vehicle_sizes.display_order,
      } : undefined
    })) || []
    
    // Transform addresses to match expected format
    const addresses = addressesResult.data?.map(address => ({
      id: address.id,
      user_id: address.user_id,
      name: address.name,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      city: address.city,
      postal_code: address.postal_code,
      county: address.county,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      distance_from_base: address.distance_from_base,
      distance_from_business: address.distance_from_business,
      is_primary: address.is_primary,
      is_verified: address.is_verified,
      is_default: address.is_default,
      created_at: address.created_at,
      updated_at: address.updated_at,
    })) || []
    
    return ApiResponseHandler.success({
      isExistingUser: true,
      userId: existingUser.id,
      userDetails: {
        email: existingUser.email,
        phone: existingUser.phone,
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
      },
      vehicles,
      addresses
    })
    
  } catch (error) {
    console.error('Unexpected error in user validation:', error)
    return ApiResponseHandler.serverError('An unexpected error occurred')
  }
}