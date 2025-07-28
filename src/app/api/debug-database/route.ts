import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    // Check if user_profiles table exists and structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'user_profiles' })
      .single()
    
    // If that fails, try a direct query to check table existence
    let profilesTableExists = false
    let profilesStructure = null
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(0)
      
      profilesTableExists = !error
      if (error) {
        console.log('Profiles table check error:', error)
      }
    } catch (e) {
      console.log('Profiles table does not exist')
    }

    // Check for existing users
    const { data: existingUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(5)

    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        profilesTableExists,
        profilesTableError: tableError?.message || null,
        existingUsers: existingUsers || [],
        usersError: usersError?.message || null,
        authUsersCount: authUsers.data?.users?.length || 0,
        authError: authError?.message || null
      },
      environment: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}