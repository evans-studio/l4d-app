import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { z } from 'zod'

// Time slot template types
export interface TimeSlotTemplate {
  id: string
  name: string
  description: string
  slots: Array<{
    start_time: string
    duration_minutes: number
  }>
}

const timeSlotTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  slots: z.array(z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    duration_minutes: z.number().min(30).max(480)
  })).min(1)
})

const templatesArraySchema = z.array(timeSlotTemplateSchema)

// Default templates to fall back to if database is empty
const DEFAULT_TEMPLATES: TimeSlotTemplate[] = [
  {
    id: "default",
    name: "Default Schedule",
    description: "Standard 5-slot daily schedule",
    slots: [
      { start_time: "10:00", duration_minutes: 90 },
      { start_time: "12:00", duration_minutes: 90 },
      { start_time: "14:00", duration_minutes: 90 },
      { start_time: "16:00", duration_minutes: 90 },
      { start_time: "18:00", duration_minutes: 90 }
    ]
  },
  {
    id: "weekdays_9to5",
    name: "Weekdays 9-5",
    description: "Business hours schedule for weekdays",
    slots: [
      { start_time: "09:00", duration_minutes: 120 },
      { start_time: "11:30", duration_minutes: 120 },
      { start_time: "14:00", duration_minutes: 120 },
      { start_time: "16:30", duration_minutes: 90 }
    ]
  },
  {
    id: "weekends_only",
    name: "Weekends Only",
    description: "Extended slots for weekend services",
    slots: [
      { start_time: "08:00", duration_minutes: 150 },
      { start_time: "11:00", duration_minutes: 150 },
      { start_time: "14:00", duration_minutes: 150 },
      { start_time: "17:00", duration_minutes: 120 }
    ]
  },
  {
    id: "full_week",
    name: "Full Week",
    description: "Consistent schedule for all days",
    slots: [
      { start_time: "09:00", duration_minutes: 120 },
      { start_time: "12:00", duration_minutes: 120 },
      { start_time: "15:00", duration_minutes: 120 }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.unauthorized('User profile not found')
    }

    // Check admin permissions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Get templates from database
    const { data: settingData, error: settingError } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'time_slot_templates')
      .single()

    if (settingError && settingError.code !== 'PGRST116') {
      return ApiResponseHandler.serverError('Failed to fetch time slot templates')
    }

    // Parse templates or use defaults
    let templates: TimeSlotTemplate[]
    if (settingData?.setting_value) {
      try {
        const parsedTemplates = JSON.parse(settingData.setting_value as string)
        templates = templatesArraySchema.parse(parsedTemplates)
      } catch (parseError) {
        // If parsing fails, use defaults
        templates = DEFAULT_TEMPLATES
      }
    } else {
      templates = DEFAULT_TEMPLATES
    }

    return ApiResponseHandler.success(templates)

  } catch (error) {
    return ApiResponseHandler.serverError('Failed to fetch time slot templates')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return ApiResponseHandler.unauthorized('User profile not found')
    }

    // Check admin permissions
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    const body = await request.json()
    
    // Validate the templates array
    const validatedTemplates = templatesArraySchema.parse(body.templates)

    // Check for duplicate IDs
    const ids = validatedTemplates.map(t => t.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      return ApiResponseHandler.badRequest('Template IDs must be unique')
    }

    // Update the setting in database
    const { error: updateError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'time_slot_templates',
        setting_value: JSON.stringify(validatedTemplates),
        description: 'Time slot templates for bulk schedule creation',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })

    if (updateError) {
      return ApiResponseHandler.serverError('Failed to save time slot templates')
    }

    return ApiResponseHandler.success(validatedTemplates, 'Templates saved successfully')

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.badRequest('Invalid template data', error.issues)
    }
    
    return ApiResponseHandler.serverError('Failed to save time slot templates')
  }
}