import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const notificationSettingsSchema = z.object({
  bookingConfirmations: z.boolean(),
  bookingReminders: z.boolean(),
  promotionalEmails: z.boolean(),
  smsNotifications: z.boolean(),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = notificationSettingsSchema.parse(body)

    // Check if notification settings record exists
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const settingsData = {
      user_id: session.user.id,
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
        .eq('user_id', session.user.id)

      if (updateError) {
        logger.error('Notification settings update error', updateError instanceof Error ? updateError : undefined)
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
        logger.error('Notification settings create error', insertError instanceof Error ? insertError : undefined)
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
    logger.error('Notification settings error', error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return ApiResponseHandler.validationError(firstError?.message || 'Validation error')
    }

    return ApiResponseHandler.serverError('Failed to update notification settings')
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get notification settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', session.user.id)
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
    logger.error('Notification settings fetch error', error instanceof Error ? error : undefined)
    return ApiResponseHandler.serverError('Failed to fetch notification settings')
  }
}