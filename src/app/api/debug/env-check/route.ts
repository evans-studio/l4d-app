import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseServiceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      supabaseServiceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30) + '...',
      accessTokenSecret: !!process.env.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: !!process.env.REFRESH_TOKEN_SECRET,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || 
        key.includes('TOKEN_SECRET') ||
        key.includes('VERCEL') ||
        key.includes('NODE')
      ).sort()
    }

    return NextResponse.json({
      success: true,
      data: envCheck
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'ENV_CHECK_ERROR'
      }
    }, { status: 500 })
  }
}