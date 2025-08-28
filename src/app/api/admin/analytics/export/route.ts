import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/server'

function escapeCsv(value: string) {
  // Escape double quotes by doubling them
  const escaped = value.replace(/"/g, '""')
  // Wrap if it contains comma, quote, or newline
  return /[",\n]/.test(value) ? `"${escaped}"` : escaped
}

function toCsvRow(values: Array<string | number>) {
  return values
    .map((v) => (typeof v === 'string' ? escapeCsv(v) : String(v)))
    .join(',')
}

export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request)
  const { searchParams } = new URL(request.url)

  // Auth check
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Proxy the analytics data and convert to CSV
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const url = `${appUrl}/api/admin/analytics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`

  // Fallback to internal fetch when NEXT_PUBLIC_APP_URL is not set
  const res = await fetch(url.startsWith('http') ? url : `${request.nextUrl.origin}/api/admin/analytics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
    headers: { 'cookie': request.headers.get('cookie') || '' },
    cache: 'no-store'
  })

  if (!res.ok) {
    return new NextResponse('Failed to fetch analytics', { status: 500 })
  }

  const json = await res.json()
  if (!json?.success) {
    return new NextResponse('Analytics unavailable', { status: 500 })
  }
  const data = json.data as {
    revenue?: {
      total?: number
      this_month?: number
      last_month?: number
      growth_percentage?: number
      daily_average?: number
    }
    bookings?: {
      total?: number
      completion_rate?: number
      cancellation_rate?: number
      average_value?: number
      status_breakdown?: {
        pending?: number
        confirmed?: number
        completed?: number
        cancelled?: number
      }
    }
    customers?: {
      total?: number
      returning_rate?: number
      new_this_month?: number
      repeat_customer_rate?: number
      average_lifetime_value?: number
    }
    services?: {
      most_popular?: Array<{
        name?: string
        bookings?: number
        revenue?: number
      }>
    }
    locations?: {
      top_areas?: Array<{
        city?: string
        bookings?: number
        revenue?: number
      }>
    }
  } | undefined

  // Build a simple, useful CSV
  const lines: string[] = []
  lines.push('Section,Metric,Value')
  // Revenue
  lines.push(toCsvRow(['Revenue', 'Total', data?.revenue?.total ?? 0]))
  lines.push(toCsvRow(['Revenue', 'This Period', data?.revenue?.this_month ?? 0]))
  lines.push(toCsvRow(['Revenue', 'Previous Period', data?.revenue?.last_month ?? 0]))
  lines.push(toCsvRow(['Revenue', 'Growth %', data?.revenue?.growth_percentage?.toFixed?.(2) ?? 0]))
  lines.push(toCsvRow(['Revenue', 'Daily Average', data?.revenue?.daily_average ?? 0]))

  // Bookings
  lines.push(toCsvRow(['Bookings', 'Total', data?.bookings?.total ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Completion Rate %', data?.bookings?.completion_rate?.toFixed?.(2) ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Cancellation Rate %', data?.bookings?.cancellation_rate?.toFixed?.(2) ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Average Value', data?.bookings?.average_value ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Pending', data?.bookings?.status_breakdown?.pending ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Confirmed', data?.bookings?.status_breakdown?.confirmed ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Completed', data?.bookings?.status_breakdown?.completed ?? 0]))
  lines.push(toCsvRow(['Bookings', 'Cancelled', data?.bookings?.status_breakdown?.cancelled ?? 0]))

  // Customers
  lines.push(toCsvRow(['Customers', 'New (period)', data?.customers?.new_this_month ?? 0]))
  lines.push(toCsvRow(['Customers', 'Repeat Customer Rate %', data?.customers?.repeat_customer_rate?.toFixed?.(2) ?? 0]))
  lines.push(toCsvRow(['Customers', 'Average Lifetime Value', data?.customers?.average_lifetime_value ?? 0]))

  // Top services
  if (Array.isArray(data?.services?.most_popular)) {
    lines.push('Section,Service,Bookings,Revenue')
    for (const s of data.services!.most_popular!) {
      lines.push(toCsvRow(['Top Services', s.name ?? 'Unknown', s.bookings ?? 0, s.revenue ?? 0]))
    }
  }

  // Top areas
  if (Array.isArray(data?.locations?.top_areas)) {
    lines.push('Section,Area,Bookings,Revenue')
    for (const a of data.locations!.top_areas!) {
      lines.push(toCsvRow(['Top Areas', a.city ?? 'Unknown', a.bookings ?? 0, a.revenue ?? 0]))
    }
  }

  const csv = lines.join('\n')
  const filename = `analytics-${start || 'start'}-to-${end || 'end'}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}


