import { NextResponse } from 'next/server'
import { env } from '@/lib/config/environment'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      app: {
        env: env.app.env,
        url: env.app.url,
        name: env.app.name,
      },
      business: {
        name: env.business.name,
        phone: env.business.phone,
        email: env.business.email,
        serviceRadiusMiles: env.business.serviceRadiusMiles,
      },
      supabase: {
        url: env.supabase.url,
        hasServiceKey: !!env.supabase.serviceRoleKey,
      },
    },
  })
}