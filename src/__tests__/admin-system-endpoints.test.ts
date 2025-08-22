import * as exportRoute from '@/app/api/admin/system/export/route'
import * as auditRoute from '@/app/api/admin/system/security-audit/route'
import * as clearCacheRoute from '@/app/api/admin/system/clear-cache/route'
import { supabaseAdmin } from '@/lib/supabase/direct'

describe('Admin System Endpoints', () => {
  it('export: returns JSON with expected keys and attachment headers', async () => {
    const req: any = { headers: new Headers({ origin: 'http://localhost:3000' }) }
    const res = await (exportRoute as any).GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="system-export-')
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('exported_at')
    expect(body.data).toHaveProperty('bookings')
    expect(body.data).toHaveProperty('customers')
    expect((supabaseAdmin as any).from).toHaveBeenCalledWith('security_events')
  })

  it('security-audit: returns checks list with statuses', async () => {
    const req: any = { headers: new Headers({ origin: 'http://localhost:3000' }) }
    const res = await (auditRoute as any).POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.checks)).toBe(true)
    expect(body.data.checks.length).toBeGreaterThan(0)
    expect(body.data.checks[0]).toHaveProperty('name')
    expect(body.data.checks[0]).toHaveProperty('status')
    expect((supabaseAdmin as any).from).toHaveBeenCalledWith('security_events')
  })

  it('clear-cache: accepts POST and reports revalidated paths', async () => {
    const req: any = {
      headers: new Headers({ origin: 'http://localhost:3000' }),
      json: async () => ({ paths: ['/', '/admin'] }),
    }
    const res = await (clearCacheRoute as any).POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.revalidated.paths).toEqual(['/','/admin'])
    expect((supabaseAdmin as any).from).toHaveBeenCalledWith('security_events')
  })
})


