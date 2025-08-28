import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import type { Booking } from '@/lib/utils/booking-types'

// Minimal responses for webhook semantics
function ok(body?: unknown, init: ResponseInit = {}) {
  return new Response(body ? JSON.stringify(body) : undefined, {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function badRequest(message = 'Bad request') {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}

function serverError(message = 'Server error') {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  })
}

const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase()
const PAYPAL_API_BASE = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    throw new Error(`PayPal token error: ${res.status}`)
  }
  const json = await res.json()
  return json.access_token as string
}

async function verifyWebhookSignature(
  headers: Headers,
  bodyJson: unknown,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false

  const payload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: bodyJson,
  }

  // Basic header presence check
  if (!payload.auth_algo || !payload.cert_url || !payload.transmission_id || !payload.transmission_sig || !payload.transmission_time) {
    return false
  }

  const token = await getPayPalAccessToken()
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return false
  const json = await res.json()
  return json.verification_status === 'SUCCESS'
}

type PayPalResource = {
  amount?: { value?: string }
  invoice_id?: string
  custom_id?: string
  id?: string
}

function extractBookingReferenceFromEvent(event: Record<string, unknown>): { bookingReference?: string, paymentReference?: string, amount?: number } {
  // Prefer invoice_id or custom_id (should be set during order creation)
  const resource = (event as { resource?: PayPalResource })?.resource || {}
  const amountStr = resource?.amount?.value
  const amount = amountStr ? parseFloat(amountStr) : undefined

  const invoiceId = resource?.invoice_id
  const customId = resource?.custom_id
  const id = resource?.id // capture id

  return {
    bookingReference: invoiceId || customId,
    paymentReference: id,
    amount,
  }
}

async function markBookingPaidByReference(
  bookingReference: string,
  paymentRef: string | undefined,
  amount: number | undefined,
) {
  const supabase = supabaseAdmin

  // Find booking by reference
  const { data: booking, error: findErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_reference', bookingReference)
    .single()

  if (findErr || !booking) {
    return { updated: false, reason: 'not_found' as const }
  }

  // Idempotency: if already paid, exit
  if (booking.payment_status === 'paid') {
    return { updated: false, reason: 'already_paid' as const }
  }

  const updateData: Record<string, unknown> = {
    payment_status: 'paid',
    payment_method: 'paypal',
    payment_reference: paymentRef || booking.booking_reference,
    status: 'confirmed',
    updated_at: new Date().toISOString(),
  }

  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', booking.id)
    .select()
    .single()

  if (updateErr) {
    return { updated: false, reason: 'update_failed' as const }
  }

  // Insert status history if status changed to confirmed
  try {
    if (booking.status !== 'confirmed') {
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          from_status: booking.status,
          to_status: 'confirmed',
          changed_by: null,
          reason: 'Payment confirmed via PayPal webhook - booking automatically confirmed',
          created_at: new Date().toISOString(),
        })
    }
  } catch {}

  // Send emails (best-effort)
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, first_name, last_name')
      .eq('id', booking.customer_id)
      .single()

    if (profile?.email) {
      const { EmailService } = await import('@/lib/services/email')
      const emailService = new EmailService()
      const customerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
      await emailService.sendPaymentConfirmation(
        profile.email,
        customerName,
        { ...updated, payment_status: 'paid', payment_method: 'paypal', status: 'confirmed' } as Booking,
        'paypal',
        paymentRef || booking.booking_reference,
      )

      await emailService.sendAdminPaymentNotification(
        updated as Booking,
        profile.email,
        customerName,
        'paypal',
        paymentRef || booking.booking_reference,
      )
    }
  } catch {}

  return { updated: true as const }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure configured; if not, accept but do nothing (avoids retries storms during setup)
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || !process.env.PAYPAL_WEBHOOK_ID) {
      return ok({ skipped: true })
    }

    // Raw text body is needed for exact signature verification, but PayPal uses JSON compare API
    const text = await request.text()
    let bodyJson: unknown
    try {
      bodyJson = JSON.parse(text) as unknown
    } catch {
      return badRequest('Invalid JSON')
    }

    const isValid = await verifyWebhookSignature(request.headers, bodyJson)
    if (!isValid) {
      return badRequest('Invalid signature')
    }

    const eventType = (bodyJson as Record<string, unknown>)?.event_type as string | undefined
    // We act on successful capture or order
    const actionable = eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED'
    if (!actionable) {
      return ok({ ignored: true })
    }

    const { bookingReference, paymentReference, amount } = extractBookingReferenceFromEvent(bodyJson as Record<string, unknown>)
    if (!bookingReference) {
      // Without a reference we cannot map to a booking
      return ok({ ignored: true, reason: 'missing_reference' })
    }

    const result = await markBookingPaidByReference(bookingReference, paymentReference, amount)
    return ok({ processed: true, ...result })
  } catch (err) {
    return serverError('Webhook processing failed')
  }
}


