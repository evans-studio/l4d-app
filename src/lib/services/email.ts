import { Resend } from 'resend'
import { Booking } from '@/lib/utils/booking-types'
import { formatDateForEmail, formatTimeForEmail } from '@/lib/utils/date-formatting'
import { paypalService } from '@/lib/services/paypal'
import { logger } from '@/lib/utils/logger'

// Initialize Resend safely: in CI or local builds without a key, provide a no-op stub
const resend: Resend = (() => {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return {
      emails: {
        // No-op sender for environments without RESEND_API_KEY
        send: async () => ({ data: null as unknown as any, error: null })
      }
    } as unknown as Resend
  }
  return new Resend(key)
})()

export interface EmailServiceConfig {
  fromEmail: string
  fromName: string
  adminEmail: string
  replyToEmail?: string
}

const defaultConfig: EmailServiceConfig = {
  fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || process.env.EMAIL_FROM || 'zell@love4detailing.com',
  fromName: 'Love 4 Detailing - Zell',
  adminEmail: process.env.ADMIN_EMAIL || 'zell@love4detailing.com',
  replyToEmail: process.env.EMAIL_REPLY_TO || process.env.NEXT_PUBLIC_COMPANY_EMAIL
}

export class EmailService {
  private config: EmailServiceConfig

