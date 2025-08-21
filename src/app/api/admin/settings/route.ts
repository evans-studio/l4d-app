import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'

interface BusinessSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  cancellationPolicy: string
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Love 4 Detailing',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  cancellationPolicy: '24 hours notice required for cancellations. Full refund available within policy.'
}

export async function GET(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    // Use admin client for settings access
    const supabase = supabaseAdmin

    // Try to get settings from database
    const { data: settingsData, error } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Settings fetch error:', error)
      return ApiResponseHandler.serverError('Failed to fetch settings')
    }

    // If no settings exist, return defaults
    if (!settingsData) {
      return ApiResponseHandler.success(DEFAULT_SETTINGS)
    }

    // Parse JSON fields and return settings
    const settings: BusinessSettings = {
      businessName: settingsData.business_name || DEFAULT_SETTINGS.businessName,
      businessAddress: settingsData.business_address || DEFAULT_SETTINGS.businessAddress,
      businessPhone: settingsData.business_phone || DEFAULT_SETTINGS.businessPhone,
      businessEmail: settingsData.business_email || DEFAULT_SETTINGS.businessEmail,
      cancellationPolicy: settingsData.cancellation_policy || DEFAULT_SETTINGS.cancellationPolicy
    }

    return ApiResponseHandler.success(settings)

  } catch (error) {
    console.error('Settings GET error:', error)
    return ApiResponseHandler.serverError('Failed to fetch settings')
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Re-enable authentication for security
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error!
    }

    const settings: BusinessSettings = await request.json()

    // Validate required fields
    if (!settings.businessName) {
      return ApiResponseHandler.badRequest('Business name is required')
    }

    // Use admin client for settings access
    const supabase = supabaseAdmin

    // Prepare settings data for database
    const settingsData = {
      business_name: settings.businessName,
      business_address: settings.businessAddress,
      business_phone: settings.businessPhone,
      business_email: settings.businessEmail,
      cancellation_policy: settings.cancellationPolicy,
      updated_at: new Date().toISOString()
    }

    // Try to update existing settings first
    const { data: existingSettings } = await supabase
      .from('business_settings')
      .select('id')
      .single()

    let result

    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('business_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .select()
        .single()
    } else {
      // Insert new settings
      result = await supabase
        .from('business_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Settings save error:', result.error)
      return ApiResponseHandler.serverError('Failed to save settings')
    }

    return ApiResponseHandler.success(settings, 'Settings saved successfully')

  } catch (error) {
    console.error('Settings PUT error:', error)
    return ApiResponseHandler.serverError('Failed to save settings')
  }
}