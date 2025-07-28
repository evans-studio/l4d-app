import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // Handle missing code parameter
  if (!code) {
    console.error('Auth callback missing code parameter')
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
      console.error('Auth callback exchange error:', authError)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(authError.message)}`, request.url)
      )
    }

    if (!authData?.user) {
      console.error('Auth callback: No user returned after exchange')
      return NextResponse.redirect(
        new URL('/auth/login?error=no_user', request.url)
      )
    }

    // Determine role based on email address (for both existing and new profiles)
    const adminEmails = [
      'zell@love4detailing.com',
      'paul@evans-studio.co.uk'
    ]
    
    const userRole = adminEmails.includes(authData.user.email!)
      ? (authData.user.email === 'paul@evans-studio.co.uk' ? 'super_admin' : 'admin')
      : 'customer'

    // Check if user has a profile, create one if needed
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          first_name: authData.user.user_metadata?.first_name || '',
          last_name: authData.user.user_metadata?.last_name || '',
          role: userRole,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createProfileError) {
        console.error('Failed to create user profile:', createProfileError)
        // Continue anyway - user can still access the app
      }
    } else if (profileError) {
      console.error('Error checking user profile:', profileError)
      // Continue anyway - user can still access the app
    }

    console.log(`Auth callback successful for user ${authData.user.email}`)
    
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
    console.error('Auth callback unexpected error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=callback_failed', request.url)
    )
  }
}