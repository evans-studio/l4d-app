import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types/booking'

// Simple stub for time-slots API - will be implemented later
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: true,
    data: [],
    error: { message: 'Time slots API not implemented yet', code: 'NOT_IMPLEMENTED' }
  })
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: false,
    error: { message: 'Time slots creation not implemented yet', code: 'NOT_IMPLEMENTED' }
  }, { status: 501 })
}