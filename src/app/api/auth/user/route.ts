import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for server-side auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {
            // Not used in GET request
          },
          remove() {
            // Not used in GET request  
          },
        },
      }
    )

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: false,
          user: null
        }
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, phone, role, is_active, email_verified')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      logger.error('Profile fetch error', profileError instanceof Error ? profileError : undefined)
      return NextResponse.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.first_name || null,
            last_name: session.user.user_metadata?.last_name || null,
            role: 'customer'
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          role: profile.role,
          email_verified: profile.email_verified ?? true // Default to true if field doesn't exist
        }
      }
    })

  } catch (error) {
    logger.error('User fetch error', error instanceof Error ? error : undefined)
    return NextResponse.json({
      success: true,
      data: {
        authenticated: false,
        user: null
      }
    })
  }
}