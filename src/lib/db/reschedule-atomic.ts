import { SupabaseClient } from '@supabase/supabase-js'

export interface RescheduleBookingParams {
  bookingId: string
  rescheduleRequestId: string
  newDate: string
  newTime: string
  adminResponse?: string
}

export interface RescheduleBookingResult {
  success: boolean
  data?: {
    booking_id: string
    reschedule_request_id: string
    old_date: string
    old_time: string
    new_date: string
    new_time: string
    old_time_slot_id: string | null
    new_time_slot_id: string
    original_status?: string
  }
  error?: string
}

/**
 * Atomically reschedule a booking using the database function
 * This eliminates the dual update problem by performing all operations in a single transaction
 */
export async function rescheduleBookingAtomic(
  supabase: SupabaseClient,
  params: RescheduleBookingParams
): Promise<RescheduleBookingResult> {
  try {
    const { data, error } = await supabase.rpc('reschedule_booking_atomic', {
      p_booking_id: params.bookingId,
      p_reschedule_request_id: params.rescheduleRequestId,
      p_new_date: params.newDate,
      p_new_time: params.newTime,
      p_admin_response: params.adminResponse || 'Reschedule request approved'
    })

    if (error) {
      console.error('Database function error:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`
      }
    }

    // The function returns a JSON object with success flag
    const result = data as RescheduleBookingResult
    return result

  } catch (error) {
    console.error('Error calling reschedule_booking_atomic:', error)
    return {
      success: false,
      error: `Failed to reschedule booking: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Execute the SQL migration to create the atomic reschedule function and triggers
 * This should be run once in the database
 */
export async function setupRescheduleAtomicFunction(supabase: SupabaseClient): Promise<{ success: boolean; error?: string }> {
  try {
    // Read the SQL file content
    const fs = await import('fs')
    const path = await import('path')
    
    const sqlPath = path.join(process.cwd(), 'src/lib/db/reschedule-atomic.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('Error setting up atomic reschedule function:', error)
      return {
        success: false,
        error: `Failed to setup database function: ${error.message}`
      }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error reading SQL file or executing setup:', error)
    return {
      success: false,
      error: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}