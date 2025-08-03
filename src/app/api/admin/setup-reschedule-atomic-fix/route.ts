import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    // Updated SQL function with proper enum handling
    const updatedSQLFunction = `
-- Atomic reschedule booking function (UPDATED with enum fix)
-- This function handles all reschedule operations in a single transaction
-- to eliminate the dual update problem

CREATE OR REPLACE FUNCTION reschedule_booking_atomic(
  p_booking_id UUID,
  p_reschedule_request_id UUID,
  p_new_date TEXT,
  p_new_time TEXT,
  p_admin_response TEXT DEFAULT 'Reschedule request approved'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking RECORD;
  v_reschedule_request RECORD;
  v_new_time_slot RECORD;
  v_old_time_slot_id UUID;
  v_result JSON;
BEGIN
  -- Start transaction (implicit in function)
  
  -- 1. Verify reschedule request exists and is pending
  SELECT * INTO v_reschedule_request
  FROM booking_reschedule_requests
  WHERE id = p_reschedule_request_id
    AND booking_id = p_booking_id
    AND status = 'pending'
  FOR UPDATE; -- Lock the row to prevent concurrent modifications
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reschedule request not found or already processed'
    );
  END IF;
  
  -- 2. Get current booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE; -- Lock the booking row
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;
  
  -- 3. Verify booking can be rescheduled
  IF v_booking.status IN ('cancelled', 'completed', 'declined') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot reschedule booking with status: ' || v_booking.status
    );
  END IF;
  
  -- 4. Find and lock the new time slot
  SELECT * INTO v_new_time_slot
  FROM time_slots
  WHERE slot_date = p_new_date::date
    AND start_time = p_new_time::time
    AND is_available = true
  FOR UPDATE; -- Lock to prevent race conditions
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Selected time slot is not available or does not exist'
    );
  END IF;
  
  -- Store old time slot ID for cleanup
  v_old_time_slot_id := v_booking.time_slot_id;
  
  -- 5. Perform all updates atomically
  
  -- Update reschedule request status
  UPDATE booking_reschedule_requests
  SET 
    status = 'approved',
    admin_response = p_admin_response,
    updated_at = NOW()
  WHERE id = p_reschedule_request_id;
  
  -- Update booking with new details
  UPDATE bookings
  SET 
    scheduled_date = p_new_date::date,
    scheduled_start_time = p_new_time::time,
    status = 'rescheduled',
    time_slot_id = v_new_time_slot.id,
    updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Mark new time slot as unavailable and link to booking (FIXED: use 'confirmed' instead of 'rescheduled')
  UPDATE time_slots
  SET 
    is_available = false,
    booking_reference = v_booking.booking_reference,
    booking_status = 'confirmed'
  WHERE id = v_new_time_slot.id;
  
  -- Free up old time slot if it exists
  IF v_old_time_slot_id IS NOT NULL THEN
    UPDATE time_slots
    SET 
      is_available = true,
      booking_reference = NULL,
      booking_status = NULL
    WHERE id = v_old_time_slot_id;
  END IF;
  
  -- Add to booking history
  INSERT INTO booking_status_history (
    booking_id,
    from_status,
    to_status,
    changed_by,
    reason,
    notes,
    created_at
  ) VALUES (
    p_booking_id,
    v_booking.status,
    'rescheduled',
    NULL, -- TODO: Pass admin_id parameter
    'Reschedule request approved by admin',
    format('Reschedule request approved%sRescheduled from %s %s to %s %s%s',
      chr(10),
      v_booking.scheduled_date,
      v_booking.scheduled_start_time,
      p_new_date,
      p_new_time,
      CASE WHEN v_reschedule_request.reason IS NOT NULL 
           THEN chr(10) || 'Customer reason: ' || v_reschedule_request.reason
           ELSE '' END
    ),
    NOW()
  );
  
  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'booking_id', p_booking_id,
      'reschedule_request_id', p_reschedule_request_id,
      'old_date', v_booking.scheduled_date,
      'old_time', v_booking.scheduled_start_time,
      'new_date', p_new_date,
      'new_time', p_new_time,
      'old_time_slot_id', v_old_time_slot_id,
      'new_time_slot_id', v_new_time_slot.id
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;
    `

    const updatedTriggerFunction = `
-- Create trigger function to maintain time_slots consistency (UPDATED with enum fix)
-- This ensures any direct updates to bookings.time_slot_id also update time_slots
CREATE OR REPLACE FUNCTION sync_time_slot_booking_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle time_slot_id changes
  IF OLD.time_slot_id IS DISTINCT FROM NEW.time_slot_id THEN
    
    -- Clear old slot if it exists
    IF OLD.time_slot_id IS NOT NULL THEN
      UPDATE time_slots 
      SET 
        booking_reference = NULL,
        booking_status = NULL,
        is_available = true
      WHERE id = OLD.time_slot_id;
    END IF;
    
    -- Update new slot if it exists (FIXED: map booking status to time slot enum values)
    IF NEW.time_slot_id IS NOT NULL THEN
      UPDATE time_slots 
      SET 
        booking_reference = NEW.booking_reference,
        booking_status = CASE 
          WHEN NEW.status IN ('pending', 'confirmed', 'rescheduled', 'in_progress') THEN 'confirmed'
          WHEN NEW.status = 'completed' THEN 'completed'
          ELSE 'cancelled'
        END,
        is_available = false
      WHERE id = NEW.time_slot_id;
    END IF;
    
  -- Handle status changes without time_slot_id change (FIXED: map booking status to time slot enum values)
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.time_slot_id IS NOT NULL THEN
    UPDATE time_slots 
    SET booking_status = CASE 
      WHEN NEW.status IN ('pending', 'confirmed', 'rescheduled', 'in_progress') THEN 'confirmed'
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE 'cancelled'
    END
    WHERE id = NEW.time_slot_id;
    
  -- Handle booking_reference changes without time_slot_id change  
  ELSIF OLD.booking_reference IS DISTINCT FROM NEW.booking_reference AND NEW.time_slot_id IS NOT NULL THEN
    UPDATE time_slots 
    SET booking_reference = NEW.booking_reference
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$$;
    `

    // Execute the updated function
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: updatedSQLFunction 
    })
    
    if (functionError) {
      console.error('Error updating reschedule function:', functionError)
      return ApiResponseHandler.serverError(`Failed to update function: ${functionError.message}`)
    }

    // Execute the updated trigger function
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: updatedTriggerFunction 
    })
    
    if (triggerError) {
      console.error('Error updating trigger function:', triggerError)
      return ApiResponseHandler.serverError(`Failed to update trigger: ${triggerError.message}`)
    }

    return ApiResponseHandler.success({
      message: 'Reschedule atomic function updated successfully with enum fixes'
    })

  } catch (error) {
    console.error('Setup reschedule atomic fix error:', error)
    return ApiResponseHandler.serverError('Failed to update reschedule function')
  }
}