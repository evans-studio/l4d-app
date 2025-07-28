import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAdmin } from '@/lib/supabase/direct'

export async function POST(request: NextRequest) {
  try {
    // Test connection first
    const connectionTest = await DatabaseAdmin.testConnection()
    
    if (!connectionTest.connected) {
      return NextResponse.json({
        success: false,
        error: {
          message: `Database connection failed: ${connectionTest.error}`,
          code: 'CONNECTION_ERROR'
        }
      }, { status: 500 })
    }

    // Perform cleanup
    const results = await DatabaseAdmin.cleanupAllUsers()

    return NextResponse.json({
      success: true,
      message: 'Complete database cleanup completed successfully',
      data: {
        connection: connectionTest,
        cleanup: results
      }
    })

  } catch (error) {
    console.error('Direct cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'CLEANUP_ERROR'
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current database state
    const users = await DatabaseAdmin.getAllUsers()
    const sessions = await DatabaseAdmin.getSessionInfo()
    const connection = await DatabaseAdmin.testConnection()

    return NextResponse.json({
      success: true,
      data: {
        connection,
        users,
        sessions,
        summary: {
          authUsers: users.authUsers.length,
          profiles: users.profiles.length,
          activeSessions: sessions.sessions.filter((s: any) => new Date(s.expires_at) > new Date()).length,
          totalSessions: sessions.sessions.length
        }
      }
    })

  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json({
      success: false,
      error: {
        message: String(error),
        code: 'STATUS_ERROR'
      }
    }, { status: 500 })
  }
}