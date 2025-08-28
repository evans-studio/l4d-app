import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // First get the auth user for email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError || !authUser.user) {
      logger.error('Error fetching auth user:', authError)
      return null
    }

    // Then get the profile information
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile:', profileError)
      // Return basic info from auth user if profile doesn't exist
      return {
        id: authUser.user.id,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.full_name,
        first_name: authUser.user.user_metadata?.first_name,
        last_name: authUser.user.user_metadata?.last_name,
        created_at: authUser.user.created_at
      }
    }

    return {
      id: profile.id,
      email: authUser.user.email || '',
      full_name: profile.full_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      created_at: profile.created_at
    }
  } catch (error) {
    logger.error('Error in getUserProfile:', error)
    return null
  }
}

export function getDisplayName(userProfile: UserProfile): string {
  if (userProfile.full_name) {
    return userProfile.full_name
  }
  
  if (userProfile.first_name && userProfile.last_name) {
    return `${userProfile.first_name} ${userProfile.last_name}`
  }
  
  if (userProfile.first_name) {
    return userProfile.first_name
  }
  
  // Fallback to email prefix
  return userProfile.email.split('@')[0] || 'Customer'
}