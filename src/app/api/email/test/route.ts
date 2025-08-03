import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== EMAIL SERVICE HEALTH CHECK ===')
    
    // Check environment variables
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL
    
    console.log('RESEND_API_KEY exists:', !!resendApiKey)
    console.log('RESEND_API_KEY length:', resendApiKey?.length || 0)
    console.log('FROM_EMAIL:', fromEmail)
    
    if (!resendApiKey) {
      return ApiResponseHandler.error(
        'RESEND_API_KEY environment variable not configured',
        'MISSING_CONFIG',
        500
      )
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey)
    
    // Test API key validity by trying to list domains
    try {
      console.log('Testing Resend API key...')
      const { data: domains, error: domainError } = await resend.domains.list()
      
      if (domainError) {
        console.error('Resend domain list error:', domainError)
        return ApiResponseHandler.error(
          `Resend API key invalid: ${domainError.message}`,
          'INVALID_API_KEY',
          500
        )
      }
      
      console.log('Available domains:', domains)
      
      // Check if sender domain is verified
      const senderDomain = fromEmail?.split('@')[1]
      const domainsList = Array.isArray(domains?.data) ? domains.data : (Array.isArray(domains) ? domains : [])
      const verifiedDomain = domainsList.find((d: any) => d.name === senderDomain)
      
      console.log('Sender domain:', senderDomain)
      console.log('Domain verified:', !!verifiedDomain)
      
      return ApiResponseHandler.success({
        resendApiKey: {
          configured: true,
          valid: true,
          keyLength: resendApiKey.length
        },
        senderEmail: {
          configured: !!fromEmail,
          email: fromEmail,
          domain: senderDomain,
          domainVerified: !!verifiedDomain
        },
        domains: domainsList || [],
        message: verifiedDomain 
          ? 'Email service fully configured and ready'
          : `Warning: Domain ${senderDomain} may not be verified in Resend`
      })
      
    } catch (apiError) {
      console.error('Resend API test failed:', apiError)
      return ApiResponseHandler.error(
        `Resend API test failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        'API_TEST_FAILED',
        500
      )
    }
    
  } catch (error) {
    console.error('Email health check error:', error)
    return ApiResponseHandler.serverError('Email health check failed')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return ApiResponseHandler.error('testEmail is required', 'MISSING_EMAIL', 400)
    }
    
    console.log('=== SENDING TEST EMAIL ===')
    console.log('Test email to:', testEmail)
    
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com'
    
    if (!resendApiKey) {
      return ApiResponseHandler.error('RESEND_API_KEY not configured', 'MISSING_CONFIG', 500)
    }
    
    const resend = new Resend(resendApiKey)
    
    const { data, error } = await resend.emails.send({
      from: `Love4Detailing Test <${fromEmail}>`,
      to: [testEmail],
      subject: 'Email Service Test - Love4Detailing',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; color: white; border-radius: 8px;">
            <h1 style="margin: 0;">Love4Detailing</h1>
            <p style="margin: 10px 0 0 0;">Email Service Test</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">✅ Email Service Working!</h2>
            <p style="color: #666; line-height: 1.6;">
              This is a test email to verify that the Love4Detailing email service is configured correctly.
            </p>
            <p style="color: #666; line-height: 1.6;">
              <strong>Sent at:</strong> ${new Date().toISOString()}<br>
              <strong>From:</strong> ${fromEmail}<br>
              <strong>Service:</strong> Resend API
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            Love4Detailing - Professional Mobile Car Detailing
          </div>
        </body>
        </html>
      `,
      text: `
        Love4Detailing - Email Service Test
        
        ✅ Email Service Working!
        
        This is a test email to verify that the Love4Detailing email service is configured correctly.
        
        Sent at: ${new Date().toISOString()}
        From: ${fromEmail}
        Service: Resend API
        
        Love4Detailing - Professional Mobile Car Detailing
      `
    })
    
    if (error) {
      console.error('Test email send error:', error)
      return ApiResponseHandler.error(
        `Failed to send test email: ${error.message}`,
        'EMAIL_SEND_FAILED',
        500
      )
    }
    
    console.log('✅ Test email sent successfully!')
    console.log('Email ID:', data?.id)
    
    return ApiResponseHandler.success({
      message: 'Test email sent successfully',
      emailId: data?.id,
      recipient: testEmail,
      sender: fromEmail
    })
    
  } catch (error) {
    console.error('Test email error:', error)
    return ApiResponseHandler.serverError('Failed to send test email')
  }
}