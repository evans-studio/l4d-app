import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/config/environment'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    logger.error('Auth callback error', new Error(error), errorDescription ? { description: errorDescription } : undefined)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // Handle missing code parameter
  if (!code) {
    logger.error('Auth callback missing code parameter')
    return NextResponse.redirect(
      new URL('/auth/login?error=missing_code', request.url)
    )
  }

  try {
    const response = NextResponse.redirect(new URL(next, request.url))
    const supabase = createClient(request, response)
    
    // Exchange the code for a session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (authError) {
      logger.error('Auth callback exchange error', authError)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(authError.message)}`, request.url)
      )
    }

    if (!authData?.user) {
      logger.error('Auth callback: No user returned after exchange')
      return NextResponse.redirect(
        new URL('/auth/login?error=no_user', request.url)
      )
    }

    // Determine role based on configured admin emails
    const userRole = env.auth.adminEmails.includes((authData.user.email || '').toLowerCase())
      ? (authData.user.email?.toLowerCase() === 'paul@evans-studio.co.uk' ? 'super_admin' : 'admin')
      : 'customer'

    // Check if user has a profile, create one if needed
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist - this shouldn't happen if the trigger is working
      // But let's try to create one as fallback
      logger.debug('Profile not found, creating manually for user', { email: authData.user.email })
      
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          first_name: authData.user.user_metadata?.first_name || '',
          last_name: authData.user.user_metadata?.last_name || '',
          role: userRole,
          is_active: true
        })

      if (createProfileError) {
        logger.error('Failed to create user profile manually', createProfileError)
        
        // If it's a duplicate key error, the trigger probably worked
        if (createProfileError.code === '23505') {
          logger.debug('Profile already exists (created by trigger), continuing...')
        } else {
          logger.error('Profile creation failed with error', createProfileError)
          // Continue anyway - user can still access basic features
        }
      }
    } else if (profileError) {
      logger.error('Error checking user profile', profileError)
      // Continue anyway - user can still access the app
    }

    // If we have an existing profile but wrong role, update it for admin users
    if (profile && ['admin', 'super_admin'].includes(userRole) && profile.role !== userRole) {
      logger.debug(`Updating role for ${authData.user.email} from ${profile.role} to ${userRole}`)
      await supabase
        .from('user_profiles')
        .update({ role: userRole })
        .eq('id', authData.user.id)
    }

    logger.debug(`Auth callback successful for user ${authData.user.email}`)
    
    // If no specific redirect was requested, redirect admin users to admin dashboard
    if (next === '/dashboard') {
      // Check if user has admin role (from existing profile or newly created one)
      const finalProfile = profile || { role: userRole }
      if (finalProfile?.role === 'admin' || finalProfile?.role === 'super_admin') {
        next = '/admin'
      }
    }
    
    // Update response with correct redirect
    const finalResponse = NextResponse.redirect(new URL(next, request.url))
    
    // Copy cookies from original response
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return finalResponse

  } catch (error) {
    logger.error('Auth callback unexpected error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=callback_failed', request.url)
    )
  }
}