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
  fromEmail: process.env.EMAIL_FROM || 'bookings@love4detailing.co.uk',
  fromName: 'Love 4 Detailing',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@love4detailing.co.uk',
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
      const { data, error } = await resend.emails.send({
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
      const { data, error } = await resend.emails.send({
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

      const { data, error } = await resend.emails.send({
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
}