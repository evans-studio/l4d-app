import { NextRequest, NextResponse } from 'next/server'
import { BookingService } from '@/lib/services/booking'
import { ApiResponseHandler } from '@/lib/api/response'
import { ApiValidation } from '@/lib/api/validation'
import { ApiAuth } from '@/lib/api/auth'
import { z } from 'zod'

const createAddressSchema = z.object({
  name: z.string().min(1, 'Address name is required').max(100),
  address_line_1: z.string().min(1, 'Address line 1 is required').max(255),
  address_line_2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  county: z.string().max(100).optional(),
  is_primary: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const bookingService = new BookingService()
    const result = await bookingService.getCustomerAddresses(auth!.profile.id as string)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to fetch addresses',
        'FETCH_ADDRESSES_FAILED'
      )
    }

    return ApiResponseHandler.success(result.data, {
      pagination: {
        page: 1,
        limit: result.data?.length || 0,
        total: result.data?.length || 0,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('Get customer addresses error:', error)
    return ApiResponseHandler.serverError('Failed to fetch addresses')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, error: authError } = await ApiAuth.authenticate(request)
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validation = await ApiValidation.validateBody(body, createAddressSchema)
    if (!validation.success) {
      return validation.error
    }

    const bookingService = new BookingService()
    
    // Add required fields that are missing from validation data
    const addressData = {
      ...validation.data,
      country: 'United Kingdom', // Default to UK
      is_verified: false // Default to unverified
    }
    
    const result = await bookingService.createCustomerAddress(auth!.profile.id as string, addressData)

    if (!result.success) {
      return ApiResponseHandler.error(
        result.error?.message || 'Failed to create address',
        'CREATE_ADDRESS_FAILED'
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create customer address error:', error)
    return ApiResponseHandler.serverError('Failed to create address')
  }
}