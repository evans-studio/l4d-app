import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const config = {
      fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'zell@love4detailing.com',
      companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@love4detailing.co.uk',
      resendApiKey: !!process.env.RESEND_API_KEY,
      resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://l4d-app.vercel.app'
    }

    return ApiResponseHandler.success(config)

  } catch (error) {
    console.error('Email config error:', error)
    return ApiResponseHandler.serverError('Failed to get email config')
  }
}