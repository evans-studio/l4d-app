import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== Server-side login test ===')
    console.log('Email:', email)
    console.log('Environment:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
    
    // Create proper server client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const startTime = Date.now()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    const duration = Date.now() - startTime
    console.log('Login attempt took:', duration + 'ms')
    
    if (error) {
      console.log('Login error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        duration
      })
    }
    
    console.log('Login successful:', {
      userId: data.user?.id,
      email: data.user?.email
    })
    
    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
      duration
    })
    
  } catch (error) {
    console.error('Server login test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}