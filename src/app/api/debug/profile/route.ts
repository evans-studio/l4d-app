import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'd74fb841-0b8a-4f6c-8448-06620d5ffe62'

    console.log('Debug: Testing service role access')
    console.log('Debug: Supabase URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('Debug: Service key exists:', !!supabaseServiceKey)
    console.log('Debug: Service key length:', supabaseServiceKey?.length)
    console.log('Debug: Querying for user ID:', userId)

    // Test basic query
    const { data: allProfiles, error: allError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .limit(5)

    console.log('Debug: All profiles query result:', { data: allProfiles, error: allError })

    // Test specific user query
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Debug: Specific profile query result:', { data: profile, error: profileError })

    return NextResponse.json({
      success: true,
      data: {
        userId,
        profile,
        profileError,
        allProfiles,
        allError,
        serviceKeyExists: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey?.length
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Debug endpoint failed' }
    }, { status: 500 })
  }
}