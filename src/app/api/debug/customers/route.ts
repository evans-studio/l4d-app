import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service client that bypasses RLS
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Testing customer queries')

    // Test: Get all user profiles
    const { data: allProfiles, error: allError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Debug: All profiles result:', { data: allProfiles, error: allError })

    // Test: Get only customer profiles (like the API does)
    const { data: customerProfiles, error: customerError } = await supabaseService
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        role
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false })

    console.log('Debug: Customer profiles result:', { data: customerProfiles, error: customerError })

    // Test: Check specific customer
    const { data: specificCustomer, error: specificError } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('email', 'test@example.com')
      .single()

    console.log('Debug: Specific customer result:', { data: specificCustomer, error: specificError })

    return NextResponse.json({
      success: true,
      data: {
        allProfiles,
        allError,
        customerProfiles,
        customerError,
        specificCustomer,
        specificError,
        totalProfiles: allProfiles?.length || 0,
        totalCustomers: customerProfiles?.length || 0
      }
    })

  } catch (error) {
    console.error('Debug customers endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: { message: 'Debug endpoint failed' }
    }, { status: 500 })
  }
}