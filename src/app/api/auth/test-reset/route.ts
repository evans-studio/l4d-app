import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponseHandler } from '@/lib/api/response'
import { Resend } from 'resend'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const diagnostics = {
      environment: {
        resendApiKey: !!process.env.RESEND_API_KEY,
        resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
        fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.co.uk',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'
      },
      database: {
        canConnect: false,
        tableExists: false,
        error: null as string | null
      },
      email: {
        resendInitalized: false,
        error: null as string | null
      }
    }

    // Test database connection and table existence
    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('count')
        .limit(1)

      if (error) {
        diagnostics.database.error = error.message
        diagnostics.database.canConnect = error.code !== 'PGRST106' // PGRST106 = relation does not exist
        diagnostics.database.tableExists = false
      } else {
        diagnostics.database.canConnect = true
        diagnostics.database.tableExists = true
      }
    } catch (dbError: any) {
      diagnostics.database.error = dbError.message
    }

    // Test Resend initialization
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        diagnostics.email.resendInitalized = true
      } else {
        diagnostics.email.error = 'RESEND_API_KEY not set'
      }
    } catch (emailError: any) {
      diagnostics.email.error = emailError.message
    }

    return ApiResponseHandler.success(diagnostics)

  } catch (error) {
    console.error('Test reset diagnostics error:', error)
    return ApiResponseHandler.serverError('Failed to run diagnostics')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return ApiResponseHandler.validationError('Email is required')
    }

    console.log('=== TESTING EMAIL SEND ===')
    console.log('To:', email)
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0)

    if (!process.env.RESEND_API_KEY) {
      return ApiResponseHandler.error('RESEND_API_KEY not configured', 'MISSING_API_KEY', 500)
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test email
    const { data, error } = await resend.emails.send({
      from: `Love 4 Detailing <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.co.uk'}>`,
      to: [email],
      subject: 'Test Email - Love 4 Detailing',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the Resend integration is working.</p>
        <p>If you received this, the email system is functioning correctly.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      `,
      text: `Test Email - This is a test email sent at ${new Date().toISOString()}`
    })

    if (error) {
      console.error('Resend test error:', error)
      return ApiResponseHandler.error(`Email send failed: ${error.message}`, 'EMAIL_FAILED', 500)
    }

    console.log('✅ Test email sent successfully')
    console.log('Email ID:', data?.id)

    return ApiResponseHandler.success({
      message: 'Test email sent successfully',
      emailId: data?.id,
      recipient: email
    })

  } catch (error) {
    console.error('Test email error:', error)
    return ApiResponseHandler.serverError('Failed to send test email')
  }
}