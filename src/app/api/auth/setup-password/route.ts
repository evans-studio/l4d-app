// DEPRECATED: This endpoint is no longer used.
// Users must now register with email verification before booking.
// Password setup after booking has been removed for security and simplicity.

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: {
      message: 'Password setup after booking is no longer supported. Please register with email verification first.',
      code: 'ENDPOINT_DEPRECATED'
    }
  }, { status: 410 }) // 410 Gone - resource no longer available
}