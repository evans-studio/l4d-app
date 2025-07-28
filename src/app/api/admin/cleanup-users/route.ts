import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get admin client with service role key for user management
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Clean up enterprise auth tables first
    const cleanupTables = [
      'user_sessions',
      'refresh_token_usage', 
      'security_events',
      'rate_limits'
    ]

    for (const table of cleanupTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 'impossible-id') // Delete all rows
      
      if (error) {
        console.warn(`Warning cleaning ${table}:`, error)
      }
    }

    // Delete user profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', 'impossible-id') // Delete all rows

    if (profileError) {
      console.warn('Warning cleaning user_profiles:', profileError)
    }

    // Get all users from Supabase Auth and delete them
    const { data: { users }, error: listError } = await serviceSupabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    const deletionResults = []
    for (const user of users) {
      const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id)
      
      deletionResults.push({
        userId: user.id,
        email: user.email,
        success: !deleteError,
        error: deleteError?.message || null
      })
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed`,
      data: {
        totalUsers: users.length,
        deletionResults,
        tablesCleared: ['user_profiles', ...cleanupTables]
      }
    })

  } catch (error) {
    console.error('User cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'CLEANUP_ERROR'
      }
    }, { status: 500 })
  }
}