import { supabaseAdmin } from '@/lib/supabase/direct'
import { EmailService } from '@/lib/services/email'
import { paypalService } from '@/lib/services/paypal'

export interface OverduePayment {
  id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  total_price: number
  payment_link?: string
  created_at: string
  hours_overdue: number
  reminder_count: number
}

export class PaymentReminderService {
  private emailService: EmailService
  private readonly PAYMENT_DEADLINE_HOURS = 48
  private readonly REMINDER_INTERVALS = [24, 48, 72] // Hours after creation to send reminders

  constructor() {
    this.emailService = new EmailService()
  }

  /**
   * Get all overdue payments that need reminders
   */
  async getOverduePayments(): Promise<{ success: boolean; data?: OverduePayment[]; error?: string }> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - this.PAYMENT_DEADLINE_HOURS)

      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id,
          booking_reference,
          customer_id,
          total_price,
          created_at,
          status
        `)
        .in('status', ['processing', 'payment_failed'])
        .lt('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: true })

      if (bookingsError) {
        console.error('Error fetching overdue payments:', bookingsError)
        return { success: false, error: bookingsError.message }
      }

      if (!bookings || bookings.length === 0) {
        return { success: true, data: [] }
      }

      // Get customer profiles
      const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, first_name, last_name')
        .in('id', customerIds)

      if (customersError) {
        console.error('Error fetching customer profiles:', customersError)
        return { success: false, error: customersError.message }
      }

      // Transform data
      const overduePayments: OverduePayment[] = bookings.map(booking => {
        const customer = customers?.find(c => c.id === booking.customer_id)
        const customerName = customer 
          ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
          : 'Customer'

        const createdAt = new Date(booking.created_at)
        const now = new Date()
        const hoursOverdue = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60))

        // Generate payment link
        const paymentInfo = paypalService.generatePaymentInstructions(
          booking.total_price,
          booking.booking_reference,
          customerName
        )

        return {
          id: booking.id,
          booking_reference: booking.booking_reference,
          customer_name: customerName,
          customer_email: customer?.email || '',
          total_price: booking.total_price,
          payment_link: paymentInfo.paymentLink,
          created_at: booking.created_at,
          hours_overdue: hoursOverdue,
          reminder_count: 0 // TODO: Add reminder_count column to database
        }
      }).filter(payment => payment.customer_email) // Only include payments with email

      return { success: true, data: overduePayments }

    } catch (error) {
      console.error('Error getting overdue payments:', error)
      return { success: false, error: 'Failed to fetch overdue payments' }
    }
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(payment: OverduePayment): Promise<{ success: boolean; error?: string }> {
    try {
      const reminderType = this.getReminderType(payment.hours_overdue)
      const subject = this.getReminderSubject(reminderType, payment.booking_reference)
      const html = this.generateReminderHTML(payment, reminderType)
      const text = this.generateReminderText(payment, reminderType)

      const result = await this.emailService.sendCustomEmail(
        payment.customer_email,
        subject,
        html,
        text
      )

      if (result.success) {
        // TODO: Update reminder count in database when column is added
        // await this.updateReminderCount(payment.id, payment.reminder_count + 1)
      
      }

      return result

    } catch (error) {
      console.error('Error sending payment reminder:', error)
      return { success: false, error: 'Failed to send reminder email' }
    }
  }

  /**
   * Process all overdue payments and send appropriate reminders
   */
  async processPaymentReminders(): Promise<{ 
    success: boolean; 
    processed: number; 
    sent: number; 
    errors: string[];
  }> {
    const result = {
      success: true,
      processed: 0,
      sent: 0,
      errors: [] as string[]
    }

    try {
      const overdueResult = await this.getOverduePayments()
      
      if (!overdueResult.success) {
        result.success = false
        result.errors.push(overdueResult.error || 'Failed to get overdue payments')
        return result
      }

      const overduePayments = overdueResult.data || []
      result.processed = overduePayments.length

      // Filter payments that should receive reminders
      const paymentsNeedingReminders = overduePayments.filter(payment => 
        this.shouldSendReminder(payment.hours_overdue, payment.reminder_count)
      )

      // Send reminders
      for (const payment of paymentsNeedingReminders) {
        const reminderResult = await this.sendPaymentReminder(payment)
        
        if (reminderResult.success) {
          result.sent++
        } else {
          result.errors.push(
            `Failed to send reminder for ${payment.booking_reference}: ${reminderResult.error}`
          )
        }

        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    
      
      if (result.errors.length > 0) {
        result.success = false
      }

      return result

    } catch (error) {
      console.error('Error processing payment reminders:', error)
      return {
        success: false,
        processed: 0,
        sent: 0,
        errors: ['Unexpected error processing payment reminders']
      }
    }
  }

  /**
   * Determine if a payment should receive a reminder
   */
  private shouldSendReminder(hoursOverdue: number, reminderCount: number): boolean {
    // Don't send more than 3 reminders
    if (reminderCount >= 3) return false

    // Send reminders at 24h, 48h, and 72h intervals
    const reminderThresholds = [24, 48, 72]
    
    for (let i = 0; i < reminderThresholds.length; i++) {
      const threshold = reminderThresholds[i]
      if (threshold && hoursOverdue >= threshold && reminderCount <= i) {
        return true
      }
    }

    return false
  }

  /**
   * Get reminder type based on hours overdue
   */
  private getReminderType(hoursOverdue: number): 'gentle' | 'urgent' | 'final' {
    if (hoursOverdue >= 72) return 'final'
    if (hoursOverdue >= 48) return 'urgent'
    return 'gentle'
  }

  /**
   * Generate reminder email subject
   */
  private getReminderSubject(type: 'gentle' | 'urgent' | 'final', bookingRef: string): string {
    switch (type) {
      case 'gentle':
        return `Payment Reminder - Booking ${bookingRef} | Love 4 Detailing`
      case 'urgent':
        return `Urgent: Payment Required - Booking ${bookingRef} | Love 4 Detailing`
      case 'final':
        return `Final Notice: Payment Overdue - Booking ${bookingRef} | Love 4 Detailing`
      default:
        return `Payment Reminder - Booking ${bookingRef} | Love 4 Detailing`
    }
  }

  /**
   * Generate reminder HTML email content using unified Love4Detailing template
   */
  private generateReminderHTML(payment: OverduePayment, type: 'gentle' | 'urgent' | 'final'): string {
    const urgencyColors = {
      gentle: '#9747FF',
      urgent: '#EA580C', 
      final: '#DC2626'
    }
    const urgencyColor = urgencyColors[type]
    const urgencyText = type === 'final' ? 'FINAL NOTICE' : type === 'urgent' ? 'URGENT REMINDER' : 'PAYMENT REMINDER'

    // Format date for display
    const createdDate = new Date(payment.created_at)
    const formattedDate = createdDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <title>Payment Reminder - ${payment.booking_reference}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 16px !important; }
          .header { padding: 24px 20px !important; }
          .content { padding: 24px 20px !important; }
          .urgency-banner { padding: 16px !important; }
          .details-card { padding: 16px !important; }
          .cta-button { padding: 14px 24px !important; font-size: 15px !important; }
          .text-large { font-size: 20px !important; }
          .text-medium { font-size: 14px !important; }
          .text-small { font-size: 12px !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div class="header" style="background: linear-gradient(135deg, #9747FF 0%, #B269FF 100%); color: white; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 0 -20px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Love 4 Detailing</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9; font-weight: 400;">Premium Mobile Detailing</p>
        </div>
        
        <!-- Content -->
        <div class="content" style="padding: 32px 24px;">
          
          <!-- Urgency Banner -->
          <div class="urgency-banner" style="background: ${urgencyColor}; color: white; padding: 18px 24px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${urgencyText}</h2>
          </div>

          <!-- Greeting -->
          <p class="text-medium" style="font-size: 16px; margin: 0 0 24px 0; color: #374151; font-weight: 400;">Dear ${payment.customer_name},</p>
          
          <!-- Message -->
          <div style="margin-bottom: 32px;">
            ${this.getReminderMessage(type, payment)}
          </div>
          
          <!-- Booking Details Card -->
          <div class="details-card" style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
            <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Booking Details</h3>
            <div style="space-y: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 500; color: #374151;">Booking Reference</span>
                <span style="font-weight: 600; color: #111827; font-family: monospace;">${payment.booking_reference}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 500; color: #374151;">Amount Due</span>
                <span style="font-size: 20px; font-weight: 700; color: ${urgencyColor};">£${payment.total_price.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-weight: 500; color: #374151;">Booking Date</span>
                <span style="color: #111827; font-weight: 500;">${formattedDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 500; color: #374151;">Hours Overdue</span>
                <span style="color: #dc2626; font-weight: 600;">${payment.hours_overdue} hours</span>
              </div>
            </div>
          </div>

          ${payment.payment_link ? `
          <!-- Payment CTA -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${payment.payment_link}" 
               class="cta-button"
               style="display: inline-block; background: ${urgencyColor}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
