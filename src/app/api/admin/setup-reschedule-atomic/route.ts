import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'
import { authenticateAdmin } from '@/lib/api/auth-handler'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    const supabase = supabaseAdmin

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'src/lib/db/reschedule-atomic.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')

    // Split the SQL content into individual statements (rough split by semicolon)
    const statements = sqlContent
      .split(/;\s*$/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const results = []
    const errors = []

    // Execute each statement individually since Supabase doesn't support multi-statement queries
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        try {
          const { error } = await supabase.rpc('exec', { 
            sql_query: statement + ';' 
          })
          
          if (error) {
            errors.push({
              statement: i + 1,
              error: error.message,
              sql: statement.substring(0, 100) + '...'
            })
          } else {
            results.push({
              statement: i + 1,
              success: true
            })
          }
        } catch (execError) {
          errors.push({
            statement: i + 1,
            error: execError instanceof Error ? execError.message : 'Unknown error',
            sql: statement.substring(0, 100) + '...'
          })
        }
      }
    }

    if (errors.length > 0) {
      return ApiResponseHandler.error('Some database setup operations failed', 'SETUP_ERROR', 500, {
        errors,
        results,
        note: 'You may need to run the SQL manually in the Supabase SQL editor'
      })
    }

    return ApiResponseHandler.success({
      message: 'Atomic reschedule function and triggers setup successfully',
      results,
      functions_created: [
        'reschedule_booking_atomic()',
        'sync_time_slot_booking_data()',
        'cleanup_time_slot_on_booking_delete()'
      ],
      triggers_created: [
        'sync_time_slot_booking_data_trigger',
        'cleanup_time_slot_on_booking_delete_trigger'
      ]
    })

  } catch (error) {
    console.error('Setup reschedule atomic error:', error)
    return ApiResponseHandler.serverError(`Failed to setup atomic reschedule function: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Alternative GET endpoint to return the SQL for manual execution
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.error
    }

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'src/lib/db/reschedule-atomic.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')

    return new Response(sqlContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="reschedule-atomic.sql"'
      }
    })

  } catch (error) {
    console.error('Get SQL file error:', error)
    return ApiResponseHandler.serverError(`Failed to get SQL file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}