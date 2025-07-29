import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return Response.json({
        success: false,
        error: { message: 'Email is required' }
      }, { status: 400 })
    }

    // Check if this email should be admin
    const shouldBeAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
    const targetRole = shouldBeAdmin ? 'admin' : 'customer'

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return Response.json({
        success: false,
        error: { message: 'User not found' }
      }, { status: 404 })
    }

    // Update user role
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: targetRole })
      .eq('id', user.id)

    if (updateError) {
      console.error('Role update error:', updateError)
      return Response.json({
        success: false,
        error: { message: 'Failed to update user role' }
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      data: {
        message: `User role updated to ${targetRole}`,
        userId: user.id,
        email: user.email,
        oldRole: user.role,
        newRole: targetRole
      }
    })

  } catch (error) {
    console.error('Upgrade role error:', error)
    return Response.json({
      success: false,
      error: { message: 'Internal server error' }
    }, { status: 500 })
  }
}