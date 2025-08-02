import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get schema information for time_slots table
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'time_slots' 
          ORDER BY ordinal_position;
        `
      })

    if (error) {
      // Fallback: try to select from time_slots with limit 0 to get column info
      const { data: sampleData, error: sampleError } = await supabase
        .from('time_slots')
        .select('*')
        .limit(1)

      if (sampleError) {
        return ApiResponseHandler.error('Failed to get schema info: ' + sampleError.message)
      }

      // Get column names from the sample data
      const columns = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : []
      
      return ApiResponseHandler.success({
        table: 'time_slots',
        columns: columns,
        sample_record: sampleData?.[0] || null,
        note: 'Schema info from sample record (could not access information_schema)'
      })
    }

    return ApiResponseHandler.success({
      table: 'time_slots',
      schema: data,
      note: 'Schema info from information_schema'
    })

  } catch (error) {
    return ApiResponseHandler.serverError('Failed to get schema information')
  }
}