import { formatDateForEmail, formatTimeForEmail } from '@/lib/utils/date-formatting'

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface BookingEmailData {
  customerName: string
  bookingReference: string
  scheduledDate: string
  startTime: string
  totalPrice: number
  services: Array<{
    name: string
    base_price: number
  }>
  vehicle: {
    make: string
    model: string
    year?: number
  }
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    postal_code: string
  }
  specialInstructions?: string
}

export class EmailService {

  // Booking Confirmation Email
  static generateBookingConfirmation(data: BookingEmailData): EmailTemplate {
    const servicesList = data.services.map(service => 
      `<li style="margin-bottom: 8px;">${service.name} - £${service.base_price}</li>`
    ).join('')

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Booking Confirmation - Love 4 Detailing</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #9747FF 0%, #7A2EE6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank you for choosing Love 4 Detailing</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Booking Reference -->
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid #9747FF;">
            <p style="margin: 0 0 5px 0; color: #cccccc; font-size: 14px;">Booking Reference</p>
            <p style="margin: 0; color: #9747FF; font-size: 24px; font-weight: bold;">${data.bookingReference}</p>
          </div>

          <!-- Greeting -->
          <p style="color: #ffffff; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.5;">We're excited to confirm your vehicle detailing appointment. Here are your booking details:</p>

          <!-- Appointment Details -->
          <div style="background-color: #2a2a2a; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #404040;">
            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px;">Appointment Details</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #9747FF;">Date & Time:</strong>
              <span style="color: #ffffff; margin-left: 10px;">${formatDateForEmail(data.scheduledDate)} at ${formatTimeForEmail(data.startTime)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #9747FF;">Vehicle:</strong>
              <span style="color: #ffffff; margin-left: 10px;">${data.vehicle.year ? data.vehicle.year + ' ' : ''}${data.vehicle.make} ${data.vehicle.model}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #9747FF;">Location:</strong>
              <div style="color: #ffffff; margin-left: 10px; margin-top: 5px;">
                ${data.address.address_line_1}<br>
                ${data.address.address_line_2 ? data.address.address_line_2 + '<br>' : ''}
                ${data.address.city}, ${data.address.postal_code}
              </div>
            </div>
          </div>

          <!-- Services -->
          <div style="background-color: #2a2a2a; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #404040;">
            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px;">Services Booked</h2>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc;">
              ${servicesList}
            </ul>
            <div style="border-top: 1px solid #404040; margin-top: 20px; padding-top: 15px; text-align: right;">
              <strong style="color: #9747FF; font-size: 18px;">Total: £${data.totalPrice}</strong>
            </div>
          </div>

          ${data.specialInstructions ? `
          <!-- Special Instructions -->
          <div style="background-color: #2a2a2a; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #404040;">
            <h2 style="margin: 0 0 15px 0; color: #ffffff; font-size: 18px;">Special Instructions</h2>
            <p style="margin: 0; color: #cccccc; line-height: 1.5;">${data.specialInstructions}</p>
          </div>
          ` : ''}

          <!-- Important Information -->
          <div style="background-color: #1a3a5c; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #4a9eff;">
            <h2 style="margin: 0 0 15px 0; color: #4a9eff; font-size: 18px;">What Happens Next?</h2>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc; line-height: 1.6;">
              <li>Our team will contact you within 24 hours to confirm the appointment</li>
              <li>We'll arrive at your location at the scheduled time</li>
              <li>Payment is due after service completion (cash, card, or bank transfer)</li>
              <li>Enjoy your freshly detailed vehicle!</li>
            </ul>
          </div>

          <!-- Payment Info -->
          <div style="background-color: #2a2a2a; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #404040; text-align: center;">
            <p style="margin: 0; color: #cccccc; font-size: 14px;">
              <strong style="color: #9747FF;">Payment:</strong> No payment required today. 
              £${data.totalPrice} is due after service completion.
            </p>
          </div>

          <!-- Contact -->
          <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #404040;">
            <p style="color: #cccccc; margin-bottom: 10px;">Need to make changes or have questions?</p>
            <p style="color: #cccccc; margin: 0;">
              📞 <a href="tel:+441234567890" style="color: #9747FF; text-decoration: none;">01234 567890</a> | 
              ✉️ <a href="mailto:zell@love4detailing.com" style="color: #9747FF; text-decoration: none;">zell@love4detailing.com</a>
            </p>
            <p style="color: #888888; margin-top: 15px; font-size: 12px;">Reference: ${data.bookingReference}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #404040;">
          <p style="margin: 0; color: #888888; font-size: 12px;">
            © 2024 Love 4 Detailing. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `

    const text = `
BOOKING CONFIRMATION - Love 4 Detailing

Hi ${data.customerName},

Your vehicle detailing appointment has been confirmed!

Booking Reference: ${data.bookingReference}

APPOINTMENT DETAILS:
Date & Time: ${formatDateForEmail(data.scheduledDate)} at ${formatTimeForEmail(data.startTime)}
Vehicle: ${data.vehicle.year ? data.vehicle.year + ' ' : ''}${data.vehicle.make} ${data.vehicle.model}
Location: ${data.address.address_line_1}, ${data.address.city}, ${data.address.postal_code}

SERVICES:
${data.services.map(service => `- ${service.name} (£${service.base_price})`).join('\n')}
Total: £${data.totalPrice}

${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}\n` : ''}

WHAT HAPPENS NEXT:
1. Our team will contact you within 24 hours to confirm
2. We'll arrive at your location at the scheduled time  
3. Payment (£${data.totalPrice}) is due after service completion
4. Enjoy your freshly detailed vehicle!

Need help? Contact us:
Phone: 01234 567890
Email: zell@love4detailing.com
Reference: ${data.bookingReference}

© 2024 Love 4 Detailing
    `

    return {
      subject: `Booking Confirmed - Love 4 Detailing (${data.bookingReference})`,
      html,
      text
    }
  }

  // Booking Status Update Email
  static generateStatusUpdate(data: BookingEmailData & { status: string, statusMessage?: string }): EmailTemplate {
    const statusMessages = {
      confirmed: 'Your booking has been confirmed by our team!',
      in_progress: 'Our team has started working on your vehicle.',
      completed: 'Your vehicle detailing service is now complete!',
      cancelled: 'Your booking has been cancelled.'
    }

    const statusColors = {
      confirmed: '#22c55e',
      in_progress: '#3b82f6', 
      completed: '#22c55e',
      cancelled: '#ef4444'
    }

    const message = data.statusMessage || statusMessages[data.status as keyof typeof statusMessages]
    const color = statusColors[data.status as keyof typeof statusColors] || '#9747FF'

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Booking Update - Love 4 Detailing</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${color} 0%, #7A2EE6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Booking Update</h1>
          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Love 4 Detailing</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.5;">Hi ${data.customerName},</p>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.5;">${message}</p>

          <!-- Booking Reference -->
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #2a2a2a; border-radius: 8px; border: 1px solid ${color};">
            <p style="margin: 0 0 5px 0; color: #cccccc; font-size: 14px;">Booking Reference</p>
            <p style="margin: 0; color: ${color}; font-size: 24px; font-weight: bold;">${data.bookingReference}</p>
          </div>

          <!-- Status-specific content -->
          ${data.status === 'completed' ? `
          <div style="background-color: #1a3a1a; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #22c55e;">
            <h2 style="margin: 0 0 15px 0; color: #22c55e; font-size: 18px;">Service Complete!</h2>
            <p style="margin: 0; color: #cccccc; line-height: 1.5;">
              Thank you for choosing Love 4 Detailing! We hope you're delighted with your freshly detailed vehicle. 
              If you have any feedback or need future services, please don't hesitate to contact us.
            </p>
          </div>
          ` : ''}

          <!-- Contact -->
          <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #404040;">
            <p style="color: #cccccc; margin-bottom: 10px;">Questions about your booking?</p>
            <p style="color: #cccccc; margin: 0;">
              📞 <a href="tel:+441234567890" style="color: #9747FF; text-decoration: none;">01234 567890</a> | 
              ✉️ <a href="mailto:zell@love4detailing.com" style="color: #9747FF; text-decoration: none;">zell@love4detailing.com</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #404040;">
          <p style="margin: 0; color: #888888; font-size: 12px;">
            © 2024 Love 4 Detailing. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `

    const text = `
BOOKING UPDATE - Love 4 Detailing

Hi ${data.customerName},

${message}

Booking Reference: ${data.bookingReference}
Scheduled: ${formatDateForEmail(data.scheduledDate)} at ${formatTimeForEmail(data.startTime)}

${data.status === 'completed' ? 'Thank you for choosing Love 4 Detailing! We hope you love your freshly detailed vehicle.' : ''}

Questions? Contact us:
Phone: 01234 567890
Email: zell@love4detailing.com

© 2024 Love 4 Detailing
    `

    return {
      subject: `Booking ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} - ${data.bookingReference}`,
      html,
      text
    }
  }

  // Password Reset Email
  static generatePasswordReset(data: { 
    customerName: string
    resetUrl: string 
    email: string
  }): EmailTemplate {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Reset - Love 4 Detailing</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #9747FF 0%, #7A2EE6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Love 4 Detailing</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #ffffff; font-size: 16px; line-height: 1.5;">Hi ${data.customerName || 'there'},</p>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.5;">
            We received a request to reset the password for your Love 4 Detailing account associated with <strong style="color: #9747FF;">${data.email}</strong>.
          </p>

          <!-- Reset Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data.resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #9747FF 0%, #7A2EE6 100%); 
                      color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; 
                      font-weight: bold; font-size: 16px; text-align: center; min-width: 200px;">
              Reset My Password
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="background-color: #2a2a2a; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #404040;">
            <p style="margin: 0 0 10px 0; color: #cccccc; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin: 0; word-break: break-all; color: #9747FF; font-size: 14px;">
              <a href="${data.resetUrl}" style="color: #9747FF; text-decoration: none;">${data.resetUrl}</a>
            </p>
          </div>

          <!-- Security Notice -->
          <div style="background-color: #1a3a5c; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #4a9eff;">
            <h2 style="margin: 0 0 15px 0; color: #4a9eff; font-size: 18px;">Important Security Information</h2>
            <ul style="margin: 0; padding-left: 20px; color: #cccccc; line-height: 1.6;">
              <li>This link will expire in <strong style="color: #4a9eff;">1 hour</strong> for security reasons</li>
              <li>The link can only be used once to reset your password</li>
              <li>If you didn't request this reset, you can safely ignore this email</li>
              <li>Your current password will remain unchanged until you create a new one</li>
            </ul>
          </div>

          <!-- Didn't Request Notice -->
          <div style="background-color: #3a1a1a; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #ef4444;">
            <p style="margin: 0; color: #ffcccc; font-size: 14px; line-height: 1.5;">
              <strong style="color: #ef4444;">Didn't request this?</strong><br>
              If you didn't request a password reset, please ignore this email or contact us immediately if you're concerned about your account security.
            </p>
          </div>

          <!-- Contact -->
          <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #404040;">
            <p style="color: #cccccc; margin-bottom: 10px;">Need help with your account?</p>
            <p style="color: #cccccc; margin: 0;">
              📞 <a href="tel:+447123456789" style="color: #9747FF; text-decoration: none;">07123 456789</a> | 
              ✉️ <a href="mailto:zell@love4detailing.com" style="color: #9747FF; text-decoration: none;">zell@love4detailing.com</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0a0a0a; padding: 20px 30px; text-align: center; border-top: 1px solid #404040;">
          <p style="margin: 0; color: #888888; font-size: 12px;">
            © 2024 Love 4 Detailing. All rights reserved.
          </p>
          <p style="margin: 10px 0 0 0; color: #666666; font-size: 11px;">
            This email was sent to ${data.email}. If you received this in error, please ignore it.
          </p>
        </div>
      </div>
    </body>
    </html>
    `

    const text = `
PASSWORD RESET - Love 4 Detailing

Hi ${data.customerName || 'there'},

We received a request to reset the password for your Love 4 Detailing account (${data.email}).

To reset your password, click this link or copy it into your browser:
${data.resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link expires in 1 hour for security reasons
- The link can only be used once to reset your password  
- If you didn't request this reset, you can safely ignore this email
- Your current password remains unchanged until you create a new one

Didn't request this? If you didn't request a password reset, please ignore this email or contact us if you're concerned about account security.

Need help?
Phone: 07123 456789
Email: zell@love4detailing.com

© 2024 Love 4 Detailing
This email was sent to ${data.email}
    `

    return {
      subject: 'Reset Your Password - Love 4 Detailing',
      html,
      text
    }
  }

  // Send email function (would integrate with your email provider)
  static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }
}