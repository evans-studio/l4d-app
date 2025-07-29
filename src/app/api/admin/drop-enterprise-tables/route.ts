import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

export async function POST() {
  try {
    // List of enterprise auth tables to drop
    const tablesToDrop = [
      'user_sessions',
      'refresh_token_usage', 
      'auth_failures',
      'security_events',
      'rate_limits'
    ]

    const results = {
      tablesDropped: [] as string[],
      errors: [] as string[]
    }

    // Drop each table
    for (const table of tablesToDrop) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `DROP TABLE IF EXISTS public.${table} CASCADE;`
        })

        if (error) {
          // Try alternative approach with direct SQL
          const { error: directError } = await supabaseAdmin
            .from(table)
            .select('count')
            .limit(0)
          
          if (directError && !directError.message.includes('does not exist')) {
            results.errors.push(`${table}: ${error.message}`)
          } else {
            // Table doesn't exist, that's fine
            results.tablesDropped.push(table)
          }
        } else {
          results.tablesDropped.push(table)
        }
      } catch (err) {
        results.errors.push(`${table}: ${String(err)}`)
      }
    }

    // Also drop functions
    const functionsToDelete = [
      'cleanup_expired_sessions()',
      'revoke_user_sessions(uuid, text)',
      'check_rate_limit(text, text, integer, integer)'
    ]

    for (const func of functionsToDelete) {
      try {
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DROP FUNCTION IF EXISTS public.${func};`
        })
      } catch (err) {
        // Ignore function drop errors
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Enterprise auth tables cleanup completed',
      data: results
    })

  } catch (error) {
    console.error('Database cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: 'Database cleanup failed',
        details: String(error)
      }
    }, { status: 500 })
  }
}