import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/auth/session-manager'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'No user profile found for testing'
      })
    }

    // Check if tables exist
    const tableChecks = {
      user_sessions: false,
      refresh_token_usage: false,
      security_events: false,
      rate_limits: false
    }

    // Test each table
    for (const tableName of Object.keys(tableChecks)) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        tableChecks[tableName as keyof typeof tableChecks] = !error
      } catch (error) {
        console.error(`Table ${tableName} check failed:`, error)
      }
    }

    // Try to create a test session
    let sessionError = null
    let sessionSuccess = false
    
    try {
      const testUser = {
        id: profile.id,
        email: profile.email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any

      const result = await SessionManager.createSession(testUser, {
        rememberMe: false,
        deviceInfo: {
          fingerprint: 'test-fingerprint',
          userAgent: 'test-agent',
          platform: 'test-platform',
          browser: 'test-browser',
          isMobile: false
        }
      })
      
      sessionSuccess = !!result
      
      // Clean up test session
      if (result?.session?.id) {
        await SessionManager.revokeSession(result.session.id, 'test_cleanup')
      }
      
    } catch (error) {
      sessionError = String(error)
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          email: profile.email,
          role: profile.role
        },
        tables: tableChecks,
        sessionTest: {
          success: sessionSuccess,
          error: sessionError
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'TEST_ERROR'
      }
    }, { status: 500 })
  }
}