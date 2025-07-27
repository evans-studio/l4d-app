import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApiResponseHandler } from '@/lib/api/response'

// Force Node.js runtime
export const runtime = 'nodejs'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== USER CLEANUP OPERATION ===')
    
    // Get all auth users first
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return ApiResponseHandler.error('Failed to fetch users', 'FETCH_ERROR', 500)
    }

    console.log(`Found ${authUsers.users.length} auth users to delete`)

    let deletedCount = 0
    const errors = []

    // Delete each user from auth (this will cascade to user_profiles due to FK)
    for (const user of authUsers.users) {
      try {
        console.log(`Deleting user: ${user.email} (${user.id})`)
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`Failed to delete user ${user.email}:`, deleteError)
          errors.push(`${user.email}: ${deleteError.message}`)
        } else {
          deletedCount++
          console.log(`✅ Deleted user: ${user.email}`)
        }
      } catch (userError: any) {
        console.error(`Error deleting user ${user.email}:`, userError)
        errors.push(`${user.email}: ${userError.message}`)
      }
    }

    // Clean up any orphaned records in related tables
    try {
      console.log('Cleaning up related tables...')
      
      // Clean password reset tokens
      const { error: tokenError } = await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      
      if (tokenError) {
        console.log('Password reset tokens cleanup error:', tokenError)
      } else {
        console.log('✅ Cleaned password reset tokens')
      }

      // Clean any other user-related data as needed
      // Add more cleanup operations here if you have other tables
      
    } catch (cleanupError) {
      console.log('Related tables cleanup had issues:', cleanupError)
    }

    const result = {
      deletedUsers: deletedCount,
      totalFound: authUsers.users.length,
      errors: errors,
      message: `Successfully deleted ${deletedCount} out of ${authUsers.users.length} users`,
      nextSteps: [
        '1. Sign up evanspaul87@gmail.com as customer',
        '2. Sign up zell@love4detailing.com as admin',
        '3. Sign up paul@evans-studio.co.uk as super_admin'
      ]
    }

    console.log('=== CLEANUP COMPLETE ===')
    console.log('Result:', result)

    return ApiResponseHandler.success(result)

  } catch (error) {
    console.error('User cleanup error:', error)
    return ApiResponseHandler.serverError('Failed to cleanup users')
  }
}