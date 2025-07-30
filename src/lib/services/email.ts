import { Resend } from 'resend'
import { Booking } from '@/lib/utils/booking-types'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailServiceConfig {
  fromEmail: string
  fromName: string
  adminEmail: string
  replyToEmail?: string
}

const defaultConfig: EmailServiceConfig = {
  fromEmail: process.env.EMAIL_FROM || 'zell@love4detailing.com',
  fromName: 'Love 4 Detailing - Zell',
  adminEmail: process.env.ADMIN_EMAIL || 'zell@love4detailing.com',
  replyToEmail: process.env.EMAIL_REPLY_TO
}

export class EmailService {
  private config: EmailServiceConfig

  constructor(config: Partial<EmailServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // Send booking confirmation email to customer
  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    booking: Booking
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [customerEmail],
        replyTo: this.config.replyToEmail,
        subject: `Booking Confirmation - ${booking.booking_reference}`,
        html: this.generateBookingConfirmationHTML(customerName, booking),
        text: this.generateBookingConfirmationText(customerName, booking)
      })

      if (error) {
        console.error('Email send error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send new booking notification to admin
  async sendAdminBookingNotification(
    booking: Booking,
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [this.config.adminEmail],
        replyTo: customerEmail,
        subject: `New Booking Received - ${booking.booking_reference}`,
        html: this.generateAdminNotificationHTML(booking, customerEmail, customerName),
        text: this.generateAdminNotificationText(booking, customerEmail, customerName)
      })

      if (error) {
        console.error('Admin notification email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Admin email service error:', error)
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
        console.error('Password setup email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Password setup email service error:', error)
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
        console.error('Booking decline email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Booking decline email service error:', error)
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
    booking: Booking,
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
        console.error('Status update email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Status update email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // Send admin notification about customer reschedule request
  async sendAdminRescheduleRequestNotification(
    booking: any,
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
        html: this.generateAdminRescheduleRequestHTML(booking, customerName, customerEmail, requestedDate, requestedTime, reason),
        text: this.generateAdminRescheduleRequestText(booking, customerName, customerEmail, requestedDate, requestedTime, reason)
      })

      if (error) {
        console.error('Admin reschedule request notification error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Admin reschedule request email service error:', error)
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
    booking: any,
    rescheduleRequest: any,
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
        console.error('Reschedule response email error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Reschedule response email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      }
    }
  }

  // HTML Email Templates
  private generateBookingConfirmationHTML(customerName: string, booking: Booking): string {
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
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .total-price { font-size: 18px; font-weight: bold; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Confirmation</h1>
            <p>Thank you for choosing Love 4 Detailing!</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>Your booking has been received and is being processed. Here are your booking details:</p>
            
            <div class="booking-details">
              <h3>Booking Reference: ${booking.booking_reference}</h3>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(booking.scheduled_date)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(booking.scheduled_start_time)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">${booking.vehicle_details?.make} ${booking.vehicle_details?.model}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Service Address:</span>
                <span class="detail-value">
                  ${booking.service_address?.address_line_1}<br>
                  ${booking.service_address?.city}, ${booking.service_address?.postcode}
                </span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value total-price">£${booking.total_price}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${booking.status === 'pending' ? 'Awaiting Confirmation' : booking.status}</span>
              </div>
            </div>
            
            <div class="highlight">
              <h4>What happens next?</h4>
              <p>Our team will review your booking and contact you within 24 hours to confirm the appointment time and discuss any specific requirements.</p>
              <p><strong>Payment:</strong> Payment is due after service completion. We accept cash, card, and bank transfer.</p>
            </div>
            
            ${booking.special_instructions ? `
              <div class="booking-details">
                <h4>Special Instructions:</h4>
                <p>${booking.special_instructions}</p>
              </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes to your booking, please contact us:</p>
            <ul>
              <li>Email: ${this.config.adminEmail}</li>
              <li>Phone: [Your phone number]</li>
            </ul>
            
            <p>Thank you for choosing Love 4 Detailing!</p>
          </div>
          
          <div class="footer">
            <p>Love 4 Detailing - Professional Vehicle Detailing Services</p>
            <p>This is an automated email. Please do not reply directly to this email.</p>
          </div>
        </body>
      </html>
    `
  }

  private generateBookingConfirmationText(customerName: string, booking: Booking): string {
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
BOOKING CONFIRMATION - Love 4 Detailing

Dear ${customerName},

Your booking has been received and is being processed. Here are your booking details:

Booking Reference: ${booking.booking_reference}
Date: ${formatDate(booking.scheduled_date)}
Time: ${formatTime(booking.scheduled_start_time)}
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

  private generateAdminNotificationHTML(booking: Booking, customerEmail: string, customerName: string): string {
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
          <title>New Booking Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .customer-info { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .urgent { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
            .total-price { font-size: 18px; font-weight: bold; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 New Booking Alert</h1>
            <p>A new booking has been received!</p>
          </div>
          
          <div class="content">
            <div class="urgent">
              <h3>⚡ Action Required</h3>
              <p>A new booking needs your attention. Please review and confirm within 24 hours.</p>
            </div>
            
            <div class="customer-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
            </div>
            
            <div class="booking-details">
              <h3>Booking Details - ${booking.booking_reference}</h3>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(booking.scheduled_date)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(booking.scheduled_start_time)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">
                  ${booking.vehicle_details?.make} ${booking.vehicle_details?.model}
                  ${booking.vehicle_details?.year ? `(${booking.vehicle_details.year})` : ''}
                  ${booking.vehicle_details?.color ? `- ${booking.vehicle_details.color}` : ''}
                </span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Registration:</span>
                <span class="detail-value">${booking.vehicle_details?.registration || 'Not provided'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Service Address:</span>
                <span class="detail-value">
                  ${booking.service_address?.address_line_1}<br>
                  ${booking.service_address?.address_line_2 ? `${booking.service_address.address_line_2}<br>` : ''}
                  ${booking.service_address?.city}, ${booking.service_address?.postcode}
                </span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Distance:</span>
                <span class="detail-value">${booking.distance_km ? `${booking.distance_km} km` : 'Not calculated'}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Estimated Duration:</span>
                <span class="detail-value">${booking.estimated_duration} minutes</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Price:</span>
                <span class="detail-value total-price">£${booking.total_price}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${booking.status}</span>
              </div>
            </div>
            
            ${booking.special_instructions ? `
              <div class="booking-details">
                <h4>Special Instructions:</h4>
                <p>${booking.special_instructions}</p>
              </div>
            ` : ''}
            
            <div class="booking-details">
              <h4>Pricing Breakdown:</h4>
              <p><strong>Base Price:</strong> £${booking.base_price}</p>
              <p><strong>Vehicle Size Multiplier:</strong> ${booking.vehicle_size_multiplier}x</p>
              ${booking.distance_surcharge ? `<p><strong>Distance Surcharge:</strong> £${booking.distance_surcharge}</p>` : ''}
              <p><strong>Total:</strong> £${booking.total_price}</p>
            </div>
            
            <div class="urgent">
              <h4>Next Steps:</h4>
              <ol>
                <li>Review the booking details above</li>
                <li>Check your schedule for availability</li>
                <li>Contact the customer to confirm the appointment</li>
                <li>Update the booking status in the admin panel</li>
              </ol>
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
NEW BOOKING ALERT - Love 4 Detailing Admin

🔔 A new booking has been received and needs your attention!

CUSTOMER INFORMATION:
Name: ${customerName}
Email: ${customerEmail}

BOOKING DETAILS:
Reference: ${booking.booking_reference}
Date: ${formatDate(booking.scheduled_date)}
Time: ${formatTime(booking.scheduled_start_time)}
Vehicle: ${booking.vehicle_details?.make} ${booking.vehicle_details?.model} ${booking.vehicle_details?.year ? `(${booking.vehicle_details.year})` : ''}
Registration: ${booking.vehicle_details?.registration || 'Not provided'}
Color: ${booking.vehicle_details?.color || 'Not specified'}

SERVICE ADDRESS:
${booking.service_address?.address_line_1}
${booking.service_address?.address_line_2 ? `${booking.service_address.address_line_2}` : ''}
${booking.service_address?.city}, ${booking.service_address?.postcode}

PRICING:
Base Price: £${booking.base_price}
Vehicle Multiplier: ${booking.vehicle_size_multiplier}x
Distance Surcharge: £${booking.distance_surcharge || 0}
Total Price: £${booking.total_price}

Estimated Duration: ${booking.estimated_duration} minutes
Distance: ${booking.distance_km ? `${booking.distance_km} km` : 'Not calculated'}

${booking.special_instructions ? `SPECIAL INSTRUCTIONS:\n${booking.special_instructions}\n` : ''}

ACTION REQUIRED:
1. Review the booking details above
2. Check your schedule for availability  
3. Contact the customer to confirm the appointment
4. Update the booking status in the admin panel

Please confirm this booking within 24 hours.

---
Love 4 Detailing Admin System
    `
  }

  private generateStatusUpdateHTML(customerName: string, booking: Booking, previousStatus: string, updateReason?: string): string {
    const statusColors = {
      confirmed: '#059669',
      cancelled: '#dc2626', 
      completed: '#0891b2',
      in_progress: '#d97706'
    }

    const statusMessages = {
      confirmed: 'Your booking has been confirmed! 🎉',
      cancelled: 'Your booking has been cancelled',
      completed: 'Your booking has been completed! ✨',
      in_progress: 'Your booking is now in progress'
    }

    const color = statusColors[booking.status as keyof typeof statusColors] || '#64748b'
    const message = statusMessages[booking.status as keyof typeof statusMessages] || 'Your booking status has been updated'

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color}; }
            .highlight { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Status Update</h1>
            <p>${message}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            <div class="status-update">
              <h3>Booking Reference: ${booking.booking_reference}</h3>
              <p><strong>Previous Status:</strong> ${previousStatus}</p>
              <p><strong>New Status:</strong> ${booking.status}</p>
              ${updateReason ? `<p><strong>Reason:</strong> ${updateReason}</p>` : ''}
            </div>
            
            ${booking.status === 'confirmed' ? `
              <div class="highlight">
                <h4>Your booking is confirmed!</h4>
                <p>We look forward to providing you with excellent service. Please ensure:</p>
                <ul>
                  <li>Access to water and electricity is available</li>
                  <li>The vehicle is accessible at the scheduled time</li>
                  <li>Any special instructions have been noted</li>
                </ul>
              </div>
            ` : ''}
            
            ${booking.status === 'completed' ? `
              <div class="highlight">
                <h4>Thank you for choosing Love 4 Detailing!</h4>
                <p>We hope you're delighted with the results. If you have any feedback or would like to book another service, please don't hesitate to contact us.</p>
              </div>
            ` : ''}
            
            <p>If you have any questions, please contact us at ${this.config.adminEmail}</p>
          </div>
        </body>
      </html>
    `
  }

  private generateStatusUpdateText(customerName: string, booking: Booking, previousStatus: string, updateReason?: string): string {
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
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .setup-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; text-align: center; }
            .setup-button { 
              display: inline-block; 
              background: #059669; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold; 
              margin: 20px 0;
            }
            .setup-button:hover { background: #047857; }
            .highlight { background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #059669; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Love 4 Detailing!</h1>
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
              <h4>⚠️ Important Security Notice</h4>
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
          <title>Booking Declined</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .decline-reason { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
            .rebook-section { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Update</h1>
            <p>We're sorry, but we cannot accommodate your booking</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            <p>We regret to inform you that we are unable to fulfill your booking request. We sincerely apologize for any inconvenience this may cause.</p>
            
            <div class="booking-details">
              <h3>Booking Reference: ${booking.booking_reference}</h3>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formatDate(booking.scheduled_date)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(booking.scheduled_start_time)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span class="detail-value">${booking.vehicle_details?.make} ${booking.vehicle_details?.model}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Declined</span>
              </div>
            </div>
            
            <div class="decline-reason">
              <h4>Reason for Decline:</h4>
              <p><strong>${declineReason}</strong></p>
              ${additionalNotes ? `<p><strong>Additional Notes:</strong> ${additionalNotes}</p>` : ''}
            </div>
            
            <div class="rebook-section">
              <h4>We'd Love to Help You Reschedule! 🚗✨</h4>
              <p>We understand this is disappointing, but we're committed to providing you with excellent service. Here's what you can do:</p>
              <ul>
                <li><strong>Try a different date/time:</strong> Visit our booking page to see alternative slots</li>
                <li><strong>Contact us directly:</strong> Call or email us to discuss your options</li>
                <li><strong>Join our waiting list:</strong> We'll notify you if a slot becomes available</li>
              </ul>
              <p><strong>Need immediate assistance?</strong> Reply to this email or contact us at ${this.config.adminEmail}</p>
            </div>
            
            <p>We value your business and hope to serve you in the future. Thank you for considering Love 4 Detailing.</p>
            
            <p>Kind regards,<br>
            The Love 4 Detailing Team</p>
          </div>
          
          <div class="footer">
            <p>Love 4 Detailing - Professional Vehicle Detailing Services</p>
            <p>Visit our website to book a new appointment or contact us for assistance</p>
          </div>
        </body>
      </html>
    `
  }

  private generateBookingDeclineText(customerName: string, booking: Booking, declineReason: string, additionalNotes?: string): string {
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
BOOKING UPDATE - Love 4 Detailing

Dear ${customerName},

We regret to inform you that we are unable to fulfill your booking request. We sincerely apologize for any inconvenience this may cause.

BOOKING DETAILS:
Reference: ${booking.booking_reference}
Date: ${formatDate(booking.scheduled_date)}
Time: ${formatTime(booking.scheduled_start_time)}
Vehicle: ${booking.vehicle_details?.make} ${booking.vehicle_details?.model}
Status: Declined

REASON FOR DECLINE:
${declineReason}
${additionalNotes ? `\nAdditional Notes: ${additionalNotes}` : ''}

WE'D LOVE TO HELP YOU RESCHEDULE!
We understand this is disappointing, but we're committed to providing you with excellent service. Here's what you can do:

• Try a different date/time: Visit our booking page to see alternative slots
• Contact us directly: Call or email us to discuss your options  
• Join our waiting list: We'll notify you if a slot becomes available

Need immediate assistance? Reply to this email or contact us at ${this.config.adminEmail}

We value your business and hope to serve you in the future. Thank you for considering Love 4 Detailing.

Kind regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Professional Vehicle Detailing Services
Visit our website to book a new appointment or contact us for assistance
    `
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
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .highlight { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fecaca; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .cta-button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔄 Reschedule Request</h1>
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
                <span class="detail-value">${booking.booking_reference}</span>
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
                <span class="detail-value">${formatDate(booking.scheduled_date)} at ${formatTime(booking.scheduled_start_time)}</span>
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
Booking Reference: ${booking.booking_reference}
Customer: ${customerName}
Email: ${customerEmail}
Current Date: ${booking.scheduled_date} at ${booking.scheduled_start_time}
Requested Date: ${requestedDate} at ${requestedTime}
${reason ? `Reason: ${reason}` : ''}

Please log into the admin dashboard to respond to this request.

---
Love 4 Detailing - Admin Notifications
    `
  }

  // Customer reschedule response templates
  private generateRescheduleResponseHTML(
    customerName: string,
    booking: any,
    rescheduleRequest: any,
    action: string,
    adminResponse?: string,
    proposedDate?: string,
    proposedTime?: string
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

    const statusColors = {
      approve: '#10b981',
      reject: '#dc2626',
      propose: '#f59e0b'
    }

    const statusMessages = {
      approve: 'Your reschedule request has been approved!',
      reject: 'Your reschedule request has been declined',
      propose: 'Alternative time proposed'
    }

    const color = statusColors[action as keyof typeof statusColors] || '#6b7280'
    const message = statusMessages[action as keyof typeof statusMessages] || 'Request updated'

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reschedule Request Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color}; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: bold; color: #64748b; }
            .detail-value { color: #1e293b; }
            .highlight { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #bae6fd; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${action === 'approve' ? '✅' : action === 'reject' ? '❌' : '💭'} ${message}</h1>
            <p>Booking ${booking.booking_reference}</p>
          </div>
          
          <div class="content">
            <p>Dear ${customerName},</p>
            
            ${action === 'approve' ? `
            <div class="highlight">
              <strong>Great news!</strong> Your reschedule request has been approved. Your booking has been updated with the new date and time.
            </div>
            ` : action === 'reject' ? `
            <div class="highlight">
              <strong>We're sorry,</strong> but we cannot accommodate your reschedule request at this time.
            </div>
            ` : `
            <div class="highlight">
              <strong>Alternative Option:</strong> We've proposed a different time that works better for our schedule.
            </div>
            `}
            
            <div class="booking-details">
              <h3>Booking Update</h3>
              <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span class="detail-value">${booking.booking_reference}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Original Date:</span>
                <span class="detail-value">${formatDate(rescheduleRequest.original_date)} at ${formatTime(rescheduleRequest.original_time)}</span>
              </div>
              ${action === 'approve' ? `
              <div class="detail-row">
                <span class="detail-label">New Date:</span>
                <span class="detail-value"><strong>${formatDate(rescheduleRequest.requested_date)} at ${formatTime(rescheduleRequest.requested_time)}</strong></span>
              </div>
              ` : action === 'propose' && proposedDate && proposedTime ? `
              <div class="detail-row">
                <span class="detail-label">Proposed Date:</span>
                <span class="detail-value"><strong>${formatDate(proposedDate)} at ${formatTime(proposedTime)}</strong></span>
              </div>
              ` : ''}
            </div>
            
            ${adminResponse ? `
            <div class="booking-details">
              <h3>Message from Love 4 Detailing</h3>
              <p>${adminResponse}</p>
            </div>
            ` : ''}
            
            ${action === 'propose' ? `
            <p>If this alternative time works for you, please contact us to confirm. If not, feel free to request another time.</p>
            ` : action === 'reject' ? `
            <p>You can try requesting a different date/time or contact us directly to discuss other options.</p>
            ` : ''}
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>The Love 4 Detailing Team</p>
            
            <div class="footer">
              <p>Love 4 Detailing - Professional Vehicle Detailing Services</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private generateRescheduleResponseText(
    customerName: string,
    booking: any,
    rescheduleRequest: any,
    action: string,
    adminResponse?: string,
    proposedDate?: string,
    proposedTime?: string
  ): string {
    const statusMessages = {
      approve: 'APPROVED - Your reschedule request has been approved!',
      reject: 'DECLINED - Your reschedule request has been declined',
      propose: 'ALTERNATIVE PROPOSED - Different time suggested'
    }

    const message = statusMessages[action as keyof typeof statusMessages] || 'REQUEST UPDATED'

    return `
${message}
Booking ${booking.booking_reference}

Dear ${customerName},

${action === 'approve' ? 
`Great news! Your reschedule request has been approved. Your booking has been updated with the new date and time.` : 
action === 'reject' ? 
`We're sorry, but we cannot accommodate your reschedule request at this time.` : 
`We've proposed a different time that works better for our schedule.`}

BOOKING UPDATE:
Booking Reference: ${booking.booking_reference}
Original Date: ${rescheduleRequest.original_date} at ${rescheduleRequest.original_time}
${action === 'approve' ? `New Date: ${rescheduleRequest.requested_date} at ${rescheduleRequest.requested_time}` : ''}
${action === 'propose' && proposedDate && proposedTime ? `Proposed Date: ${proposedDate} at ${proposedTime}` : ''}

${adminResponse ? `MESSAGE FROM LOVE 4 DETAILING:\n${adminResponse}\n` : ''}

${action === 'propose' ? 
`If this alternative time works for you, please contact us to confirm. If not, feel free to request another time.` : 
action === 'reject' ? 
`You can try requesting a different date/time or contact us directly to discuss other options.` : ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Love 4 Detailing Team

---
Love 4 Detailing - Professional Vehicle Detailing Services
    `
  }
}