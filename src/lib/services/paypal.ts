/**
 * PayPal.me Integration Service
 * Handles PayPal payment link generation for bookings
 */

export interface PayPalConfig {
  paypalMeUsername: string
  businessEmail: string
  currency: string
  paymentDeadlineHours: number
}

const defaultConfig: PayPalConfig = {
  paypalMeUsername: process.env.PAYPAL_ME_USERNAME || 'love4detailing',
  businessEmail: process.env.PAYPAL_BUSINESS_EMAIL || 'zell@love4detailing.com',
  currency: 'GBP',
  paymentDeadlineHours: 48 // 48 hours to pay after booking
}

export class PayPalService {
  private config: PayPalConfig

  constructor(config: Partial<PayPalConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    
    if (!this.config.paypalMeUsername) {
      console.warn('⚠️ PayPalService: PAYPAL_ME_USERNAME not configured')
    }
  }

  /**
   * Generate PayPal.me payment link for booking with return URLs
   */
  generatePaymentLink(amount: number, bookingReference: string, baseAppUrl?: string): string {
    // PayPal.me format: https://paypal.me/username/amount?locale.x=currency_code
    const baseUrl = `https://paypal.me/${this.config.paypalMeUsername}`
    const formattedAmount = amount.toFixed(2)
    
    let paymentUrl = `${baseUrl}/${formattedAmount}${this.config.currency}`
    
    // Add return URLs if base app URL is provided
    if (baseAppUrl) {
      const returnUrl = `${baseAppUrl}/booking/payment-complete?ref=${encodeURIComponent(bookingReference)}&status=success`
      const cancelUrl = `${baseAppUrl}/booking/payment-cancelled?ref=${encodeURIComponent(bookingReference)}`
      
      // Note: PayPal.me doesn't support return_url/cancel_url parameters directly
      // But we can add them as query parameters for our own tracking
      paymentUrl += `?return_url=${encodeURIComponent(returnUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`
    }
    
    return paymentUrl
  }

  /**
   * Generate payment instructions for email
   */
  generatePaymentInstructions(
    amount: number, 
    bookingReference: string,
    customerName: string
  ): {
    paymentLink: string
    instructions: string
    deadline: string
    emailSection: string
  } {
    const paymentLink = this.generatePaymentLink(amount, bookingReference, process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL)
    
    // Calculate payment deadline
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + this.config.paymentDeadlineHours)
    const deadlineString = deadline.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const instructions = `To secure your booking, please complete payment within 48 hours using the link below. Your booking will be automatically cancelled if payment is not received by ${deadlineString}.`

    const emailSection = `
PAYMENT REQUIRED - SECURE YOUR BOOKING

To confirm your booking, please complete payment of £${amount.toFixed(2)} using the secure PayPal link below:

PAY NOW: ${paymentLink}

PAYMENT INSTRUCTIONS:
1. Click the PayPal link above
2. Log in to your PayPal account or pay as guest
3. Enter booking reference: ${bookingReference}
4. Complete payment of £${amount.toFixed(2)}

PAYMENT DEADLINE: ${deadlineString}
Your booking will be automatically cancelled if payment is not received by this deadline.

PAYMENT REFERENCE: ${bookingReference}
Please include this reference when making payment.

If you experience any issues with payment, contact us immediately:
Email: ${this.config.businessEmail}
Phone: +44 7908 625581
    `

    return {
      paymentLink,
      instructions,
      deadline: deadlineString,
      emailSection
    }
  }

  /**
   * Generate admin payment tracking information
   */
  generateAdminPaymentInfo(
    amount: number,
    bookingReference: string,
    customerEmail: string
  ): string {
    return `
PAYMENT TRACKING INFORMATION

Amount Expected: £${amount.toFixed(2)}
Payment Method: PayPal.me
Reference: ${bookingReference}
Customer: ${customerEmail}
PayPal Account: ${this.config.paypalMeUsername}

ADMIN ACTIONS REQUIRED:
1. Monitor PayPal account for payment with reference: ${bookingReference}
2. When payment received, mark booking as PAID in admin dashboard
3. If payment not received within 48 hours, cancel booking automatically
4. Send payment confirmation email to customer once received
    `
  }

  /**
   * Validate PayPal service configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.paypalMeUsername) {
      errors.push('PayPal.me username not configured (PAYPAL_ME_USERNAME)')
    }

    if (!this.config.businessEmail) {
      errors.push('Business email not configured (PAYPAL_BUSINESS_EMAIL)')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Format payment amount for PayPal (removes decimals if .00)
   */
  private formatAmount(amount: number): string {
    const formatted = amount.toFixed(2)
    return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted
  }
}

// Export singleton instance
export const paypalService = new PayPalService()