  constructor(config: Partial<EmailServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // Public wrapper for unified template generation
  public createUnifiedEmail(args: {
    title: string,
    header: { title: string, subtitle?: string, type?: 'default' | 'success' | 'warning' | 'error' },
    content: string,
    footer?: string
  }): string {
    // Delegate to the private generator to keep a single source of truth
    return this.generateUnifiedEmailHTML(args)
  }

  /**
   * Format price with proper validation and fallback
   */
  private formatPrice(price: number | string | null | undefined): string {
    if (!price || isNaN(Number(price))) {
      logger.warn('EmailService: Missing or invalid price data, using £0.00 fallback')
      return '£0.00'
    }
    return `£${Number(price).toFixed(2)}`
  }

  /**
   * Format date with proper spacing (e.g., "Processed On: 8 August 2024")
   */
  private formatDateTimeWithLabel(label: string, date?: Date | string): string {
    const formattedDate = date 
      ? new Date(date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
    
    return `${label}: ${formattedDate}`
  }

  /**
   * Get logo URL with proper fallback
   */
  private getLogoUrl(): string {
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''
    // Ensure absolute URL; fallback to production domain
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      baseUrl = 'https://love4detailing.com'
    }
    return `${baseUrl.replace(/\/$/, '')}/logo.png`
  }

  /**
   * Standard brand colors for consistent theming
   */
  private getBrandColors() {
    return {
      primary: '#9747FF',
      secondary: '#B269FF',
      gradient: 'linear-gradient(135deg, #9747FF 0%, #B269FF 100%)',
      success: '#16a34a',
      warning: '#f59e0b',
      error: '#dc2626',
      text: {
        primary: '#111827',
        secondary: '#374151',
        muted: '#6b7280',
        light: '#ffffff'
      }
    }
  }

  // Send booking confirmation email to customer
  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    booking: Partial<Booking>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: `Booking Confirmation - ${booking.booking_reference}`,
        html: this.generateBookingConfirmationHTML(customerName, booking as Booking),
        text: this.generateBookingConfirmationText(customerName, booking as Booking)
      })

      if (error) {
        logger.error('Email send error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send welcome booking confirmation to new customers
  async sendWelcomeBookingConfirmation(
    customerEmail: string,
    customerName: string,
    booking: Partial<Booking>,
    requiresEmailVerification: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: `Welcome to Love 4 Detailing! Booking Confirmation - ${booking.booking_reference}`,
        html: this.generateWelcomeBookingHTML(customerName, booking as Booking, requiresEmailVerification),
        text: this.generateWelcomeBookingText(customerName, booking as Booking, requiresEmailVerification)
      })

      if (error) {
        logger.error('Welcome booking email send error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Welcome booking email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send new booking notification to admin
  async sendAdminBookingNotification(
    booking: Partial<Booking>,
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [this.config.adminEmail],
        replyTo: customerEmail,
        subject: `New Booking Received - ${booking.booking_reference}`,
        html: this.generateAdminNotificationHTML(booking as Booking, customerEmail, customerName),
        text: this.generateAdminNotificationText(booking as Booking, customerEmail, customerName)
      })

      if (error) {
        logger.error('Admin notification email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Admin email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send password setup email to new customers
  async sendPasswordSetupEmail(
    customerEmail: string,
    customerName: string,
    setupToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/setup-password?token=${setupToken}&email=${encodeURIComponent(customerEmail)}`
      
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: 'Complete Your Account Setup - Love 4 Detailing',
        html: this.generatePasswordSetupHTML(customerName, setupUrl),
        text: this.generatePasswordSetupText(customerName, setupUrl)
      })

      if (error) {
        logger.error('Password setup email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Password setup email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send booking decline notification email
  async sendBookingDeclineNotification(
    customerEmail: string,
    customerName: string,
    booking: Booking,
    declineReason: string,
    additionalNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: `Booking Update - ${booking.booking_reference}: Declined`,
        html: this.generateBookingDeclineHTML(customerName, booking, declineReason, additionalNotes),
        text: this.generateBookingDeclineText(customerName, booking, declineReason, additionalNotes)
      })

      if (error) {
        logger.error('Booking decline email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Booking decline email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send booking status update email
  async sendBookingStatusUpdate(
    customerEmail: string,
    customerName: string,
    booking: Partial<Booking>,
    previousStatus: string,
    updateReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const statusMessages = {
        confirmed: 'Your booking has been confirmed!',
        cancelled: 'Your booking has been cancelled',
        completed: 'Your booking has been completed',
        in_progress: 'Your booking is now in progress'
      }

      const subject = `Booking Update - ${booking.booking_reference}: ${statusMessages[booking.status as keyof typeof statusMessages] || 'Status Updated'}`

      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject,
        html: this.generateStatusUpdateHTML(customerName, booking, previousStatus, updateReason),
        text: this.generateStatusUpdateText(customerName, booking, previousStatus, updateReason)
      })

      if (error) {
        logger.error('Status update email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Status update email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send admin notification about customer reschedule request
  async sendAdminRescheduleRequestNotification(
    booking: Partial<Booking>,
    customerName: string,
    customerEmail: string,
    requestedDate: string,
    requestedTime: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [this.config.adminEmail],
        replyTo: customerEmail,
        subject: `Reschedule Request - ${booking.booking_reference}`,
        html: this.generateAdminRescheduleRequestHTML(booking as Booking, customerName, customerEmail, requestedDate, requestedTime, reason),
        text: this.generateAdminRescheduleRequestText(booking as Booking, customerName, customerEmail, requestedDate, requestedTime, reason)
      })

      if (error) {
        logger.error('Admin reschedule request notification error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Admin reschedule request email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send customer notification about reschedule request response
  async sendRescheduleRequestResponse(
    customerEmail: string,
    customerName: string,
    booking: Partial<Booking>,
    rescheduleRequest: { id: string; requested_date?: string; requested_time?: string; responded_at?: string; status?: string; reason?: string | null },
    action: string,
    adminResponse?: string,
    proposedDate?: string,
    proposedTime?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const statusMessages = {
        approve: 'Your reschedule request has been approved!',
        reject: 'Your reschedule request has been declined',
        propose: 'Alternative time proposed for your reschedule request'
      }

      const subject = `Reschedule Request Update - ${booking.booking_reference}: ${statusMessages[action as keyof typeof statusMessages] || 'Updated'}`

      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject,
        html: this.generateRescheduleResponseHTML(customerName, booking, rescheduleRequest, action, adminResponse, proposedDate, proposedTime),
        text: this.generateRescheduleResponseText(customerName, booking, rescheduleRequest, action, adminResponse, proposedDate, proposedTime)
      })

      if (error) {
        logger.error('Reschedule response email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Reschedule response email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // HTML Email Templates
  private generateBookingConfirmationHTML(customerName: string, booking: Booking): string {
    // Generate PayPal payment link and instructions
    const paypalPayment = paypalService.generatePaymentInstructions(
      booking.total_price,
      booking.booking_reference,
      customerName
    )

    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; margin: 0;">Dear ${customerName},</p>
        <p style="color: #ffffff; font-size: 18px; margin: 12px 0 0 0; font-weight: 600;">Thank you for your booking!</p>
      </div>
      ${this.generateBookingDetailsCard(booking)}
      <div class="content-card">
        <div class="card-content" style="text-align: center;">
          <a href="${paypalPayment.paymentLink}" style="display: inline-block; background: #fff; color: #0070ba; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; border: 1px solid #cbd5e1;">
            Pay £${booking.total_price.toFixed(2)} via PayPal
          </a>
          <p style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.7);">Ref: ${booking.booking_reference} • Deadline: ${paypalPayment.deadline}</p>
        </div>
      </div>
    `

    return this.generateUnifiedEmailHTML({
      title: 'Booking Confirmation - Love 4 Detailing',
      header: {
        title: 'Booking Confirmed!',
        subtitle: 'Your premium car detailing experience awaits',
        type: 'success'
      },
      content
    })
  }

  private generateBookingConfirmationText(customerName: string, booking: Booking): string {
    return `
BOOKING CONFIRMATION - Love 4 Detailing

Dear ${customerName},

Your booking has been received and is being processed. Here are your booking details:

Booking Reference: ${booking.booking_reference}
Date: ${formatDateForEmail(booking.scheduled_date)}
Time: ${formatTimeForEmail(booking.scheduled_start_time)}
Vehicle: ${booking.vehicle_details?.make} ${booking.vehicle_details?.model}
Service Address: ${booking.service_address?.address_line_1}, ${booking.service_address?.city}, ${booking.service_address?.postcode}
Total Price: £${booking.total_price}
Status: ${booking.status === 'pending' ? 'Awaiting Confirmation' : booking.status}

${booking.special_instructions ? `Special Instructions: ${booking.special_instructions}` : ''}

WHAT HAPPENS NEXT?
Our team will review your booking and contact you within 24 hours to confirm the appointment time and discuss any specific requirements.

Payment is due after service completion. We accept cash, card, and bank transfer.

If you have any questions or need to make changes to your booking, please contact us:
- Email: ${this.config.adminEmail}
- Phone: [Your phone number]

Thank you for choosing Love 4 Detailing!

---
Love 4 Detailing - Professional Vehicle Detailing Services
This is an automated email. Please do not reply directly to this email.
    `
  }

  // Welcome booking templates for new customers
  private generateWelcomeBookingHTML(customerName: string, booking: Booking, requiresEmailVerification: boolean): string {
    // Generate PayPal payment link and instructions
    const paypalPayment = paypalService.generatePaymentInstructions(
      booking.total_price,
      booking.booking_reference,
      customerName
    )

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: rgba(255, 255, 255, 0.85); font-size: 16px; margin: 0;">Welcome, ${customerName}.</p>
        <p style="color: #ffffff; font-size: 18px; margin: 16px 0 0 0; font-weight: 500;">Your account is created and your booking is confirmed.</p>
      </div>

      ${requiresEmailVerification ? `
      <!-- Email Verification Reminder -->
      <div class="content-card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
        <div class="card-content">
          <h4 style="color: #fbbf24;"> Email verification required</h4>
          <p style="color: #fde68a; margin-top: 8px;">Check your inbox and click the verification link to access your dashboard.</p>
        </div>
        
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #fde68a;">If you don’t see it, check your spam folder.</p>
      </div>
      ` : ''}
      
      ${this.generateBookingDetailsCard(booking)}
      
      <!-- PayPal Payment Section -->
      <div class="highlight-card" style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); border: 1px solid rgba(255,255,255,0.1);">
        <h4 style="color: #B269FF; margin-bottom: 12px;"> Secure Your Booking with Payment</h4>
        <p style="color: rgba(255, 255, 255, 0.85); margin-bottom: 12px; font-size: 15px;">Complete your payment securely through PayPal to guarantee your service slot.</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${paypalPayment.paymentLink}" style="display: inline-block; background: #ffffff; color: #0070ba; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
             Pay £${booking.total_price.toFixed(2)} with PayPal
          </a>
        </div>
        
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.8); margin-top: 16px;">
          <p style="margin-bottom: 8px;"><strong>Payment Reference:</strong> ${booking.booking_reference}</p>
          <p style="margin-bottom: 8px;"><strong>Payment Deadline:</strong> ${paypalPayment.deadline}</p>
          <p style="margin-bottom: 0;">Important: Your booking will be automatically cancelled if payment is not received by the deadline.</p>
        </div>
      </div>
      
      <div class="highlight-card">
        <h4> Welcome to the Love 4 Detailing family!</h4>
        <p style="margin-bottom: 16px;"><strong> Account Created:</strong> You now have access to your personal dashboard (after email verification) to track bookings and manage your account.</p>
        <p style="margin-bottom: 16px;"><strong> Secure Payment:</strong> Complete payment using the PayPal link above within 48 hours to guarantee your service slot.</p>
        <p style="margin-bottom: 16px;"><strong> Premium Service:</strong> Our professional team will arrive with all equipment and deliver exceptional results.</p>
        <p style="margin-bottom: 0;"><strong>Stay Connected:</strong> After verification, log in to your dashboard to reschedule, view history, and book future services.</p>
      </div>
      
      <div class="highlight-card">
        <h4> What makes us special?</h4>
        <p style="margin-bottom: 16px;">✓ Mobile service - we come to you</p>
        <p style="margin-bottom: 16px;">✓ Professional-grade equipment and eco-friendly products</p>
        <p style="margin-bottom: 16px;">✓ Fully insured with 100% satisfaction guarantee</p>
        <p style="margin-bottom: 16px;">✓ Before and after photos for every service</p>
        <p style="margin-bottom: 0;">✓ Personal dashboard to manage all your bookings</p>
      </div>
      
      <div class="content-card" style="text-align: center;">
        <div class="card-content">
          <h4 style="color: #B269FF; margin-bottom: 16px;">Welcome aboard! Need help?</h4>
          <p style="margin-bottom: 12px;"> <a href="mailto:${this.config.adminEmail}" class="footer-link">${this.config.adminEmail}</a></p>
          <p style="margin-bottom: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">We're here to make your first experience with us exceptional!</p>
        </div>
      </div>
    `

    return this.generateUnifiedEmailHTML({
      title: 'Welcome to Love 4 Detailing - Booking Confirmed!',
      header: {
        title: ' Welcome & Booking Confirmed!',
        subtitle: 'Your premium car detailing journey begins here',
        type: 'success'
      },
      content
    })
  }

  private generateWelcomeBookingText(customerName: string, booking: Booking, requiresEmailVerification: boolean): string {
    // Generate PayPal payment link for text version
    const paypalPayment = paypalService.generatePaymentInstructions(
      booking.total_price,
      booking.booking_reference,
      customerName
    )

    return `
WELCOME TO LOVE 4 DETAILING - BOOKING CONFIRMED!

Dear ${customerName},

 Welcome to the Love 4 Detailing family! Your account has been created and your booking is confirmed.

${requiresEmailVerification ? `
 EMAIL VERIFICATION REQUIRED:
Please check your inbox for a verification email and click the confirmation link to activate your account. This will give you access to your customer dashboard.
` : ''}

BOOKING DETAILS:
Reference: ${booking.booking_reference}
Date: ${formatDateForEmail(booking.scheduled_date)}
Time: ${formatTimeForEmail(booking.scheduled_start_time)}
Vehicle: ${booking.vehicle_details?.make} ${booking.vehicle_details?.model}
Service Address: ${booking.service_address?.address_line_1}, ${booking.service_address?.city}, ${booking.service_address?.postcode}
Total Price: £${booking.total_price}
Status: Confirmed - Payment Required

${booking.special_instructions ? `Special Instructions: ${booking.special_instructions}` : ''}

 SECURE PAYMENT REQUIRED:
${paypalPayment.paymentLink}

Payment Reference: ${booking.booking_reference}
Payment Deadline: ${paypalPayment.deadline}

Important: Important: Your booking will be automatically cancelled if payment is not received by the deadline.

 WHAT HAPPENS NEXT:
1. Complete payment using the PayPal link above within 48 hours
2. Verify your email address (if required) to access your dashboard
3. Our professional team will arrive at your scheduled time with all equipment
4. Enjoy premium car detailing service with 100% satisfaction guarantee

 WELCOME BENEFITS:
✓ Personal dashboard to manage bookings (after email verification)
✓ Mobile service - we come to your location
✓ Professional-grade equipment and eco-friendly products
✓ Fully insured with satisfaction guarantee
✓ Before and after photos included
✓ Easy rebooking and service history tracking

NEED HELP?
Email: ${this.config.adminEmail}
Response time: Within 24 hours

Thank you for choosing Love 4 Detailing! We're excited to deliver an exceptional experience.

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Premium Mobile Detailing Services
    `.trim()
  }

  // Send payment confirmation to customer
  async sendPaymentConfirmation(
    customerEmail: string,
    customerName: string,
    booking: Booking,
    paymentMethod: string,
    paymentReference: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: `Payment Confirmed - Booking ${booking.booking_reference}`,
        html: this.generatePaymentConfirmationHTML(customerName, booking, paymentMethod, paymentReference),
        text: this.generatePaymentConfirmationText(customerName, booking, paymentMethod, paymentReference)
      })

      if (error) {
        logger.error('Payment confirmation email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Payment confirmation email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send admin notification about payment received
  async sendAdminPaymentNotification(
    booking: Booking,
    customerEmail: string,
    customerName: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [this.config.adminEmail],
        replyTo: customerEmail,
        subject: ` Payment Received - ${booking.booking_reference}`,
        html: this.generateAdminPaymentNotificationHTML(booking, customerEmail, customerName, paymentMethod, paymentReference),
        text: this.generateAdminPaymentNotificationText(booking, customerEmail, customerName, paymentMethod, paymentReference)
      })

      if (error) {
        logger.error('Admin payment notification email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Admin payment notification email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  private generateAdminNotificationHTML(booking: Booking, customerEmail: string, customerName: string): string {

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking Alert - Love4Detailing Admin</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 0; background: #0a0a0a; }
            .email-container { background: #0a0a0a; min-height: 100vh; }
            .header { background: linear-gradient(135deg, #9747FF 0%, #B269FF 100%); color: white; padding: 30px; text-align: center; }
            .alert-badge { display: inline-block; background: rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
            .logo-section { margin-bottom: 20px; }
            .logo-text { font-size: 20px; font-weight: bold; }
            .content { background: #1a1a1a; padding: 30px; }
            .priority-alert { background: rgba(151, 71, 255, 0.15); border: 1px solid rgba(151, 71, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center; }
            .priority-alert h3 { color: #B269FF; margin: 0 0 10px 0; font-size: 18px; }
            .customer-card { background: #252525; border-radius: 12px; padding: 25px; margin: 20px 0; border: 1px solid rgba(151, 71, 255, 0.2); }
            .customer-header { color: #9747FF; font-size: 18px; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
            .customer-details { display: grid; gap: 12px; }
            .customer-detail { display: flex; align-items: center; gap: 12px; color: rgba(255, 255, 255, 0.8); }
            .customer-detail strong { color: #ffffff; min-width: 60px; }
            .booking-card { background: #252525; border-radius: 12px; overflow: hidden; margin: 25px 0; border: 1px solid rgba(151, 71, 255, 0.2); }
            .booking-header { background: linear-gradient(135deg, rgba(151, 71, 255, 0.1), rgba(178, 105, 255, 0.1)); padding: 20px; border-bottom: 1px solid rgba(151, 71, 255, 0.2); }
            .booking-ref { color: #9747FF; font-size: 20px; font-weight: bold; margin: 0; }
            .booking-status { display: inline-block; background: rgba(151, 71, 255, 0.2); color: #B269FF; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 8px; }
            .booking-details { padding: 25px; }
            .detail-grid { display: grid; gap: 16px; }
            .detail-row { display: flex; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            .detail-row:last-child { border-bottom: none; }
            .detail-icon { width: 20px; height: 20px; margin-right: 12px; color: #9747FF; flex-shrink: 0; margin-top: 2px; }
            .detail-content { flex: 1; }
            .detail-label { font-weight: 500; color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 4px; }
            .detail-value { color: #ffffff; font-size: 15px; line-height: 1.4; }
            .price-highlight { color: #9747FF; font-size: 18px; font-weight: bold; }
            .instructions-card { background: rgba(151, 71, 255, 0.1); border: 1px solid rgba(151, 71, 255, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .action-card { background: #252525; border: 1px solid rgba(151, 71, 255, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0; }
            .action-card h4 { color: #B269FF; margin: 0 0 15px 0; font-size: 18px; }
            .action-list { list-style: none; padding: 0; margin: 0; }
            .action-list li { margin: 10px 0; padding: 8px 0; color: rgba(255, 255, 255, 0.8); position: relative; padding-left: 24px; }
            .action-list li::before { content: '- '; position: absolute; left: 0; color: #9747FF; font-weight: bold; }
            .footer { background: #0a0a0a; padding: 25px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); }
            .footer-brand { color: #9747FF; font-weight: 600; margin-bottom: 8px; }
            .footer-text { color: rgba(255, 255, 255, 0.5); font-size: 12px; line-height: 1.5; }
            @media (max-width: 480px) {
              .header, .content, .footer { padding: 20px 15px; }
              .booking-details, .customer-card, .action-card { padding: 20px 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="alert-badge"> NEW BOOKING ALERT</div>
              <div class="logo-section">
                <img src="${this.getLogoUrl()}" alt="Love 4 Detailing" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); margin-bottom: 8px;" />
                <div class="logo-text">Love4Detailing Admin</div>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Action Required</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">New booking awaiting confirmation</p>
            </div>
            
            <div class="content">
              <div class="priority-alert">
                <h3> Priority: High</h3>
                <p style="margin: 0; color: rgba(255, 255, 255, 0.8);">Please review and respond within 24 hours to maintain service excellence.</p>
              </div>
              
              <div class="customer-card">
                <div class="customer-header">
                  <span></span>
                  <span>Customer Information</span>
                </div>
                <div class="customer-details">
                  <div class="customer-detail">
                    <strong>Name:</strong>
                    <span>${customerName}</span>
                  </div>
                  <div class="customer-detail">
                    <strong>Email:</strong>
                    <span>${customerEmail}</span>
                  </div>
                </div>
              </div>
              
              <div class="booking-card">
                <div class="booking-header">
                  <h3 class="booking-ref">${booking.booking_reference}</h3>
                  <span class="booking-status">${booking.status}</span>
                </div>
                
                <div class="booking-details">
                  <div class="detail-grid">
                    <div class="detail-row">
                      <div class="detail-icon"></div>
                      <div class="detail-content">
                        <div class="detail-label">Service Date</div>
                        <div class="detail-value">${formatDateForEmail(booking.scheduled_date)}</div>
                      </div>
                    </div>
                    
                    <div class="detail-row">
                      <div class="detail-icon">Time</div>
                      <div class="detail-content">
                        <div class="detail-label">Service Time</div>
                        <div class="detail-value">${formatTimeForEmail(booking.scheduled_start_time)} (${booking.estimated_duration} min duration)</div>
                      </div>
                    </div>
                    
                    <div class="detail-row">
                      <div class="detail-icon"></div>
                      <div class="detail-content">
                        <div class="detail-label">Vehicle Details</div>
                        <div class="detail-value">
                          ${booking.vehicle_details?.make} ${booking.vehicle_details?.model}
                          ${booking.vehicle_details?.year ? ` (${booking.vehicle_details.year})` : ''}
                          ${booking.vehicle_details?.color ? `<br>Color: ${booking.vehicle_details.color}` : ''}
                          ${booking.vehicle_details?.registration ? `<br>Reg: ${booking.vehicle_details.registration}` : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div class="detail-row">
                      <div class="detail-icon">📍</div>
                      <div class="detail-content">
                        <div class="detail-label">Service Location</div>
                        <div class="detail-value">
                          ${booking.service_address?.address_line_1}<br>
                          ${booking.service_address?.address_line_2 ? `${booking.service_address.address_line_2}<br>` : ''}
                          ${booking.service_address?.city}, ${booking.service_address?.postcode}
                          ${booking.distance_km ? `<br><small style="color: rgba(255, 255, 255, 0.6);">Distance: ${booking.distance_km} km</small>` : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div class="detail-row">
                      <div class="detail-icon"></div>
                      <div class="detail-content">
                        <div class="detail-label">Service Value</div>
                        <div class="detail-value price-highlight">£${booking.total_price}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              ${booking.special_instructions ? `
                <div class="instructions-card">
                  <h4 style="color: #B269FF; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <span>Instructions:</span>
                    <span>Special Instructions</span>
                  </h4>
                  <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-style: italic;">${booking.special_instructions}</p>
                </div>
              ` : ''}
              
              <div class="action-card">
                <h4> Required Actions</h4>
                <ul class="action-list">
                  <li>Review booking details and customer requirements</li>
                  <li>Check schedule availability for the requested time slot</li>
                  <li>Contact customer to confirm appointment details</li>
                  <li>Update booking status in the admin dashboard</li>
                  <li>Prepare equipment and materials for the service</li>
                </ul>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                  <p style="color: #9747FF; font-weight: 600; margin: 0;">Remember: Outstanding service starts with prompt communication!</p>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-brand">Love4Detailing Admin System</div>
              <div class="footer-text">
                Professional Vehicle Detailing Services<br>
                Admin Notification System<br><br>
                This is an automated admin alert.<br>
                Please access the admin dashboard to take action.
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateAdminNotificationText(booking: Booking, customerEmail: string, customerName: string): string {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours || '0')
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes || '00'} ${ampm}`
    }

    return `
 NEW BOOKING ALERT - Love4Detailing Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PRIORITY: HIGH - Action Required Within 24 Hours

CUSTOMER INFORMATION:
Name: ${customerName}
Email: ${customerEmail}

BOOKING DETAILS:
Reference: ${booking.booking_reference}
Date: ${formatDate(booking.scheduled_date)}
Time: ${formatTime(booking.scheduled_start_time)}
Duration: ${booking.estimated_duration} minutes

VEHICLE INFORMATION:
${booking.vehicle_details?.make} ${booking.vehicle_details?.model}${booking.vehicle_details?.year ? ` (${booking.vehicle_details.year})` : ''}${booking.vehicle_details?.color ? `\nColor: ${booking.vehicle_details.color}` : ''}${booking.vehicle_details?.registration ? `\nRegistration: ${booking.vehicle_details.registration}` : ''}

📍 SERVICE LOCATION:
${booking.service_address?.address_line_1}${booking.service_address?.address_line_2 ? `\n${booking.service_address.address_line_2}` : ''}
${booking.service_address?.city}, ${booking.service_address?.postcode}${booking.distance_km ? `\nDistance: ${booking.distance_km} km` : ''}

 SERVICE VALUE: £${booking.total_price}

${booking.special_instructions ? `Instructions: SPECIAL INSTRUCTIONS:\n${booking.special_instructions}\n\n` : ''}
 REQUIRED ACTIONS:
-  Review booking details and customer requirements
-  Check schedule availability for requested time slot
-  Contact customer to confirm appointment details
- Update booking status in admin dashboard
- Prepare equipment and materials for service

Remember: Outstanding service starts with prompt communication!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Love4Detailing Admin System
Professional Vehicle Detailing Services
    `
  }

  private generateStatusUpdateHTML(customerName: string, booking: Partial<Booking>, previousStatus: string, updateReason?: string): string {
    const statusMessages = {
      confirmed: 'Booking Confirmed',
      cancelled: 'Booking Cancelled',
      completed: 'Service Completed',
      in_progress: 'Service In Progress',
      rescheduled: 'Booking Rescheduled',
      declined: 'Booking Declined',
      processing: 'Payment Processing',
      payment_failed: 'Payment Issue',
      no_show: 'Appointment Missed'
    }

    const statusSubtitles = {
      confirmed: 'Your appointment has been confirmed and scheduled',
      cancelled: 'Your booking has been cancelled',
      completed: 'Thank you for choosing Love 4 Detailing',
      in_progress: 'Our team is currently working on your vehicle',
      rescheduled: 'Your appointment has been moved to a new time',
      declined: 'We apologize, but we cannot accommodate this booking',
      processing: 'Your payment is being processed',
      payment_failed: 'There was an issue with your payment',
      no_show: 'We were unable to complete your appointment'
    }

    const headerType = (() => {
      const st = booking.status || 'confirmed'
      if (['confirmed', 'completed'].includes(st)) return 'success'
      if (['cancelled', 'declined', 'payment_failed', 'no_show'].includes(st)) return 'error'
      if (['processing', 'in_progress'].includes(st)) return 'warning'
      return 'default'
    })()

    const title = statusMessages[booking.status as keyof typeof statusMessages] || 'Booking Status Update'
    const subtitle = statusSubtitles[booking.status as keyof typeof statusSubtitles] || 'Your booking status has been updated'

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; margin: 0;">Dear ${customerName},</p>
        <p style="color: #ffffff; font-size: 18px; margin: 16px 0 0 0; font-weight: 500;">We wanted to update you about your booking status.</p>
      </div>
      
      <div class="content-card">
        <div class="card-content">
          <div class="detail-row" style="border-bottom: none; margin: 0;">
            <div class="detail-icon"></div>
            <div class="detail-content">
              <div class="detail-label">Status Change</div>
              <div class="detail-value">
                <strong>${this.getStatusDisplayName(previousStatus)}</strong> 
                <span style="color: rgba(255, 255, 255, 0.6); margin: 0 12px;">- </span>
                <strong style="color: #9747FF;">${this.getStatusDisplayName((booking.status || 'confirmed') as string)}</strong>
              </div>
              ${updateReason ? `
                <div style="margin-top: 12px; padding: 12px; background: rgba(151, 71, 255, 0.05); border-radius: 8px; border-left: 3px solid #9747FF;">
                  <div style="font-size: 13px; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Reason</div>
                  <div style="color: rgba(255, 255, 255, 0.9); font-style: italic;">${updateReason}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
      
      ${this.generateBookingDetailsCard(booking)}
      
      ${this.getStatusSpecificContent((booking.status || 'confirmed') as string)}
      
      <div class="content-card" style="text-align: center;">
        <div class="card-content">
          <h4 style="color: #B269FF; margin-bottom: 16px;">Questions or concerns?</h4>
          <p style="margin-bottom: 12px;"> <a href="mailto:${this.config.adminEmail}" class="footer-link">${this.config.adminEmail}</a></p>
          <p style="margin-bottom: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">We're always here to help!</p>
        </div>
      </div>
    `

    return this.generateUnifiedEmailHTML({
      title: 'Booking Status Update - Love 4 Detailing',
      header: {
        title,
        subtitle,
        type: headerType
      },
      content
    })
  }

  private getStatusSpecificContent(status: string): string {
    switch (status) {
      case 'confirmed':
        return `
          <div class="highlight-card">
            <h4> Your booking is confirmed!</h4>
            <p style="margin-bottom: 16px;">We look forward to providing you with exceptional service. To ensure everything goes smoothly:</p>
            <p style="margin-bottom: 12px;">✓ Ensure access to water and electricity is available</p>
            <p style="margin-bottom: 12px;">✓ Make sure the vehicle is accessible at the scheduled time</p>
            <p style="margin-bottom: 12px;">✓ Any special instructions have been noted</p>
            <p style="margin-bottom: 0;">✓ Our team will arrive with all necessary equipment</p>
          </div>
        `
      
      case 'completed':
        return `
          <div class="highlight-card">
            <h4>Thank you for choosing Love 4 Detailing!</h4>
            <p style="margin-bottom: 16px;">We hope you're absolutely delighted with the results! Your vehicle should now look and feel amazing.</p>
            <p style="margin-bottom: 12px;"> <strong>We'd love to hear from you:</strong> How did we do?</p>
            <p style="margin-bottom: 12px;"><strong>Share your experience:</strong> Tag us on social media with before/after photos</p>
            <p style="margin-bottom: 0;"> <strong>Future bookings:</strong> Regular maintenance keeps your vehicle looking its best</p>
          </div>
        `
      
      case 'in_progress':
        return `
          <div class="highlight-card">
            <h4>Service in Progress!</h4>
            <p style="margin-bottom: 16px;">Our professional team is currently working on your vehicle with care and attention to detail.</p>
            <p style="margin-bottom: 12px;">Estimated completion: <strong>Estimated completion:</strong> We'll notify you when finished</p>
            <p style="margin-bottom: 0;">Progress updates: <strong>Progress updates:</strong> Before and after photos will be provided</p>
          </div>
        `
      
      case 'cancelled':
        return `
          <div class="highlight-card">
            <h4>We're sorry your booking was cancelled</h4>
            <p style="margin-bottom: 16px;">We understand this may be disappointing. If you'd like to reschedule or have any questions, please don't hesitate to contact us.</p>
            <p style="margin-bottom: 0;">💜 We'd love to serve you in the future when the timing is right.</p>
          </div>
        `
      
      case 'declined':
        return `
          <div class="highlight-card">
            <h4>Alternative booking options</h4>
            <p style="margin-bottom: 16px;">While we couldn't accommodate this specific booking, we'd love to find an alternative that works for both of us.</p>
            <p style="margin-bottom: 12px;"> <strong>Try different dates:</strong> We may have availability at other times</p>
            <p style="margin-bottom: 0;"><strong>Contact us directly:</strong> Let's discuss options that might work better</p>
          </div>
        `
      
      default:
        return ''
    }
  }

  private generateStatusUpdateText(customerName: string, booking: Partial<Booking>, previousStatus: string, updateReason?: string): string {
    const statusMessages = {
      confirmed: 'Your booking has been confirmed!',
      cancelled: 'Your booking has been cancelled',
      completed: 'Your booking has been completed!',
      in_progress: 'Your booking is now in progress'
    }

    const message = statusMessages[booking.status as keyof typeof statusMessages] || 'Your booking status has been updated'

    return `
BOOKING STATUS UPDATE - Love 4 Detailing

Dear ${customerName},

${message}

Booking Reference: ${booking.booking_reference}
Previous Status: ${previousStatus}
New Status: ${booking.status}
${updateReason ? `Reason: ${updateReason}` : ''}

${booking.status === 'confirmed' ? `
Your booking is confirmed! Please ensure:
- Access to water and electricity is available
- The vehicle is accessible at the scheduled time
- Any special instructions have been noted
` : ''}

${booking.status === 'completed' ? `
Thank you for choosing Love 4 Detailing! We hope you're delighted with the results. 
If you have any feedback or would like to book another service, please don't hesitate to contact us.
` : ''}

If you have any questions, please contact us at ${this.config.adminEmail}

---
Love 4 Detailing - Professional Vehicle Detailing Services
    `
  }

  private generatePasswordSetupHTML(customerName: string, setupUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Complete Your Account Setup</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 0; background: #0a0a0a; }
            .header { background: linear-gradient(135deg, #9747FF 0%, #B269FF 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #1a1a1a; padding: 30px; }
            .setup-box { background: #252525; border-radius: 12px; padding: 30px; margin: 25px 0; border: 1px solid rgba(151, 71, 255, 0.3); text-align: center; }
            .setup-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #9747FF, #B269FF); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .setup-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(151, 71, 255, 0.3); }
            .highlight { background: rgba(151, 71, 255, 0.1); border: 1px solid rgba(151, 71, 255, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: rgba(255, 255, 255, 0.5); font-size: 12px; background: #0a0a0a; padding: 25px; }
            .warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.getLogoUrl()}" alt="Love 4 Detailing" style="width: 48px; height: 48px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));" />
            </div>
            <h1> Welcome to Love 4 Detailing!</h1>
            <p>Complete your account setup to manage your bookings</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>Thank you for booking with Love 4 Detailing! We've created an account for you to make it easier to:</p>
            <ul>
              <li>View your booking history</li>
              <li>Track your current bookings</li>
              <li>Save your vehicle and address details</li>
              <li>Book future services faster</li>
              <li>Manage your notification preferences</li>
            </ul>
            
            <div class="setup-box">
              <h3>🔐 Set Up Your Password</h3>
              <p>To access your account, please set up a secure password by clicking the button below:</p>
              
              <a href="${setupUrl}" class="setup-button">Set Up My Password</a>
              
              <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                This link will expire in 24 hours for security reasons.
              </p>
            </div>
            
            <div class="highlight">
              <h4>Your Account Benefits:</h4>
              <ul>
                <li><strong>Quick Rebooking:</strong> Your vehicle and address details are saved</li>
                <li><strong>Booking History:</strong> View all your past and upcoming services</li>
                <li><strong>Service Reminders:</strong> Get notified about upcoming appointments</li>
                <li><strong>Exclusive Offers:</strong> Receive member-only promotions</li>
              </ul>
            </div>
            
            <div class="warning">
              <h4>Important: Important Security Notice</h4>
              <p>If you didn't create this account or book a service with us, please ignore this email. The account will be automatically removed if not activated within 7 days.</p>
            </div>
            
            <p>If you have any questions about your account or booking, please don't hesitate to contact us at ${this.config.adminEmail}</p>
            
            <p>Welcome to the Love 4 Detailing family!</p>
          </div>
          
          <div class="footer">
            <p>Love 4 Detailing - Professional Vehicle Detailing Services</p>
            <p>If you can't click the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #64748b;">${setupUrl}</p>
          </div>
        </body>
      </html>
    `
  }

  private generatePasswordSetupText(customerName: string, setupUrl: string): string {
    return `
WELCOME TO LOVE 4 DETAILING!

Dear ${customerName},

Thank you for booking with Love 4 Detailing! We've created an account for you to make managing your bookings easier.

ACCOUNT BENEFITS:
- View your booking history
- Track current bookings  
- Save vehicle and address details
- Book future services faster
- Manage notification preferences

SET UP YOUR PASSWORD:
To access your account, please set up a secure password by visiting this link:
${setupUrl}

This link will expire in 24 hours for security reasons.

YOUR ACCOUNT INCLUDES:
✓ Quick Rebooking - Your details are saved
✓ Booking History - View all past and upcoming services  
✓ Service Reminders - Get notified about appointments
✓ Exclusive Offers - Receive member-only promotions

SECURITY NOTICE:
If you didn't create this account or book a service with us, please ignore this email. The account will be automatically removed if not activated within 7 days.

If you have any questions, please contact us at ${this.config.adminEmail}

Welcome to the Love 4 Detailing family!

---
Love 4 Detailing - Professional Vehicle Detailing Services

If you can't click the link above, copy and paste it into your browser:
${setupUrl}
    `
  }

  private generateBookingDeclineHTML(customerName: string, booking: Booking, declineReason: string, additionalNotes?: string): string {
    // Narrow booking shape for email formatting
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type AddressInfo = { address_line_1?: string; city?: string; postal_code?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      vehicle?: VehicleInfo
      address?: AddressInfo
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services)
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.vehicle
        ? `${eb.vehicle_details?.year || eb.vehicle?.year || ''} ${eb.vehicle_details?.make || eb.vehicle?.make || ''} ${eb.vehicle_details?.model || eb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      address: eb.address
        ? `${eb.address.address_line_1 || ''}, ${eb.address.city || ''} ${eb.address.postal_code || ''}`.trim()
        : 'Address not specified',
      totalPrice: booking.total_price ? `£${Number(booking.total_price).toFixed(2)}` : null
    }

    return this.generateUnifiedEmailHTML({
      title: '😞 Booking Update Required',
      header: {
        title: '😞 Booking Update Required',
        subtitle: `We need to discuss your booking ${bookingDetails.reference}`,
        type: 'warning'
      },
      content: `
        <!-- Empathetic Greeting -->
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #374151; font-weight: 400;">Dear ${customerName},</p>
        
        <!-- Empathetic Message -->
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 48px; margin: 0 0 16px 0;">💔</div>
          <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">We're Really Sorry</h2>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Unfortunately, we're unable to fulfill your booking request as originally planned. We know this is disappointing, and we sincerely apologize for any inconvenience this causes.
          </p>
        </div>

        <!-- Booking Details Card -->
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;"> Your Booking Details</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Booking Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace; text-align: right;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Service Requested</span>
              <span style="color: #111827; font-weight: 500; text-align: right; max-width: 200px;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Vehicle</span>
              <span style="color: #111827; font-weight: 500; text-align: right; max-width: 200px;">${bookingDetails.vehicle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Requested Date & Time</span>
              <span style="color: #6b7280; text-align: right; max-width: 200px;">
                ${this.formatEmailDate(booking.scheduled_date)}<br>
                <strong>${this.formatEmailTime(booking.scheduled_start_time)}</strong>
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Location</span>
              <span style="color: #111827; font-weight: 500; text-align: right; max-width: 200px;">${bookingDetails.address}</span>
            </div>
            ${bookingDetails.totalPrice ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Total Price</span>
              <span style="color: #9747FF; font-weight: 700; font-size: 18px; text-align: right;">${bookingDetails.totalPrice}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Current Status</span>
              <span style="color: #dc2626; font-weight: 600; text-align: right;">Unable to Fulfill</span>
            </div>
          </div>
        </div>

        <!-- Reason Card -->
        <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #dc2626; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Instructions: Why We Can't Fulfill This Booking</h3>
          <div style="background: white; border-radius: 8px; padding: 20px; border-left: 4px solid #dc2626;">
            <p style="color: #374151; margin: 0; font-size: 16px; font-weight: 600; font-style: italic;">
              "${declineReason}"
            </p>
            ${additionalNotes ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px; font-weight: 500;">
                <strong>Additional Information:</strong><br>
                ${additionalNotes}
              </p>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Solutions Section -->
        <div style="background: #f0f9f4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #059669; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"> Let's Find You a Solution!</h3>
          <p style="color: #374151; margin: 0 0 20px 0; font-size: 16px;">
            We're committed to providing you with exceptional service. Here are the best ways we can help:
          </p>
          
          <div style="margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <span style="background: #059669; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; margin-right: 12px; flex-shrink: 0;">1</span>
              <div>
                <h4 style="color: #059669; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Try Alternative Dates & Times</h4>
                <p style="color: #374151; margin: 0; font-size: 14px;">Visit our booking page to see all available slots that might work better for your schedule.</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <span style="background: #059669; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; margin-right: 12px; flex-shrink: 0;">2</span>
              <div>
                <h4 style="color: #059669; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Speak Directly With Our Team</h4>
                <p style="color: #374151; margin: 0; font-size: 14px;">Contact us directly and we'll work together to find the perfect solution for your vehicle detailing needs.</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start;">
              <span style="background: #059669; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; margin-right: 12px; flex-shrink: 0;">3</span>
              <div>
                <h4 style="color: #059669; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">Join Our Priority List</h4>
                <p style="color: #374151; margin: 0; font-size: 14px;">We'll notify you first when slots open up that match your original preferences.</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 24px 0 0 0; padding: 20px; background: white; border-radius: 8px;">
            <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
               <strong>Ready to get started?</strong>
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Reply to this email or contact us at <a href="mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}" style="color: #9747FF; text-decoration: none; font-weight: 600;">${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}</a>
            </p>
          </div>
        </div>

        <!-- Personal Message -->
        <div style="margin: 32px 0; padding: 24px; background: #f8f4ff; border-radius: 12px; border-left: 4px solid #9747FF;">
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
            We genuinely appreciate you choosing Love 4 Detailing for your vehicle care needs. While we couldn't make this particular booking work, we're dedicated to finding a way to serve you.
          </p>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Your satisfaction is our priority, and we're confident we can find an arrangement that works perfectly for both of us.
          </p>
        </div>

        <!-- Contact Information -->
        <div style="border-top: 2px solid #e5e7eb; padding-top: 24px; margin-top: 40px;">
          <h4 style="color: #111827; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">💬 Get In Touch</h4>
          <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
            Our team is standing by to help you reschedule:<br>
            <strong style="color: #374151;"> Email:</strong> <a href="mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}" style="color: #9747FF; text-decoration: none;">${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}</a><br>
            <strong style="color: #374151;">Response Time:</strong> Within 24 hours<br>
            <strong style="color: #374151;">🌐 Website:</strong> <a href="https://love4detailing.com" style="color: #9747FF; text-decoration: none;">love4detailing.com</a>
          </p>
        </div>
        
        <p style="color: #374151; margin: 32px 0 0 0; font-size: 16px;">
          Thank you for your understanding and patience.<br>
          <strong>The Love 4 Detailing Team</strong>
        </p>
      `
    })
  }

  private generateBookingDeclineText(customerName: string, booking: Booking, declineReason: string, additionalNotes?: string): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type AddressInfo = { address_line_1?: string; city?: string; postal_code?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      vehicle?: VehicleInfo
      address?: AddressInfo
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services)
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.vehicle
        ? `${eb.vehicle_details?.year || eb.vehicle?.year || ''} ${eb.vehicle_details?.make || eb.vehicle?.make || ''} ${eb.vehicle_details?.model || eb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      address: eb.address
        ? `${eb.address.address_line_1 || ''}, ${eb.address.city || ''} ${eb.address.postal_code || ''}`.trim()
        : 'Address not specified',
      totalPrice: booking.total_price ? `£${Number(booking.total_price).toFixed(2)}` : null
    }

    return `
😞 BOOKING UPDATE REQUIRED - Love 4 Detailing
We need to discuss your booking ${bookingDetails.reference}

Dear ${customerName},

💔 WE'RE REALLY SORRY
Unfortunately, we're unable to fulfill your booking request as originally planned. We know this is disappointing, and we sincerely apologize for any inconvenience this causes.

YOUR BOOKING DETAILS:
- Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
- Date: ${this.formatEmailDate(booking.scheduled_date)}
- Time: ${this.formatEmailTime(booking.scheduled_start_time)}
- Location: ${bookingDetails.address}
${bookingDetails.totalPrice ? `- Total Price: ${bookingDetails.totalPrice}` : ''}
- Current Status: Unable to Fulfill

Instructions: WHY WE CAN'T FULFILL THIS BOOKING:
"${declineReason}"
${additionalNotes ? `\nAdditional Information: ${additionalNotes}` : ''}

 LET'S FIND YOU A SOLUTION!
We're committed to providing you with exceptional service. Here are the best ways we can help:

1. Try Alternative Dates & Times
   Visit our booking page to see all available slots that might work better for your schedule.

2. Speak Directly With Our Team
   Contact us directly and we'll work together to find the perfect solution for your vehicle detailing needs.

3. Join Our Priority List
   We'll notify you first when slots open up that match your original preferences.

 READY TO GET STARTED?
Reply to this email or contact us at ${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}

PERSONAL MESSAGE FROM OUR TEAM:
We genuinely appreciate you choosing Love 4 Detailing for your vehicle care needs. While we couldn't make this particular booking work, we're dedicated to finding a way to serve you. Your satisfaction is our priority, and we're confident we can find an arrangement that works perfectly for both of us.

💬 GET IN TOUCH:
 Email: ${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}
Response Time: Within 24 hours
🌐 Website: love4detailing.com

Thank you for your understanding and patience.

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Premium Mobile Detailing Services
    `.trim()
  }

  // Admin reschedule request notification templates
  private generateAdminRescheduleRequestHTML(
    booking: any,
    customerName: string,
    customerEmail: string,
    requestedDate: string,
    requestedTime: string,
    reason?: string
  ): string {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours || '0')
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes || '00'} ${ampm}`
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reschedule Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 0; background: #0a0a0a; }
            .header { background: linear-gradient(135deg, #9747FF 0%, #B269FF 100%); color: white; padding: 30px; text-align: center; }
            .content { background: #1a1a1a; padding: 30px; }
            .booking-details { background: #252525; border-radius: 12px; padding: 25px; margin: 20px 0; border: 1px solid rgba(151, 71, 255, 0.3); }
            .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            .detail-label { font-weight: 600; color: rgba(255, 255, 255, 0.7); }
            .detail-value { color: #ffffff; }
            .highlight { background: rgba(151, 71, 255, 0.1); border: 1px solid rgba(151, 71, 255, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: rgba(255, 255, 255, 0.5); font-size: 12px; background: #0a0a0a; padding: 25px; }
            .cta-button { background: linear-gradient(135deg, #9747FF, #B269FF); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.getLogoUrl()}" alt="Love 4 Detailing" style="width: 48px; height: 48px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));" />
            </div>
            <h1> Reschedule Request</h1>
            <p>Customer requesting to reschedule booking</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <strong>Action Required:</strong> A customer has requested to reschedule their booking.
            </div>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span class="detail-value">${String((booking as Partial<Booking>).booking_reference ?? '')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${customerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Current Date:</span>
                <span class="detail-value">${formatDate((booking as Partial<Booking>).scheduled_date as string)} at ${formatTime((booking as Partial<Booking>).scheduled_start_time as string)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested Date:</span>
                <span class="detail-value">${formatDate(requestedDate)} at ${formatTime(requestedTime)}</span>
              </div>
              ${reason ? `
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${reason}</span>
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p><strong>Please log into the admin dashboard to respond to this request.</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from Love 4 Detailing</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateAdminRescheduleRequestText(
    booking: any,
    customerName: string,
    customerEmail: string,
    requestedDate: string,
    requestedTime: string,
    reason?: string
  ): string {
    return `
RESCHEDULE REQUEST - ACTION REQUIRED

A customer has requested to reschedule their booking.

BOOKING DETAILS:
Booking Reference: ${String((booking as Partial<Booking>).booking_reference ?? '')}
Customer: ${customerName}
Email: ${customerEmail}
Current Date: ${String((booking as Partial<Booking>).scheduled_date ?? '')} at ${String((booking as Partial<Booking>).scheduled_start_time ?? '')}
Requested Date: ${requestedDate} at ${requestedTime}
${reason ? `Reason: ${reason}` : ''}

Please log into the admin dashboard to respond to this request.

---
Love 4 Detailing - Admin Notifications
    `
  }

  // Send custom email
  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [to],
        replyTo: this.config.replyToEmail,
        subject,
        html,
        text: text || ''
      })

      if (error) {
        logger.error('Custom email send error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      logger.error('Custom email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Unified email template system for consistent branding
  private generateUnifiedEmailHTML({
    title,
    header,
    content,
    footer
  }: {
    title: string
    header: {
      title: string
      subtitle?: string
      type?: 'default' | 'success' | 'warning' | 'error'
    }
    content: string
    footer?: string
  }): string {
    const headerGradient = {
      default: 'linear-gradient(135deg, #9747FF 0%, #B269FF 100%)',
      success: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      warning: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      error: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    }[header.type || 'default']

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="x-apple-disable-message-reformatting">
          <meta name="color-scheme" content="dark">
          <meta name="supported-color-schemes" content="dark">
          <title>${title}</title>
          <style>
            ${this.getUnifiedEmailStyles()}
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header Section -->
            <div class="email-header" style="background: ${headerGradient};">
              <div class="brand-logo">
                <img src="${this.getLogoUrl()}" alt="Love 4 Detailing" class="logo-icon" style="width: 64px; height: 64px; object-fit: contain;" />
              </div>
              <h1 class="header-title">${header.title}</h1>
              ${header.subtitle ? `<p class="header-subtitle">${header.subtitle}</p>` : ''}
            </div>
            
            <!-- Content Section -->
            <div class="email-content">
              ${content}
            </div>
            
            <!-- Footer Section -->
            <div class="email-footer">
              ${footer || this.getDefaultFooter()}
            </div>
          </div>
        </body>
      </html>
    `
  }

  private getUnifiedEmailStyles(): string {
    return `
      /* Reset and base styles */
      * { 
        box-sizing: border-box; 
        margin: 0; 
        padding: 0; 
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: #ffffff; 
        background: #0a0a0a; 
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      
      /* Email container */
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #0a0a0a; 
        min-height: 100vh; 
      }
      
      /* Header styles */
      .email-header { 
        padding: 40px 30px; 
        text-align: center; 
        color: white; 
      }
      
      .brand-logo { 
        display: inline-flex; 
        align-items: center; 
        gap: 12px; 
        margin-bottom: 24px; 
      }
      
      .logo-icon { 
        width: 48px; 
        height: 48px; 
        border-radius: 12px; 
        display: block;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .logo-text { 
        font-size: 28px; 
        font-weight: 800; 
        background: linear-gradient(to right, #ffffff, #e5e7eb); 
        background-clip: text; 
        -webkit-background-clip: text; 
        -webkit-text-fill-color: transparent; 
        letter-spacing: -0.5px;
      }
      
      .header-title { 
        margin: 0 0 12px 0; 
        font-size: 32px; 
        font-weight: 700; 
        line-height: 1.2;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .header-subtitle { 
        color: rgba(255, 255, 255, 0.85); 
        font-size: 16px; 
        margin: 0;
        font-weight: 400;
      }
      
      /* Content styles */
      .email-content { 
        background: #1a1a1a; 
        padding: 40px 30px; 
        border-top: 1px solid rgba(151, 71, 255, 0.1);
      }
      
      /* Card components */
      .content-card { 
        background: #252525; 
        border-radius: 16px; 
        overflow: hidden; 
        margin: 25px 0; 
        border: 1px solid rgba(151, 71, 255, 0.15); 
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .card-header { 
        background: linear-gradient(135deg, rgba(151, 71, 255, 0.08), rgba(178, 105, 255, 0.06)); 
        padding: 24px; 
        border-bottom: 1px solid rgba(151, 71, 255, 0.1); 
      }
      
      .card-content { 
        padding: 32px 24px; 
      }
      
      /* Detail rows */
      .detail-row { 
        display: flex; 
        align-items: flex-start; 
        margin: 20px 0; 
        padding: 16px 0; 
        border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
      }
      
      .detail-row:last-child { 
        border-bottom: none; 
      }
      
      .detail-icon { 
        width: 24px; 
        height: 24px; 
        margin-right: 16px; 
        font-size: 18px; 
        flex-shrink: 0; 
        margin-top: 2px; 
        opacity: 0.8;
      }
      
      .detail-content { 
        flex: 1; 
      }
      
      .detail-label { 
        font-weight: 600; 
        color: rgba(255, 255, 255, 0.7); 
        font-size: 14px; 
        margin-bottom: 6px; 
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .detail-value { 
        color: #ffffff; 
        font-size: 16px; 
        line-height: 1.5; 
        font-weight: 500;
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 { 
        margin: 0; 
        color: #ffffff; 
        font-weight: 700;
        line-height: 1.3;
      }
      
      p { 
        margin: 16px 0; 
        color: rgba(255, 255, 255, 0.9); 
        font-size: 16px;
        line-height: 1.6;
      }
      
      /* Buttons */
      .btn { 
        display: inline-block; 
        padding: 16px 32px; 
        background: linear-gradient(135deg, #9747FF, #B269FF); 
        color: white; 
        text-decoration: none; 
        border-radius: 12px; 
        font-weight: 600; 
        font-size: 16px; 
        margin: 20px 0; 
        box-shadow: 0 4px 14px rgba(151, 71, 255, 0.25);
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        text-align: center;
        min-height: 44px;
      }
      
      .btn:hover { 
        transform: translateY(-2px); 
        box-shadow: 0 6px 20px rgba(151, 71, 255, 0.35); 
        text-decoration: none;
      }
      
      .btn-secondary { 
        background: #252525; 
        border: 2px solid rgba(151, 71, 255, 0.3); 
        box-shadow: none;
      }
      
      .btn-secondary:hover { 
        border-color: rgba(151, 71, 255, 0.5); 
        background: rgba(151, 71, 255, 0.1);
      }
      
      /* Status and highlights */
      .status-badge { 
        display: inline-block; 
        background: rgba(151, 71, 255, 0.15); 
        color: #B269FF; 
        padding: 8px 16px; 
        border-radius: 20px; 
        font-size: 13px; 
        font-weight: 600; 
        border: 1px solid rgba(151, 71, 255, 0.25);
        text-transform: capitalize;
      }
      
      .highlight-card { 
        background: rgba(151, 71, 255, 0.08); 
        border: 1px solid rgba(151, 71, 255, 0.2); 
        border-radius: 16px; 
        padding: 24px; 
        margin: 24px 0; 
      }
      
      .highlight-card h4 { 
        color: #B269FF; 
        margin: 0 0 16px 0; 
        font-size: 18px; 
      }
      
      .price-highlight { 
        color: #9747FF; 
        font-size: 24px; 
        font-weight: 700; 
      }
      
      /* Footer styles */
      .email-footer { 
        background: #0a0a0a; 
        padding: 32px 30px; 
        text-align: center; 
        border-top: 1px solid rgba(255, 255, 255, 0.05); 
      }
      
      .footer-brand { 
        color: #9747FF; 
        font-weight: 700; 
        font-size: 18px;
        margin-bottom: 12px; 
      }
      
      .footer-text { 
        color: rgba(255, 255, 255, 0.5); 
        font-size: 13px; 
        line-height: 1.6; 
        margin: 8px 0;
      }
      
      .footer-link { 
        color: #B269FF; 
        text-decoration: none; 
      }
      
      .footer-link:hover { 
        text-decoration: underline; 
      }
      
      /* Mobile responsive styles */
      @media only screen and (max-width: 480px) {
        .email-header, .email-content, .email-footer { 
          padding: 24px 20px !important; 
        }
        
        .card-content, .card-header { 
          padding: 20px !important; 
        }
        
        .header-title { 
          font-size: 26px !important; 
        }
        
        .logo-text { 
          font-size: 22px !important; 
        }
        
        .logo-icon { 
          width: 40px !important; 
          height: 40px !important; 
        }
        
        .detail-row { 
          flex-direction: column; 
          align-items: flex-start; 
        }
        
        .detail-icon { 
          margin-bottom: 8px; 
          margin-right: 0; 
        }
        
        .btn { 
          padding: 14px 24px !important; 
          font-size: 15px !important; 
          width: 100% !important;
          text-align: center;
        }
        
        p, .detail-value { 
          font-size: 15px !important; 
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        body { 
          background: #0a0a0a !important; 
          color: #ffffff !important; 
        }
      }
    `
  }

  private getDefaultFooter(): string {
    return `
      <div class="footer-brand">Love 4 Detailing</div>
      <p class="footer-text">
        Premium Mobile Car Detailing Services<br>
        Transforming vehicles, exceeding expectations
      </p>
      <p class="footer-text">
         <a href="mailto:${this.config.adminEmail}" class="footer-link">${this.config.adminEmail}</a><br>
        🌐 Professional car detailing at your location
      </p>
      <p class="footer-text" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        This email was sent from an automated system.<br>
        Please do not reply directly to this message.
      </p>
    `
  }

  // Standardized data formatting utilities for emails
  private formatEmailDate(dateStr: string | undefined | null): string {
    if (!dateStr) return 'Date not specified'
    
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  private formatEmailTime(timeStr: string | undefined | null): string {
    if (!timeStr) return 'Time not specified'
    
    try {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours || '0')
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes || '00'} ${ampm}`
    } catch {
      return 'Invalid time'
    }
  }

  private formatEmailPrice(price: number | string | undefined | null): string {
    if (price === null || price === undefined) return 'Price not specified'
    
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numericPrice)) return 'Invalid price'
    
    return `£${numericPrice.toFixed(2)}`
  }

  private formatVehicleDetails(vehicle: { make?: string; model?: string; year?: number; color?: string } | null | undefined): string {
    if (!vehicle) return 'Vehicle details not specified'
    
    const parts: string[] = []
    
    if (vehicle?.make) parts.push(vehicle.make)
    if (vehicle?.model) parts.push(vehicle.model)
    if (vehicle?.year) parts.push(`(${vehicle.year})`)
    if (vehicle?.color) parts.push(`- ${vehicle.color}`)
    
    return parts.length > 0 ? parts.join(' ') : 'Vehicle details not specified'
  }

  private formatAddress(address: { address_line_1?: string; address_line_2?: string | null; city?: string; postcode?: string } | null | undefined): string {
    if (!address) return 'Address not specified'
    
    const parts: string[] = []
    
    if (address?.address_line_1) parts.push(address.address_line_1)
    if (address?.address_line_2) parts.push(address.address_line_2)
    if (address?.city && address?.postcode) {
      parts.push(`${address.city}, ${address.postcode}`)
    } else if (address?.city) {
      parts.push(address.city)
    } else if (address?.postcode) {
      parts.push(address.postcode)
    }
    
    return parts.length > 0 ? parts.join('<br>') : 'Address not specified'
  }

  private formatServices(services: Array<string | { name?: string; base_price?: number; price?: number }> | null | undefined): string {
    if (!services || services.length === 0) return 'No services specified'
    
    return services
      .map((service) => {
        if (typeof service === 'string') return service
        if (service?.name) {
          const price = service?.base_price || service?.price
          return price ? `${service.name} (${this.formatEmailPrice(price)})` : service.name
        }
        return 'Service not specified'
      })
      .join('<br>')
  }

  private getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Awaiting Confirmation',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rescheduled': 'Rescheduled',
      'no_show': 'No Show',
      'processing': 'Processing Payment',
      'payment_failed': 'Payment Failed',
      'declined': 'Declined'
    }
    
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  private generateBookingDetailsCard(booking: Partial<Booking>): string {
    return `
      <div class="content-card">
        <div class="card-header">
          <h3 style="color: #9747FF; font-size: 20px; margin: 0 0 8px 0;">${booking.booking_reference || 'Reference not available'}</h3>
          <div class="status-badge">${this.getStatusDisplayName((booking.status || 'unknown') as string)}</div>
        </div>
        
        <div class="card-content">
          <div class="detail-row">
            <div class="detail-icon"></div>
            <div class="detail-content">
              <div class="detail-label">Date</div>
              <div class="detail-value">${this.formatEmailDate(booking.scheduled_date as string)}</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-icon">Time</div>
            <div class="detail-content">
              <div class="detail-label">Time</div>
              <div class="detail-value">${this.formatEmailTime(booking.scheduled_start_time as string)}</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-icon"></div>
            <div class="detail-content">
              <div class="detail-label">Vehicle</div>
              <div class="detail-value">${this.formatVehicleDetails(booking.vehicle_details as unknown as { make?: string; model?: string; year?: number; color?: string; registration?: string })}</div>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-icon">📍</div>
            <div class="detail-content">
              <div class="detail-label">Location</div>
              <div class="detail-value">${this.formatAddress(booking.service_address as unknown as { address_line_1?: string; address_line_2?: string | null; city?: string; county?: string | null; postal_code?: string; country?: string | null })}</div>
            </div>
          </div>
          
          ${(booking as unknown as { services?: unknown })?.services ? `
            <div class="detail-row">
              <div class="detail-icon"></div>
              <div class="detail-content">
                <div class="detail-label">Services</div>
                <div class="detail-value">${this.formatServices((booking as unknown as { services?: Array<{ name?: string } | string> }).services as Array<{ name?: string } | string>)}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="detail-row">
            <div class="detail-icon"></div>
            <div class="detail-content">
              <div class="detail-label">Total Investment</div>
              <div class="detail-value price-highlight">${this.formatEmailPrice(booking.total_price as number)}</div>
            </div>
          </div>
          
          ${(booking as unknown as { special_instructions?: string })?.special_instructions ? `
            <div class="detail-row" style="border-bottom: none;">
              <div class="detail-icon">Instructions:</div>
              <div class="detail-content">
                <div class="detail-label">Special Instructions</div>
                <div class="detail-value" style="font-style: italic; opacity: 0.9;">${(booking as unknown as { special_instructions?: string }).special_instructions}</div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  // Customer reschedule response templates using unified Love4Detailing branding
  private generateRescheduleResponseHTML(
    customerName: string,
    booking: Partial<Booking>,
    rescheduleRequest: { id: string; original_date?: string; original_time?: string; requested_date?: string; requested_time?: string; status?: string; reason?: string | null },
    action: string,
    adminResponse?: string,
    proposedDate?: string,
    proposedTime?: string
  ): string {
    const statusColors = {
      approve: '#10b981', // Success green
      reject: '#dc2626',  // Error red
      propose: '#9747FF'  // Love4Detailing purple for proposals
    }

    const statusMessages = {
      approve: 'Reschedule Request Approved',
      reject: 'Reschedule Request Declined', 
      propose: 'Alternative Time Proposed'
    }

    const statusEmojis = {
      approve: '',
      reject: '', 
      propose: '💭'
    }

    const actionColor = statusColors[action as keyof typeof statusColors] || '#9747FF'
    const headerMessage = statusMessages[action as keyof typeof statusMessages] || 'Reschedule Update'
    const headerEmoji = statusEmojis[action as keyof typeof statusEmojis] || ''

    // Format booking details for display
    type ServiceItem = { name?: string } | string
    type AddressInfo = { address_line_1?: string; address_line_2?: string | null; addressLine1?: string; addressLine2?: string | null; city?: string; postal_code?: string; postalCode?: string; postcode?: string }
    const bb = booking as Partial<Booking> & { services?: ServiceItem[]; service?: { name?: string }; vehicle?: { year?: string | number; make?: string; model?: string }; service_address?: AddressInfo; address?: AddressInfo }
    const bookingDetails = {
      reference: bb?.booking_reference || 'N/A',
      services: (Array.isArray(bb?.services) 
        ? (bb.services as ServiceItem[]).map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : (bb?.service?.name)) || 'Vehicle Detailing Service',
      vehicle: bb?.vehicle 
        ? `${bb.vehicle?.year || ''} ${bb.vehicle?.make || ''} ${bb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      totalPrice: bb?.total_price ? `£${Number(bb.total_price).toFixed(2)}` : null
    }

    // Extract address/location details (supports both shapes)
    const svcAddress = (bb?.service_address || bb?.address || {}) as AddressInfo
    const addressLine1 = svcAddress.address_line_1 || svcAddress.addressLine1 || ''
    const addressLine2 = svcAddress.address_line_2 || svcAddress.addressLine2 || ''
    const city = svcAddress.city || ''
    const postalCode = svcAddress.postal_code || svcAddress.postalCode || svcAddress.postcode || ''

    return this.generateUnifiedEmailHTML({
      title: `${headerEmoji} ${headerMessage}`,
      header: {
        title: `${headerEmoji} ${headerMessage}`,
        subtitle: `Your reschedule request for booking ${bookingDetails.reference}`,
        type: action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'default'
      },
      content: `
        <!-- Greeting -->
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #e5e7eb; font-weight: 400;">Dear ${customerName},</p>
        
        <!-- Status Message -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid ${actionColor}33; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <div style="font-size: 48px; margin: 0 0 16px 0;">${headerEmoji}</div>
          <h2 style="color: ${actionColor}; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">${headerMessage}</h2>
          <p style="color: #cbd5e1; margin: 0; font-size: 16px;">
            ${action === 'approve' ? 
              'Great news! Your reschedule request has been approved and your booking has been updated.' :
              action === 'reject' ?
              'We apologize, but we cannot accommodate your reschedule request at this time.' :
              'We\'ve proposed an alternative time that works better with our schedule.'
            }
          </p>
        </div>

        <!-- Booking Details Card -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 20px; margin: 28px 0;">
          <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
            ${action === 'approve' ? 'Updated Booking Details' : 'Booking Information'}
          </h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10);">
              <span style="font-weight: 500; color: #cbd5e1;">Booking Reference</span>
              <span style="font-weight: 700; color: #ffffff; font-family: monospace; text-align: right;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10);">
              <span style="font-weight: 500; color: #cbd5e1;">Service</span>
              <span style="color: #e5e7eb; font-weight: 500; text-align: right; max-width: 260px;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10);">
              <span style="font-weight: 500; color: #cbd5e1;">Vehicle</span>
              <span style="color: #e5e7eb; font-weight: 500; text-align: right; max-width: 260px;">${bookingDetails.vehicle}</span>
            </div>
            ${bookingDetails.totalPrice ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10);">
              <span style="font-weight: 500; color: #cbd5e1;">Total Price</span>
              <span style="color: #B269FF; font-weight: 700; font-size: 18px; text-align: right;">${bookingDetails.totalPrice}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.10);">
              <span style="font-weight: 500; color: #cbd5e1;">Original Date & Time</span>
              <span style="color: #94a3b8; text-align: right; max-width: 260px;">
                ${this.formatEmailDate((rescheduleRequest as { original_date?: string } | undefined)?.original_date as string)}<br>
                <strong>${this.formatEmailTime((rescheduleRequest as { original_time?: string } | undefined)?.original_time as string)}</strong>
              </span>
            </div>
            ${action === 'approve' ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #cbd5e1;">New Date & Time</span>
              <span style="color: #34d399; font-weight: 700; text-align: right; max-width: 260px;">
                ${this.formatEmailDate((rescheduleRequest as { requested_date?: string } | undefined)?.requested_date as string)}<br>
                <strong>${this.formatEmailTime((rescheduleRequest as { requested_time?: string } | undefined)?.requested_time as string)}</strong>
              </span>
            </div>
            ` : action === 'propose' && proposedDate && proposedTime ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #cbd5e1;">Proposed Date & Time</span>
              <span style="color: #B269FF; font-weight: 700; text-align: right; max-width: 260px;">
                ${this.formatEmailDate(proposedDate)}<br>
                <strong>${this.formatEmailTime(proposedTime)}</strong>
              </span>
            </div>
            ` : ''}
            ${(addressLine1 || city || postalCode) ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px;">
              <span style="font-weight: 500; color: #cbd5e1;">Service Address</span>
              <span style="color: #e5e7eb; text-align: right; max-width: 260px;">
                ${addressLine1 || ''}${addressLine2 ? `<br>${addressLine2}` : ''}${(city || postalCode) ? `<br>${city}${city && postalCode ? ', ' : ''}${postalCode}` : ''}
              </span>
            </div>
            ` : ''}
          </div>
        </div>

        ${adminResponse ? `
        <!-- Admin Message Card -->
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Instructions: Message from Love 4 Detailing</h3>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6; font-style: italic; border-left: 4px solid #9747FF; padding-left: 16px;">
            "${adminResponse}"
          </p>
        </div>
        ` : ''}

        <!-- Next Steps -->
        <div style="margin: 32px 0;">
          ${action === 'approve' ? `
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">
             <strong>You're all set!</strong> Your booking has been successfully rescheduled. We'll send you a reminder closer to your new appointment time.
          </p>
          <p style="color: #374151; margin: 0; font-size: 16px;">
            If you need to make any further changes, please contact us as soon as possible.
          </p>
          ` : action === 'reject' ? `
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">
             <strong>What you can do:</strong> You can submit a new reschedule request for a different date and time that might work better.
          </p>
          <p style="color: #374151; margin: 0; font-size: 16px;">
            Alternatively, feel free to contact us directly and we'll do our best to find a solution that works for both of us.
          </p>
          ` : `
          <p style="color: #374151; margin: 0 0 16px 0; font-size: 16px;">
            ❓ <strong>Does this work for you?</strong> If the proposed time works, please contact us to confirm. If not, feel free to request another time.
          </p>
          <p style="color: #374151; margin: 0; font-size: 16px;">
            We're flexible and want to find a time that works perfectly for your schedule.
          </p>
          `}
        </div>

        
      `
    })
  }

  private generateRescheduleResponseText(
    customerName: string,
    booking: unknown,
    rescheduleRequest: unknown,
    action: string,
    adminResponse?: string,
    proposedDate?: string,
    proposedTime?: string
  ): string {
    const statusMessages = {
      approve: ' APPROVED - Your reschedule request has been approved!',
      reject: ' DECLINED - Your reschedule request has been declined',
      propose: '💭 ALTERNATIVE PROPOSED - Different time suggested'
    }

    const message = statusMessages[action as keyof typeof statusMessages] || ' REQUEST UPDATED'

    // Format booking details
    type ServiceItem = { name?: string } | string
    const b2 = booking as Partial<Booking> & { services?: ServiceItem[]; service?: { name?: string }; vehicle?: { year?: string | number; make?: string; model?: string } }
    const bookingDetails = {
      reference: b2?.booking_reference || 'N/A',
      services: Array.isArray(b2?.services) 
        ? (b2.services as ServiceItem[]).map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : b2?.service?.name || 'Vehicle Detailing Service',
      vehicle: b2?.vehicle 
        ? `${b2.vehicle?.year || ''} ${b2.vehicle?.make || ''} ${b2.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      totalPrice: b2?.total_price ? `£${Number(b2.total_price).toFixed(2)}` : null
    }

    return `
${message}
Love 4 Detailing - Booking ${bookingDetails.reference}

Dear ${customerName},

${action === 'approve' ? 
` Great news! Your reschedule request has been approved and your booking has been successfully updated with the new date and time.` : 
action === 'reject' ? 
`We apologize, but we cannot accommodate your reschedule request at this time. This may be due to scheduling conflicts or availability constraints.` : 
`We've reviewed your request and proposed an alternative time that works better with our schedule. We hope this alternative works for you!`}

BOOKING DETAILS:
- Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
${bookingDetails.totalPrice ? `- Total Price: ${bookingDetails.totalPrice}` : ''}

SCHEDULING:
 - Original: ${this.formatEmailDate((rescheduleRequest as any)?.original_date)} at ${this.formatEmailTime((rescheduleRequest as any)?.original_time)}
${action === 'approve' ? `- New Time: ${this.formatEmailDate((rescheduleRequest as any)?.requested_date)} at ${this.formatEmailTime((rescheduleRequest as any)?.requested_time)}` : ''}
${action === 'propose' && proposedDate && proposedTime ? `- Proposed: ${this.formatEmailDate(proposedDate)} at ${this.formatEmailTime(proposedTime)}` : ''}

${adminResponse ? `MESSAGE FROM LOVE 4 DETAILING:\n"${adminResponse}"\n` : ''}

NEXT STEPS:
${action === 'approve' ? 
` You're all set! We'll send you a reminder closer to your new appointment time. If you need to make any further changes, please contact us as soon as possible.` : 
action === 'reject' ? 
` You can submit a new reschedule request for a different date and time, or contact us directly to discuss other options that might work better.` : 
`❓ If the proposed time works for you, please contact us to confirm. If not, feel free to request another time - we're flexible!`}

NEED HELP?
 Email: zell@love4detailing.com
Response Time: Within 24 hours

Thank you for choosing Love 4 Detailing!

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Premium Mobile Detailing Services
    `.trim()
  }

  /**
   * Generate HTML template for payment confirmation email
   */
  private generatePaymentConfirmationHTML(
    customerName: string, 
    booking: Booking, 
    paymentMethod: string,
    paymentReference: string
  ): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type AddressInfo = { address_line_1?: string; city?: string; postal_code?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      vehicle?: VehicleInfo
      address?: AddressInfo
      service_address?: AddressInfo
      time_slots?: { start_time?: string }
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services)
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.vehicle
        ? `${eb.vehicle_details?.year || eb.vehicle?.year || ''} ${eb.vehicle_details?.make || eb.vehicle?.make || ''} ${eb.vehicle_details?.model || eb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: eb.time_slots?.start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(eb.time_slots?.start_time || booking.scheduled_start_time)
        : 'Time TBC',
      address: eb.address || eb.service_address
        ? `${(eb.address || eb.service_address)?.address_line_1 || ''}, ${(eb.address || eb.service_address)?.city || ''} ${(eb.address || eb.service_address)?.postal_code || ''}`.trim()
        : 'Address not specified',
      totalPrice: this.formatPrice(booking.total_price)
    }

    const paymentMethodDisplay = {
      'paypal': 'PayPal',
      'cash': 'Cash',
      'card': 'Card',
      'bank_transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod

    return this.generateUnifiedEmailHTML({
      title: ' Payment Confirmed!',
      header: {
        title: ' Payment Received Successfully!',
        subtitle: `Your booking ${bookingDetails.reference} is fully confirmed`,
        type: 'success'
      },
      content: `
        <!-- Confirmation Message -->
        <p style="font-size: 16px; margin: 0 0 24px 0; color: #374151; font-weight: 400;">Dear ${customerName},</p>
        
        <!-- Success Celebration -->
        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 48px; margin: 0 0 16px 0;"></div>
          <h2 style="color: #16a34a; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Payment Successfully Received!</h2>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Thank you for your payment! Your booking is now fully confirmed and we're excited to provide you with exceptional vehicle detailing service.
          </p>
        </div>

        <!-- Payment Details -->
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;"> Payment Details</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Payment Method</span>
              <span style="font-weight: 600; color: #16a34a;">${paymentMethodDisplay}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Payment Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${paymentReference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Amount Paid</span>
              <span style="font-weight: 700; color: #16a34a; font-size: 18px;">${bookingDetails.totalPrice}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Payment Status</span>
              <span style="background: #16a34a; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">CONFIRMED</span>
            </div>
          </div>
        </div>

        <!-- Booking Summary -->
        <div style="background: #fefce8; border: 2px solid #fde047; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;"> Your Confirmed Booking</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Booking Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Service</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Vehicle</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.vehicle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Date & Time</span>
              <span style="font-weight: 600; color: #111827; text-align: right;">${bookingDetails.date} at ${bookingDetails.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Location</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.address}</span>
            </div>
          </div>
        </div>

        <!-- What's Next -->
        <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"> What Happens Next?</h3>
          <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;"><strong>Service Reminder:</strong> We'll send you a reminder 24 hours before your appointment</li>
            <li style="margin: 8px 0;"><strong>Team Arrival:</strong> Our professional team will arrive at your location at the scheduled time</li>
            <li style="margin: 8px 0;"><strong>Quality Service:</strong> We'll provide exceptional detailing service for your vehicle</li>
            <li style="margin: 8px 0;"><strong>Completion Notification:</strong> You'll receive confirmation once the service is complete</li>
          </ul>
        </div>

        <!-- Contact Information -->
        <div style="text-align: center; margin: 32px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <p style="color: #374151; margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Need to make changes or have questions?</p>
          <div style="margin: 16px 0;">
            <a href="mailto:${this.config.adminEmail}" style="color: #7c3aed; text-decoration: none; font-weight: 600; margin: 0 16px;"> Email Support</a>
            <a href="tel:${'+447908625581'}" style="color: #7c3aed; text-decoration: none; font-weight: 600; margin: 0 16px;">Call Us</a>
          </div>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">We typically respond within 2-4 hours</p>
        </div>

        <p style="color: #374151; margin: 32px 0 16px 0; font-size: 16px; font-weight: 400; line-height: 1.6;">
          Thank you for trusting Love 4 Detailing with your vehicle care needs. We're committed to delivering exceptional results that exceed your expectations!
        </p>
      `    })
  }

  /**
   * Generate text template for payment confirmation email
   */
  private generatePaymentConfirmationText(
    customerName: string, 
    booking: Booking, 
    paymentMethod: string,
    paymentReference: string
  ): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type AddressInfo = { address_line_1?: string; city?: string; postal_code?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      vehicle?: VehicleInfo
      address?: AddressInfo
      service_address?: AddressInfo
      time_slots?: { start_time?: string }
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services)
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.vehicle
        ? `${eb.vehicle_details?.year || eb.vehicle?.year || ''} ${eb.vehicle_details?.make || eb.vehicle?.make || ''} ${eb.vehicle_details?.model || eb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: eb.time_slots?.start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(eb.time_slots?.start_time || booking.scheduled_start_time)
        : 'Time TBC',
      address: eb.address || eb.service_address
        ? `${(eb.address || eb.service_address)?.address_line_1 || ''}, ${(eb.address || eb.service_address)?.city || ''} ${(eb.address || eb.service_address)?.postal_code || ''}`.trim()
        : 'Address not specified',
      totalPrice: this.formatPrice(booking.total_price)
    }

    const paymentMethodDisplay = {
      'paypal': 'PayPal',
      'cash': 'Cash',
      'card': 'Card',
      'bank_transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod

    return `
PAYMENT CONFIRMED! - Love 4 Detailing

Dear ${customerName},

 PAYMENT SUCCESSFULLY RECEIVED!

Thank you for your payment! Your booking is now fully confirmed and we're excited to provide you with exceptional vehicle detailing service.

PAYMENT DETAILS:
- Payment Method: ${paymentMethodDisplay}
- Payment Reference: ${paymentReference}
- Amount Paid: ${bookingDetails.totalPrice}
- Payment Status: CONFIRMED

YOUR CONFIRMED BOOKING:
- Booking Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
- Date & Time: ${bookingDetails.date} at ${bookingDetails.time}
- Location: ${bookingDetails.address}

WHAT HAPPENS NEXT:
✓ Service Reminder: We'll send you a reminder 24 hours before your appointment
✓ Team Arrival: Our professional team will arrive at your location at the scheduled time
✓ Quality Service: We'll provide exceptional detailing service for your vehicle
✓ Completion Notification: You'll receive confirmation once the service is complete

NEED HELP?
 Email: ${this.config.adminEmail}
Phone: ${'+447908625581'}
Response Time: Within 2-4 hours

Thank you for trusting Love 4 Detailing with your vehicle care needs. We're committed to delivering exceptional results that exceed your expectations!

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Premium Mobile Detailing Services
    `.trim()
  }

  /**
   * Generate HTML template for admin payment notification email
   */
  private generateAdminPaymentNotificationHTML(
    booking: Partial<Booking>,
    customerEmail: string,
    customerName: string,
    paymentMethod: string,
    paymentReference: string
  ): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type AddressInfo = { address_line_1?: string; city?: string; postal_code?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      vehicle?: VehicleInfo
      address?: AddressInfo
      service_address?: AddressInfo
      time_slots?: { start_time?: string }
    }
    const eb = booking as EmailBookingShape;
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services) 
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.vehicle
        ? `${eb.vehicle_details?.year || eb.vehicle?.year || ''} ${eb.vehicle_details?.make || eb.vehicle?.make || ''} ${eb.vehicle_details?.model || eb.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: eb.time_slots?.start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(eb.time_slots?.start_time || booking.scheduled_start_time)
        : 'Time TBC',
      address: eb.address || eb.service_address
        ? `${(eb.address || eb.service_address)?.address_line_1 || ''}, ${(eb.address || eb.service_address)?.city || ''} ${(eb.address || eb.service_address)?.postal_code || ''}`.trim()
        : 'Address not specified',
      totalPrice: this.formatPrice(booking.total_price)
    }

    const paymentMethodDisplay = {
      'paypal': 'PayPal',
      'cash': 'Cash',
      'card': 'Card',
      'bank_transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod

    return this.generateUnifiedEmailHTML({
      title: 'Payment Received!',
      header: {
        title: 'Payment Received!',
        subtitle: `Booking ${bookingDetails.reference} - ${customerName}`,
        type: 'default'
      },
      content: `
        <!-- Admin Alert -->
        <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #0369a1; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Payment Successfully Processed</h2>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            A payment has been confirmed for booking ${bookingDetails.reference}. The booking status has been automatically updated and the customer has been notified.
          </p>
        </div>

        <!-- Payment Summary -->
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Payment Information</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Payment Method</span>
              <span style="font-weight: 600; color: #16a34a;">${paymentMethodDisplay}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Payment Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${paymentReference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Amount Received</span>
              <span style="font-weight: 700; color: #16a34a; font-size: 18px;">${bookingDetails.totalPrice}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Processed On</span>
              <span style="font-weight: 600; color: #111827;">${this.formatDateTimeWithLabel('', new Date()).replace(': ', '')}</span>
            </div>
          </div>
        </div>

        <!-- Customer & Booking Details -->
        <div style="background: #fefce8; border: 2px solid #fde047; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Customer & Booking Details</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Customer</span>
              <div style="text-align: right;">
                <div style="font-weight: 600; color: #111827;">${customerName}</div>
                <div style="font-weight: 400; color: #64748b; font-size: 14px;">${customerEmail}</div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Booking Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Service</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Vehicle</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.vehicle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #fde047;">
              <span style="font-weight: 500; color: #374151;">Scheduled</span>
              <span style="font-weight: 600; color: #111827; text-align: right;">${bookingDetails.date} at ${bookingDetails.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Location</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.address}</span>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Automatic Actions Completed</h3>
          <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;"><strong>Booking Status:</strong> Updated to "Confirmed"</li>
            <li style="margin: 8px 0;"><strong>Payment Status:</strong> Updated to "Paid"</li>
            <li style="margin: 8px 0;"><strong>Customer Notification:</strong> Payment confirmation email sent</li>
            <li style="margin: 8px 0;"><strong>Schedule:</strong> Booking is now ready for service delivery</li>
          </ul>
        </div>

        <p style="color: #374151; margin: 32px 0 16px 0; font-size: 16px; font-weight: 400; line-height: 1.6;">
          The payment has been successfully processed and all necessary updates have been completed automatically. You can view the full booking details in your admin dashboard.
        </p>
      `    })
  }

  /**
   * Generate text template for admin payment notification email
   */
  private generateAdminPaymentNotificationText(
    booking: Booking,
    customerEmail: string,
    customerName: string,
    paymentMethod: string,
    paymentReference: string
  ): string {
    // Format booking details (using any type for database objects with relations)
    const bookingAny = booking as any;
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(bookingAny.services) 
        ? bookingAny.services.map((s: any) => s?.name || s).join(', ')
        : bookingAny.service?.name || 'Vehicle Detailing Service',
      vehicle: bookingAny.vehicle_details || bookingAny.vehicle
        ? `${bookingAny.vehicle_details?.year || bookingAny.vehicle?.year || ''} ${bookingAny.vehicle_details?.make || bookingAny.vehicle?.make || ''} ${bookingAny.vehicle_details?.model || bookingAny.vehicle?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: bookingAny.time_slots?.start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(bookingAny.time_slots?.start_time || booking.scheduled_start_time)
        : 'Time TBC',
      address: bookingAny.address || bookingAny.service_address
        ? `${(bookingAny.address || bookingAny.service_address).address_line_1}, ${(bookingAny.address || bookingAny.service_address).city} ${(bookingAny.address || bookingAny.service_address).postal_code}`
        : 'Address not specified',
      totalPrice: this.formatPrice(booking.total_price)
    }

    const paymentMethodDisplay = {
      'paypal': 'PayPal',
      'cash': 'Cash',
      'card': 'Card',
      'bank_transfer': 'Bank Transfer'
    }[paymentMethod] || paymentMethod

    return `
ADMIN ALERT: PAYMENT RECEIVED - Love 4 Detailing

 PAYMENT SUCCESSFULLY PROCESSED

A payment has been confirmed for booking ${bookingDetails.reference}. The booking status has been automatically updated and the customer has been notified.

PAYMENT INFORMATION:
- Payment Method: ${paymentMethodDisplay}
- Payment Reference: ${paymentReference}
- Amount Received: ${bookingDetails.totalPrice}
- ${this.formatDateTimeWithLabel('Processed On', new Date())}

CUSTOMER & BOOKING DETAILS:
- Customer: ${customerName} (${customerEmail})
- Booking Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
- Scheduled: ${bookingDetails.date} at ${bookingDetails.time}
- Location: ${bookingDetails.address}

AUTOMATIC ACTIONS COMPLETED:
- Booking Status: Updated to "Confirmed"
- Payment Status: Updated to "Paid"
- Customer Notification: Payment confirmation email sent
- Schedule: Booking is now ready for service delivery

The payment has been successfully processed and all necessary updates have been completed automatically. You can view the full booking details in your admin dashboard.

---
Love 4 Detailing Admin System
    `.trim()
  }

  /**
   * Send payment failed notification to customer
   */
  async sendPaymentFailedNotification(
    customerEmail: string,
    customerName: string,
    booking: Partial<Booking>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = ` Payment Required - Booking ${booking.booking_reference ?? ''}`
      const htmlContent = this.generatePaymentFailedCustomerHTML(customerName, booking)
      const textContent = this.generatePaymentFailedCustomerText(customerName, booking)

      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        subject,
        html: htmlContent,
        text: textContent
      })

      if (error) {
        logger.error('Payment failed notification email error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      logger.error('Payment failed notification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send payment failed notification'
      }
    }
  }

  /**
   * Send admin notification about automatic payment failure
   */
  async sendAdminPaymentFailedNotification(
    booking: Partial<Booking>,
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Important: Payment Deadline Exceeded - ${booking.booking_reference ?? ''}`
      const htmlContent = this.generatePaymentFailedAdminHTML(booking, customerEmail, customerName)
      const textContent = this.generatePaymentFailedAdminText(booking, customerEmail, customerName)

      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [this.config.adminEmail],
        subject,
        html: htmlContent,
        text: textContent
      })

      if (error) {
        logger.error('Admin payment failed notification email error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (error) {
      logger.error('Admin payment failed notification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send admin payment failed notification'
      }
    }
  }

  /**
   * Generate HTML template for customer payment failed notification
   */
  private generatePaymentFailedCustomerHTML(customerName: string, booking: Partial<Booking>): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      customer_vehicles?: VehicleInfo
      scheduled_start_time?: string
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services) 
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.customer_vehicles
        ? `${eb.vehicle_details?.year || eb.customer_vehicles?.year || ''} ${eb.vehicle_details?.make || eb.customer_vehicles?.make || ''} ${eb.vehicle_details?.model || eb.customer_vehicles?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: eb.scheduled_start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(eb.scheduled_start_time || booking.scheduled_start_time)
        : 'Time TBC',
      totalPrice: this.formatPrice(booking.total_price)
    }

    return this.generateUnifiedEmailHTML({
      title: ' Payment Required - Booking At Risk',
      header: {
        title: ' Payment Deadline Exceeded',
        subtitle: `Urgent: Your booking ${bookingDetails.reference} requires immediate payment`,
        type: 'warning'
      },
      content: `
        <!-- Urgent Alert -->
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">Important: Payment Deadline Has Passed</h2>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            Your booking payment deadline has expired. To secure your appointment, please complete payment immediately or contact us to discuss options.
          </p>
        </div>

        <!-- Booking Details -->
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;"> Your Booking Details</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Booking Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Service</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Vehicle</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.vehicle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Scheduled</span>
              <span style="font-weight: 600; color: #111827; text-align: right;">${bookingDetails.date} at ${bookingDetails.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Amount Due</span>
              <span style="font-weight: 700; color: #dc2626; font-size: 18px;">${bookingDetails.totalPrice}</span>
            </div>
          </div>
        </div>

        <!-- Action Required */}
        <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"> Immediate Action Required</h3>
          <div style="space-y: 12px;">
            <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 500;">
              Your booking is currently marked as "Payment Failed" due to the missed deadline.
            </p>
            <p style="color: #78350f; margin: 0; font-size: 14px;">
              To reactivate your booking and secure your appointment:
            </p>
            <ul style="color: #78350f; margin: 8px 0 0 20px; padding: 0;">
              <li style="margin: 4px 0;">Contact us immediately to discuss payment options</li>
              <li style="margin: 4px 0;">Your appointment slot may still be available</li>
              <li style="margin: 4px 0;">We're here to help find a solution that works for you</li>
            </ul>
          </div>
        </div>

        <!-- Contact Information -->}
        <div style="text-align: center; margin: 32px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <p style="color: #374151; margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Need Help? Contact Us Immediately</p>
          <div style="margin: 16px 0;">
            <a href="mailto:${this.config.adminEmail}" style="color: #7c3aed; text-decoration: none; font-weight: 600; margin: 0 16px;"> ${this.config.adminEmail}</a>
            <a href="tel:${'+447908625581'}" style="color: #7c3aed; text-decoration: none; font-weight: 600; margin: 0 16px;">Call Now</a>
          </div>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">We typically respond within 2 hours</p>
        </div>

        <p style="color: #374151; margin: 32px 0 16px 0; font-size: 16px; font-weight: 400; line-height: 1.6;">
          We understand that sometimes deadlines can be missed. Please contact us as soon as possible so we can work together to resolve this and secure your vehicle detailing service.
        </p>
      `    })
  }

  /**
   * Generate text template for customer payment failed notification
   */
  private generatePaymentFailedCustomerText(customerName: string, booking: Partial<Booking>): string {
    type VehicleInfo = { year?: string | number; make?: string; model?: string }
    type ServiceItem = { name?: string } | string
    type EmailBookingShape = Partial<Booking> & {
      services?: ServiceItem[]
      service?: { name?: string }
      vehicle_details?: VehicleInfo
      customer_vehicles?: VehicleInfo
      scheduled_start_time?: string
    }
    const eb = booking as EmailBookingShape
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(eb.services) 
        ? eb.services.map((s) => (typeof s === 'string' ? s : (s?.name || ''))).filter(Boolean).join(', ')
        : eb.service?.name || 'Vehicle Detailing Service',
      vehicle: eb.vehicle_details || eb.customer_vehicles
        ? `${eb.vehicle_details?.year || eb.customer_vehicles?.year || ''} ${eb.vehicle_details?.make || eb.customer_vehicles?.make || ''} ${eb.vehicle_details?.model || eb.customer_vehicles?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: eb.scheduled_start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(eb.scheduled_start_time || booking.scheduled_start_time)
        : 'Time TBC',
      totalPrice: this.formatPrice(booking.total_price)
    }

    return `
URGENT: PAYMENT DEADLINE EXCEEDED - Love 4 Detailing

Dear ${customerName},

Important: PAYMENT DEADLINE HAS PASSED

Your booking payment deadline has expired. To secure your appointment, please complete payment immediately or contact us to discuss options.

YOUR BOOKING DETAILS:
- Booking Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
- Scheduled: ${bookingDetails.date} at ${bookingDetails.time}
- Amount Due: ${bookingDetails.totalPrice}

 IMMEDIATE ACTION REQUIRED:
Your booking is currently marked as "Payment Failed" due to the missed deadline.

To reactivate your booking and secure your appointment:
• Contact us immediately to discuss payment options
• Your appointment slot may still be available
• We're here to help find a solution that works for you

CONTACT US NOW:
 Email: ${this.config.adminEmail}
Phone: ${'+447908625581'}
Response Time: Within 2 hours

We understand that sometimes deadlines can be missed. Please contact us as soon as possible so we can work together to resolve this and secure your vehicle detailing service.

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Premium Mobile Detailing Services
    `.trim()
  }

  /**
   * Generate HTML template for admin payment failed notification
   */
  private generatePaymentFailedAdminHTML(
    booking: Partial<Booking>,
    customerEmail: string,
    customerName: string
  ): string {
    const bookingAny = booking as any
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(bookingAny.services) 
        ? bookingAny.services.map((s: any) => s?.name || s).join(', ')
        : bookingAny.service?.name || 'Vehicle Detailing Service',
      vehicle: bookingAny.vehicle_details || bookingAny.customer_vehicles
        ? `${bookingAny.vehicle_details?.year || bookingAny.customer_vehicles?.year || ''} ${bookingAny.vehicle_details?.make || bookingAny.customer_vehicles?.make || ''} ${bookingAny.vehicle_details?.model || bookingAny.customer_vehicles?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: bookingAny.scheduled_start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(bookingAny.scheduled_start_time || booking.scheduled_start_time)
        : 'Time TBC',
      totalPrice: this.formatPrice(booking.total_price)
    }

    return this.generateUnifiedEmailHTML({
      title: 'Important: Payment Deadline Exceeded',
      header: {
        title: 'Important: Payment Deadline Exceeded',
        subtitle: `Booking ${bookingDetails.reference} - ${customerName}`,
        type: 'warning'
      },
      content: `
        <!-- Alert -->}
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;"> Automatic Status Change</h2>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            A booking has exceeded its 48-hour payment deadline and has been automatically marked as "Payment Failed". Customer notification has been sent.
          </p>
        </div>

        <!-- Customer & Booking Details -->}
        <div style="background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Customer & Booking Details</h3>
          <div style="space-y: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Customer</span>
              <div style="text-align: right;">
                <div style="font-weight: 600; color: #111827;">${customerName}</div>
                <div style="font-weight: 400; color: #64748b; font-size: 14px;">${customerEmail}</div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Booking Reference</span>
              <span style="font-weight: 600; color: #111827; font-family: monospace;">${bookingDetails.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Service</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.services}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Vehicle</span>
              <span style="font-weight: 600; color: #111827; text-align: right; max-width: 60%;">${bookingDetails.vehicle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 500; color: #374151;">Scheduled</span>
              <span style="font-weight: 600; color: #111827; text-align: right;">${bookingDetails.date} at ${bookingDetails.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: 500; color: #374151;">Amount Due</span>
              <span style="font-weight: 700; color: #dc2626; font-size: 18px;">${bookingDetails.totalPrice}</span>
            </div>
          </div>
        </div>

        <!-- Actions Taken -->}
        <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Automatic Actions Completed</h3>
          <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;"><strong>Status Changed:</strong> "Pending" -  "Payment Failed"</li>
            <li style="margin: 8px 0;"><strong>Customer Notified:</strong> Payment deadline exceeded email sent</li>
            <li style="margin: 8px 0;"><strong>Timeline:</strong> 48-hour payment window expired</li>
            <li style="margin: 8px 0;"><strong>Next Steps:</strong> Customer contact required to reactivate</li>
          </ul>
        </div>

        <!-- Recommended Actions -->}
        <div style="background: #fefce8; border: 2px solid #fde047; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <h3 style="color: #92400e; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"> Recommended Next Steps</h3>
          <ul style="color: #78350f; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Review the customer's contact preferences and follow up if appropriate</li>
            <li style="margin: 8px 0;">Consider reaching out if this is a high-value or repeat customer</li>
            <li style="margin: 8px 0;">Check if the appointment slot can be freed up for other bookings</li>
            <li style="margin: 8px 0;">Update any scheduling systems to reflect the availability</li>
          </ul>
        </div>

        <p style="color: #374151; margin: 32px 0 16px 0; font-size: 16px; font-weight: 400; line-height: 1.6;">
          This automated system helps ensure timely payment processing and maintains clear booking status. You can view the full booking details in your admin dashboard.
        </p>
      `    })
  }

  /**
   * Generate text template for admin payment failed notification
   */
  private generatePaymentFailedAdminText(
    booking: Partial<Booking>,
    customerEmail: string,
    customerName: string
  ): string {
    const bookingAny = booking as any
    const bookingDetails = {
      reference: booking.booking_reference || 'N/A',
      services: Array.isArray(bookingAny.services) 
        ? bookingAny.services.map((s: any) => s?.name || s).join(', ')
        : bookingAny.service?.name || 'Vehicle Detailing Service',
      vehicle: bookingAny.vehicle_details || bookingAny.customer_vehicles
        ? `${bookingAny.vehicle_details?.year || bookingAny.customer_vehicles?.year || ''} ${bookingAny.vehicle_details?.make || bookingAny.customer_vehicles?.make || ''} ${bookingAny.vehicle_details?.model || bookingAny.customer_vehicles?.model || ''}`.trim()
        : 'Vehicle not specified',
      date: booking.scheduled_date ? this.formatEmailDate(booking.scheduled_date) : 'Date TBC',
      time: bookingAny.scheduled_start_time || booking.scheduled_start_time 
        ? this.formatEmailTime(bookingAny.scheduled_start_time || booking.scheduled_start_time)
        : 'Time TBC',
      totalPrice: this.formatPrice(booking.total_price)
    }

    return `
ADMIN ALERT: PAYMENT DEADLINE EXCEEDED - Love 4 Detailing

Important: AUTOMATIC STATUS CHANGE

A booking has exceeded its 48-hour payment deadline and has been automatically marked as "Payment Failed". Customer notification has been sent.

CUSTOMER & BOOKING DETAILS:
- Customer: ${customerName} (${customerEmail})
- Booking Reference: ${bookingDetails.reference}
- Service: ${bookingDetails.services}
- Vehicle: ${bookingDetails.vehicle}
- Scheduled: ${bookingDetails.date} at ${bookingDetails.time}
- Amount Due: ${bookingDetails.totalPrice}

AUTOMATIC ACTIONS COMPLETED:
✓ Status Changed: "Pending" -  "Payment Failed"
✓ Customer Notified: Payment deadline exceeded email sent
✓ Timeline: 48-hour payment window expired
✓ Next Steps: Customer contact required to reactivate

RECOMMENDED NEXT STEPS:
• Review the customer's contact preferences and follow up if appropriate
• Consider reaching out if this is a high-value or repeat customer
• Check if the appointment slot can be freed up for other bookings
• Update any scheduling systems to reflect the availability

This automated system helps ensure timely payment processing and maintains clear booking status. You can view the full booking details in your admin dashboard.

---
Love 4 Detailing Admin System
    `.trim()
  }
}