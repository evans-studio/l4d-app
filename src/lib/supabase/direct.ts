import { createClient } from '@supabase/supabase-js'

// Direct database connection for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for direct access')
}

// Create admin client with service role key for direct database access  
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Direct database access functions
export class DatabaseAdmin {
  
  /**
   * Clean up all user data and auth accounts
   */
  static async cleanupAllUsers() {
    try {
      // Clean up enterprise auth tables first
      const cleanupTables = [
        'user_sessions',
        'refresh_token_usage', 
        'security_events',
        'rate_limits'
      ]

      const results = {
        tablesCleared: [] as string[],
        usersDeleted: 0,
        errors: [] as string[]
      }

      // Clean database tables
      for (const table of cleanupTables) {
        try {
          const { error } = await supabaseAdmin
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

      // Delete user profiles
      try {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .delete()
          .neq('id', 'impossible-id')

        if (profileError) {
          results.errors.push(`user_profiles: ${profileError.message}`)
        } else {
          results.tablesCleared.push('user_profiles')
        }
      } catch (err) {
        results.errors.push(`user_profiles: ${String(err)}`)
      }

      // Delete all users from Supabase Auth
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          results.errors.push(`List users: ${listError.message}`)
        } else {
          for (const user of users) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
            
            if (deleteError) {
              results.errors.push(`Delete user ${user.email}: ${deleteError.message}`)
            } else {
              results.usersDeleted++
            }
          }
        }
      } catch (err) {
        results.errors.push(`Auth cleanup: ${String(err)}`)
      }

      return results

    } catch (error) {
      throw new Error(`Database cleanup failed: ${String(error)}`)
    }
  }

  /**
   * Get all users from database
   */
  static async getAllUsers() {
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')

      return {
        authUsers: authError ? [] : authUsers.users,
        profiles: profileError ? [] : profiles,
        authError: authError?.message || null,
        profileError: profileError?.message || null
      }

    } catch (error) {
      throw new Error(`Failed to get users: ${String(error)}`)
    }
  }

  /**
   * Get session information
   */
  static async getSessionInfo() {
    try {
      const { data: sessions, error: sessionError } = await supabaseAdmin
        .from('user_sessions')
        .select('*')

      const { data: events, error: eventError } = await supabaseAdmin
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        sessions: sessionError ? [] : sessions,
        recentEvents: eventError ? [] : events,
        sessionError: sessionError?.message || null,
        eventError: eventError?.message || null
      }

    } catch (error) {
      throw new Error(`Failed to get session info: ${String(error)}`)
    }
  }

  /**
   * Test database connectivity
   */
  static async testConnection() {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('count')
        .limit(1)

      return {
        connected: !error,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      return {
        connected: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }
  }
}