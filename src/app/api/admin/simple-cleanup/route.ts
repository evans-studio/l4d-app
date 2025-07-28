import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Clean up enterprise auth tables first
    const cleanupTables = [
      'user_sessions',
      'refresh_token_usage', 
      'security_events',
      'rate_limits'
    ]

    const results: any = {
      tablesCleared: [],
      errors: []
    }

    for (const table of cleanupTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'impossible-id') // Delete all rows
        
        if (error) {
          results.errors.push(`${table}: ${error.message}`)
        } else {
          results.tablesCleared.push(table)
        }
      } catch (err) {
        results.errors.push(`${table}: ${String(err)}`)
      }
    }

    // Delete user profiles (this will cascade to related data)
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .neq('id', 'impossible-id') // Delete all rows

      if (profileError) {
        results.errors.push(`user_profiles: ${profileError.message}`)
      } else {
        results.tablesCleared.push('user_profiles')
      }
    } catch (err) {
      results.errors.push(`user_profiles: ${String(err)}`)
    }

    return NextResponse.json({
      success: true,
      message: `Database cleanup completed`,
      data: results,
      note: "User accounts in Supabase Auth will remain but profiles are cleared. They'll be recreated on next signup."
    })

  } catch (error) {
    console.error('Simple cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'CLEANUP_ERROR'
      }
    }, { status: 500 })
  }
}