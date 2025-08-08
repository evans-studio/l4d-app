import { NextRequest } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'

function toCSV(rows: any[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h]
      const s = typeof val === 'string' ? val : val == null ? '' : String(val)
      return '"' + s.replace(/"/g, '""') + '"'
    })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    const range = (searchParams.get('range') || 'month').toLowerCase()

    // Auth guard
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return ApiResponseHandler.forbidden('Admin access required')
    }

    // Simple export of bookings and totals for the selected range via reports API
    const reportsUrl = new URL(request.url)
    reportsUrl.pathname = reportsUrl.pathname.replace('/export', '')
    reportsUrl.searchParams.set('range', range)
    const res = await fetch(reportsUrl.toString(), { cache: 'no-store' })
    const reportJson = await res.json()
    if (!reportJson?.success) {
      return ApiResponseHandler.serverError('Failed to generate report')
    }
    const report = reportJson.data

    const flatRows = [
      { metric: 'revenue_total', value: report.revenue.total },
      { metric: 'revenue_monthly', value: report.revenue.monthly },
      { metric: 'revenue_weekly', value: report.revenue.weekly },
      { metric: 'revenue_daily', value: report.revenue.daily },
      { metric: 'bookings_total', value: report.bookings.total },
      { metric: 'bookings_pending', value: report.bookings.pending },
      { metric: 'bookings_confirmed', value: report.bookings.confirmed },
      { metric: 'bookings_completed', value: report.bookings.completed },
      { metric: 'bookings_cancelled', value: report.bookings.cancelled },
      { metric: 'customers_total', value: report.customers.total },
      { metric: 'customers_active', value: report.customers.active },
      { metric: 'customers_new', value: report.customers.new },
    ]

    if (format === 'csv') {
      const csv = toCSV(flatRows)
      const body = new Blob([csv], { type: 'text/csv' }) as any
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="reports-${range}.csv"`
        }
      })
    }

    return ApiResponseHandler.success({ downloadUrl: `data:application/json,${encodeURIComponent(JSON.stringify(flatRows))}` })
  } catch (error) {
    console.error('Reports export error:', error)
    return ApiResponseHandler.serverError('Failed to export report')
  }
}

