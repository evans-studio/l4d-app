import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic Supabase connection
    const { data, error } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      message: 'Auth debug check',
      timestamp: new Date().toISOString(),
      supabase: {
        connected: !error,
        error: error?.message || null,
        hasSession: !!data.session,
        sessionUser: data.session?.user?.id || null,
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}