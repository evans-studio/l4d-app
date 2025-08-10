// Enhanced email notification system with templates and scheduling
import { formatDateForEmail, formatTimeForEmail } from '@/lib/utils/date-formatting'

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface NotificationData {
  customerName: string
  customerEmail: string
  bookingReference: string
  serviceName: string
  scheduledDate: string
  scheduledTime: string
  totalPrice: number
  address: string
  vehicleDetails: string
  specialInstructions?: string
  adminEmail?: string
  businessName: string
  businessPhone: string
  cancellationReason?: string
  rescheduleDetails?: {
    oldDate: string
    oldTime: string
    newDate: string
    newTime: string
  }
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(data: NotificationData): Promise<boolean> {
  try {
    const template = getBookingConfirmationTemplate(data)
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`)
    }

    // Also notify admin
    await sendAdminNotification('new_booking', data)
    
    return true
  } catch (error) {
    console.error('Booking confirmation email error:', error)
    return false
  }
}

/**
 * Send booking reminder email (24 hours before)
 */
export async function sendBookingReminder(data: NotificationData): Promise<boolean> {
  try {
    const template = getBookingReminderTemplate(data)
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    return response.ok
  } catch (error) {
    console.error('Booking reminder email error:', error)
    return false
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellation(data: NotificationData): Promise<boolean> {
  try {
    const template = getBookingCancellationTemplate(data)
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    if (response.ok) {
      // Notify admin of cancellation
      await sendAdminNotification('booking_cancelled', data)
    }

    return response.ok
  } catch (error) {
    console.error('Booking cancellation email error:', error)
    return false
  }
}

/**
 * Send booking reschedule confirmation
 */
export async function sendBookingReschedule(data: NotificationData): Promise<boolean> {
  try {
    const template = getBookingRescheduleTemplate(data)
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    return response.ok
  } catch (error) {
    console.error('Booking reschedule email error:', error)
    return false
  }
}

/**
 * Send service completion email with feedback request
 */
export async function sendServiceCompletion(data: NotificationData): Promise<boolean> {
  try {
    const template = getServiceCompletionTemplate(data)
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    return response.ok
  } catch (error) {
    console.error('Service completion email error:', error)
    return false
  }
}

/**
 * Send admin notification emails
 */
async function sendAdminNotification(type: string, data: NotificationData): Promise<boolean> {
  try {
    const adminEmail = data.adminEmail || process.env.ADMIN_EMAIL
    if (!adminEmail) return false

    let template: EmailTemplate

    switch (type) {
      case 'new_booking':
        template = getAdminNewBookingTemplate(data)
        break
      case 'booking_cancelled':
        template = getAdminCancellationTemplate(data)
        break
      default:
        return false
    }

    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: adminEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
    })

    return response.ok
  } catch (error) {
    console.error('Admin notification email error:', error)
    return false
  }
}

/**
 * Schedule reminder emails for upcoming bookings
 */
export async function scheduleBookingReminders(): Promise<void> {
  try {
    const response = await fetch('/api/bookings/upcoming-reminders')
    
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming bookings')
    }

    const { data: bookings } = await response.json()

    for (const booking of bookings) {
      const reminderData: NotificationData = {
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        bookingReference: booking.booking_reference,
        serviceName: booking.service_name,
        scheduledDate: booking.scheduled_date,
        scheduledTime: booking.scheduled_time,
        totalPrice: booking.total_price,
        address: booking.address,
        vehicleDetails: booking.vehicle_details,
        businessName: 'Love 4 Detailing',
        businessPhone: process.env.BUSINESS_PHONE || ''
      }

      await sendBookingReminder(reminderData)
    }
  } catch (error) {
    console.error('Schedule reminders error:', error)
  }
}

// Email Template Functions

function getBookingConfirmationTemplate(data: NotificationData): EmailTemplate {
  const subject = `Booking Confirmed - ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        <h2>Booking Confirmation</h2>
      </div>
      
      <div class="content">
        <p>Dear ${data.customerName},</p>
        
        <p>Thank you for choosing ${data.businessName}! Your booking has been confirmed.</p>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <p><strong>Reference:</strong> ${data.bookingReference}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date:</strong> ${formatDateForEmail(data.scheduledDate)}</p>
          <p><strong>Time:</strong> ${data.scheduledTime}</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <p><strong>Vehicle:</strong> ${data.vehicleDetails}</p>
          <p><strong>Total Price:</strong> £${data.totalPrice.toFixed(2)}</p>
          ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
        </div>
        
        <h3>What happens next?</h3>
        <ul>
          <li>We'll send you a reminder 24 hours before your appointment</li>
          <li>Our technician will arrive at the scheduled time</li>
          <li>Please ensure your vehicle is accessible and keys are available</li>
        </ul>
        
        <h3>Need to make changes?</h3>
        <p>If you need to reschedule or cancel your booking, please contact us at least 24 hours in advance:</p>
        <p>📞 ${data.businessPhone}</p>
        
        <a href="mailto:${data.businessPhone}" class="button">Contact Us</a>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Booking Confirmation - ${data.bookingReference}
    
    Dear ${data.customerName},
    
    Thank you for choosing ${data.businessName}! Your booking has been confirmed.
    
    Booking Details:
    Reference: ${data.bookingReference}
    Service: ${data.serviceName}
    Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}
    Time: ${data.scheduledTime}
    Address: ${data.address}
    Vehicle: ${data.vehicleDetails}
    Total Price: £${data.totalPrice.toFixed(2)}
    ${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}` : ''}
    
    We'll send you a reminder 24 hours before your appointment.
    
    If you need to make changes, please contact us at ${data.businessPhone}
    
    © ${new Date().getFullYear()} ${data.businessName}
  `

  return { subject, html, text }
}

function getBookingReminderTemplate(data: NotificationData): EmailTemplate {
  const subject = `Reminder: Your appointment tomorrow - ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .reminder-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .booking-details { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        <h2>Appointment Reminder</h2>
      </div>
      
      <div class="content">
        <div class="reminder-box">
          <h3>⏰ Your appointment is tomorrow!</h3>
          <p>We're looking forward to servicing your vehicle.</p>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>This is a friendly reminder about your upcoming appointment with ${data.businessName}.</p>
        
        <div class="booking-details">
          <h3>Tomorrow's Appointment</h3>
          <p><strong>Reference:</strong> ${data.bookingReference}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Time:</strong> ${data.scheduledTime}</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <p><strong>Vehicle:</strong> ${data.vehicleDetails}</p>
        </div>
        
        <h3>Please ensure:</h3>
        <ul>
          <li>Your vehicle is accessible</li>
          <li>Keys are available</li>
          <li>Any personal items are removed from the vehicle</li>
          <li>You're available at the scheduled time</li>
        </ul>
        
        <p>If you need to reschedule or have any questions, please call us at ${data.businessPhone}</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Appointment Reminder - ${data.bookingReference}
    
    Dear ${data.customerName},
    
    Your appointment with ${data.businessName} is tomorrow!
    
    Time: ${data.scheduledTime}
    Service: ${data.serviceName}
    Address: ${data.address}
    Vehicle: ${data.vehicleDetails}
    
    Please ensure your vehicle is accessible and keys are available.
    
    Questions? Call us at ${data.businessPhone}
    
    © ${new Date().getFullYear()} ${data.businessName}
  `

  return { subject, html, text }
}

function getBookingCancellationTemplate(data: NotificationData): EmailTemplate {
  const subject = `Booking Cancelled - ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancelled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .cancellation-box { background: #fee2e2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        <h2>Booking Cancelled</h2>
      </div>
      
      <div class="content">
        <div class="cancellation-box">
          <h3>Booking Cancelled</h3>
          <p>Your booking ${data.bookingReference} has been cancelled.</p>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>We confirm that your booking has been cancelled as requested.</p>
        
        <p><strong>Cancelled Booking Details:</strong></p>
        <ul>
          <li>Reference: ${data.bookingReference}</li>
          <li>Service: ${data.serviceName}</li>
          <li>Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}</li>
          <li>Time: ${data.scheduledTime}</li>
        </ul>
        
        ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
        
        <p>We're sorry to see you go. If you'd like to book again in the future, we'd be happy to help!</p>
        
        <a href="tel:${data.businessPhone}" class="button">Book Again</a>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Booking Cancelled - ${data.bookingReference}
    
    Dear ${data.customerName},
    
    Your booking ${data.bookingReference} has been cancelled as requested.
    
    Cancelled booking was for:
    - Service: ${data.serviceName}
    - Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}
    - Time: ${data.scheduledTime}
    
    ${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}
    
    We'd be happy to help if you'd like to book again: ${data.businessPhone}
    
    © ${new Date().getFullYear()} ${data.businessName}
  `

  return { subject, html, text }
}

function getBookingRescheduleTemplate(data: NotificationData): EmailTemplate {
  const subject = `Booking Rescheduled - ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Rescheduled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .reschedule-box { background: #ddd6fe; border: 2px solid #6366f1; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .booking-details { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        <h2>Booking Rescheduled</h2>
      </div>
      
      <div class="content">
        <div class="reschedule-box">
          <h3>Booking Rescheduled</h3>
          <p>Your appointment has been successfully rescheduled.</p>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>We confirm that your booking has been rescheduled as requested.</p>
        
        <div class="booking-details">
          <h3>New Appointment Details</h3>
          <p><strong>Reference:</strong> ${data.bookingReference}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>New Date:</strong> ${data.rescheduleDetails ? new Date(data.rescheduleDetails.newDate).toLocaleDateString('en-GB') : 'TBD'}</p>
          <p><strong>New Time:</strong> ${data.rescheduleDetails?.newTime || 'TBD'}</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <p><strong>Vehicle:</strong> ${data.vehicleDetails}</p>
        </div>
        
        ${data.rescheduleDetails ? `
          <p><strong>Previous appointment was:</strong></p>
          <p>Date: ${new Date(data.rescheduleDetails.oldDate).toLocaleDateString('en-GB')} at ${data.rescheduleDetails.oldTime}</p>
        ` : ''}
        
        <p>We'll send you a reminder 24 hours before your new appointment.</p>
        
        <p>Questions? Call us at ${data.businessPhone}</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Booking Rescheduled - ${data.bookingReference}
    
    Dear ${data.customerName},
    
    Your booking has been successfully rescheduled.
    
    New Appointment:
    - Reference: ${data.bookingReference}
    - Service: ${data.serviceName}
    - Date: ${data.rescheduleDetails ? new Date(data.rescheduleDetails.newDate).toLocaleDateString('en-GB') : 'TBD'}
    - Time: ${data.rescheduleDetails?.newTime || 'TBD'}
    
    We'll send you a reminder 24 hours before your appointment.
    
    Questions? ${data.businessPhone}
    
    © ${new Date().getFullYear()} ${data.businessName}
  `

  return { subject, html, text }
}

function getServiceCompletionTemplate(data: NotificationData): EmailTemplate {
  const subject = `Service Complete - Thank you! ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Service Complete</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .completion-box { background: #d1fae5; border: 2px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        <h2>Service Complete!</h2>
      </div>
      
      <div class="content">
        <div class="completion-box">
          <h3>Your vehicle is ready!</h3>
          <p>We've completed the ${data.serviceName} service.</p>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>Thank you for choosing ${data.businessName}! We've successfully completed your vehicle service.</p>
        
        <p><strong>Service Details:</strong></p>
        <ul>
          <li>Reference: ${data.bookingReference}</li>
          <li>Service: ${data.serviceName}</li>
          <li>Vehicle: ${data.vehicleDetails}</li>
          <li>Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}</li>
        </ul>
        
        <h3>How did we do?</h3>
        <p>We'd love to hear about your experience! Your feedback helps us improve our service.</p>
        
        <a href="#" class="button">Leave a Review</a>
        
        <h3>Need another service?</h3>
        <p>We recommend regular vehicle detailing to maintain that showroom shine!</p>
        
        <a href="#" class="button">Book Again</a>
        
        <p>Thank you for trusting us with your vehicle!</p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Service Complete! - ${data.bookingReference}
    
    Dear ${data.customerName},
    
    Your vehicle service is complete!
    
    Service: ${data.serviceName}
    Vehicle: ${data.vehicleDetails}
    Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}
    
    We'd love your feedback on our service.
    
    Need another service? Call us at ${data.businessPhone}
    
    Thank you for choosing ${data.businessName}!
    
    © ${new Date().getFullYear()} ${data.businessName}
  `

  return { subject, html, text }
}

function getAdminNewBookingTemplate(data: NotificationData): EmailTemplate {
  const subject = `New Booking: ${data.bookingReference} - ${data.serviceName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Booking Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Booking Alert</h1>
      </div>
      
      <div class="content">
        <h2>New booking received!</h2>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <p><strong>Reference:</strong> ${data.bookingReference}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}</p>
          <p><strong>Time:</strong> ${data.scheduledTime}</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <p><strong>Vehicle:</strong> ${data.vehicleDetails}</p>
          <p><strong>Total:</strong> £${data.totalPrice.toFixed(2)}</p>
          ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
        </div>
        
        <p>Please confirm this booking in the admin dashboard.</p>
      </div>
      
      <div class="footer">
        <p>Admin notification from ${data.businessName}</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    New Booking Alert - ${data.bookingReference}
    
    Customer: ${data.customerName} (${data.customerEmail})
    Service: ${data.serviceName}
    Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')} at ${data.scheduledTime}
    Address: ${data.address}
    Vehicle: ${data.vehicleDetails}
    Total: £${data.totalPrice.toFixed(2)}
    ${data.specialInstructions ? `Instructions: ${data.specialInstructions}` : ''}
    
    Please confirm this booking in the admin dashboard.
  `

  return { subject, html, text }
}

function getAdminCancellationTemplate(data: NotificationData): EmailTemplate {
  const subject = `Booking Cancelled: ${data.bookingReference}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancellation Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .cancellation-details { background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Booking Cancellation</h1>
      </div>
      
      <div class="content">
        <h2>Booking cancelled</h2>
        
        <div class="cancellation-details">
          <h3>Cancelled Booking</h3>
          <p><strong>Reference:</strong> ${data.bookingReference}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(data.scheduledDate).toLocaleDateString('en-GB')}</p>
          <p><strong>Time:</strong> ${data.scheduledTime}</p>
          <p><strong>Value:</strong> £${data.totalPrice.toFixed(2)}</p>
          ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
        </div>
        
        <p>The time slot is now available for rebooking.</p>
      </div>
      
      <div class="footer">
        <p>Admin notification from ${data.businessName}</p>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Booking Cancelled - ${data.bookingReference}
    
    Customer: ${data.customerName}
    Service: ${data.serviceName}
    Date: ${new Date(data.scheduledDate).toLocaleDateString('en-GB')} at ${data.scheduledTime}
    Value: £${data.totalPrice.toFixed(2)}
    ${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}
    
    Time slot is now available for rebooking.
  `

  return { subject, html, text }
}