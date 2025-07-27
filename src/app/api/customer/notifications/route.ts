import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

const notificationSettingsSchema = z.object({
  bookingConfirmations: z.boolean(),
  bookingReminders: z.boolean(),
  promotionalEmails: z.boolean(),
  smsNotifications: z.boolean(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    // Check if notification settings record exists
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const settingsData = {
      user_id: user.id,
      booking_confirmations: validatedData.bookingConfirmations,
      booking_reminders: validatedData.bookingReminders,
      promotional_emails: validatedData.promotionalEmails,
      sms_notifications: validatedData.smsNotifications,
      updated_at: new Date().toISOString()
    }

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('user_notification_settings')
        .update(settingsData)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Notification settings update error:', updateError)
        return ApiResponseHandler.serverError('Failed to update notification settings')
      }
    } else {
      // Create new settings record
      const { error: insertError } = await supabase
        .from('user_notification_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Notification settings create error:', insertError)
        return ApiResponseHandler.serverError('Failed to save notification settings')
      }
    }

    return ApiResponseHandler.success({
      settings: {
        bookingConfirmations: validatedData.bookingConfirmations,
        bookingReminders: validatedData.bookingReminders,
        promotionalEmails: validatedData.promotionalEmails,
        smsNotifications: validatedData.smsNotifications
      },
      message: 'Notification settings updated successfully'
    })

  } catch (error) {
    console.error('Notification settings error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update notification settings')
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get notification settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Return default settings if none exist
    const defaultSettings = {
      bookingConfirmations: true,
      bookingReminders: true,
      promotionalEmails: false,
      smsNotifications: false
    }

    const notificationSettings = settings ? {
      bookingConfirmations: settings.booking_confirmations,
      bookingReminders: settings.booking_reminders,
      promotionalEmails: settings.promotional_emails,
      smsNotifications: settings.sms_notifications
    } : defaultSettings

    return ApiResponseHandler.success({
      settings: notificationSettings
    })

  } catch (error) {
    console.error('Notification settings fetch error:', error)
    return ApiResponseHandler.serverError('Failed to fetch notification settings')
  }
}