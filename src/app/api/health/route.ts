import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Simple connection test - just check if we can connect
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      logger.error('Database error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Health check failed', error instanceof Error ? error : undefined)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 })
  }
}