Pay Now with PayPal
            </a>
            <p class="text-small" style="font-size: 13px; color: #6b7280; margin-top: 16px; line-height: 1.5;">
              Secure payment processing through PayPal<br>
              <span style="word-break: break-all; color: #9747FF; text-decoration: underline;">${payment.payment_link}</span>
            </p>
          </div>
          ` : ''}

          <!-- Contact Information -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
            <h4 style="color: #111827; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Need Help?</h4>
            <p class="text-small" style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
              If you have any questions or concerns about this payment reminder:<br>
              <strong style="color: #374151;">Email:</strong> <a href="mailto:zell@love4detailing.com" style="color: #9747FF; text-decoration: none;">zell@love4detailing.com</a><br>
              <strong style="color: #374151;">Response Time:</strong> Within 24 hours
            </p>
          </div>
          
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p class="text-small" style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
            This is an automated reminder from Love 4 Detailing<br>
            Please do not reply to this email - use the contact details above for support
          </p>
        </div>
      </div>
    </body>
    </html>`
  }

  /**
   * Generate reminder text email content
   */
  private generateReminderText(payment: OverduePayment, type: 'gentle' | 'urgent' | 'final'): string {
    const urgencyText = type === 'final' ? 'FINAL NOTICE' : type === 'urgent' ? 'URGENT REMINDER' : 'PAYMENT REMINDER'
    
    return `
${urgencyText} - Love 4 Detailing

Dear ${payment.customer_name},

${this.getReminderTextMessage(type, payment)}

Booking Details:
- Booking Reference: ${payment.booking_reference}
- Amount Due: £${payment.total_price.toFixed(2)}
- Hours Overdue: ${payment.hours_overdue} hours

${payment.payment_link ? `
Pay Now: ${payment.payment_link}
` : ''}

If you have any questions, please contact us at:
Email: zell@love4detailing.com

Thank you,
Love 4 Detailing Team

---
This is an automated reminder. Please do not reply to this email.
    `.trim()
  }

  /**
   * Get reminder message based on type
   */
  private getReminderMessage(type: 'gentle' | 'urgent' | 'final', payment: OverduePayment): string {
    switch (type) {
      case 'gentle':
        return `
        <p>We hope you're well! This is a friendly reminder that payment for your vehicle detailing booking is now overdue.</p>
        <p>To avoid any service delays or cancellation, please complete your payment at your earliest convenience.</p>
        `
      case 'urgent':
        return `
        <p>Your payment for the vehicle detailing service is significantly overdue (${payment.hours_overdue} hours).</p>
        <p><strong>Immediate action required:</strong> Please complete your payment within the next 24 hours to avoid booking cancellation.</p>
        `
      case 'final':
        return `
        <p><strong>FINAL NOTICE:</strong> Your payment is critically overdue (${payment.hours_overdue} hours).</p>
        <p style="color: #DC2626;"><strong>Your booking will be automatically cancelled within 24 hours if payment is not received.</strong></p>
        <p>This is your last opportunity to complete payment and secure your booking.</p>
        `
      default:
        return '<p>Payment reminder for your booking.</p>'
    }
  }

  /**
   * Get reminder text message based on type
   */
  private getReminderTextMessage(type: 'gentle' | 'urgent' | 'final', payment: OverduePayment): string {
    switch (type) {
      case 'gentle':
        return `This is a friendly reminder that payment for your vehicle detailing booking is now overdue. To avoid any service delays or cancellation, please complete your payment at your earliest convenience.`
      case 'urgent':
        return `Your payment for the vehicle detailing service is significantly overdue (${payment.hours_overdue} hours). IMMEDIATE ACTION REQUIRED: Please complete your payment within the next 24 hours to avoid booking cancellation.`
      case 'final':
        return `FINAL NOTICE: Your payment is critically overdue (${payment.hours_overdue} hours). Your booking will be automatically cancelled within 24 hours if payment is not received. This is your last opportunity to complete payment and secure your booking.`
      default:
        return 'Payment reminder for your booking.'
    }
  }

  /**
   * Update reminder count in database
   * TODO: Uncomment when reminder_count column is added to database
   */
  private async updateReminderCount(bookingId: string, newCount: number): Promise<void> {
    // try {
    //   const { error } = await supabaseAdmin
    //     .from('bookings')
    //     .update({ reminder_count: newCount })
    //     .eq('id', bookingId)
    //
    //   if (error) {
    //     console.error('Error updating reminder count:', error)
    //   }
    // } catch (error) {
    //   console.error('Error updating reminder count:', error)
    // }
  }
}

// Export singleton instance
export const paymentReminderService = new PaymentReminderService()