# Email Notification System

## Overview

The Love4Detailing platform includes a comprehensive email notification system that automatically sends emails to customers and administrators for booking-related events. The system uses Resend as the email service provider and includes professional HTML email templates.

## Features

### Customer Notifications
- **Booking Confirmation**: Sent when a new booking is created
- **Status Updates**: Sent when booking status changes (confirmed, cancelled, completed)
- **Professional HTML Templates**: Rich email templates with branding and styling

### Admin Notifications  
- **New Booking Alerts**: Immediate notification when customers create bookings
- **Comprehensive Details**: Full booking information including customer contact details
- **Action Items**: Clear next steps for processing bookings

## Configuration

### Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Resend API Configuration
RESEND_API_KEY=your_resend_api_key_here

# Email Configuration
EMAIL_FROM=bookings@love4detailing.co.uk
EMAIL_REPLY_TO=hello@love4detailing.co.uk  
ADMIN_EMAIL=admin@love4detailing.co.uk
```

### Email Service Setup

The email service is automatically configured and used throughout the application. No additional setup is required once environment variables are configured.

## Email Types

### 1. Booking Confirmation Email (Customer)

**Trigger**: When a new booking is created  
**Recipient**: Customer who made the booking  
**Content**:
- Booking reference number
- Date and time details  
- Vehicle information
- Service address
- Total price
- Special instructions
- Next steps information
- Contact details

### 2. Admin Booking Notification

**Trigger**: When a new booking is created  
**Recipient**: Admin team  
**Content**:
- Urgent action required notification
- Customer contact information
- Complete booking details
- Pricing breakdown
- Service requirements
- Clear action items for processing

### 3. Booking Status Update Email (Customer)

**Trigger**: When booking status changes to confirmed, cancelled, or completed  
**Recipient**: Customer who made the booking  
**Content**:
- Status change notification
- Previous vs new status
- Reason for change (if provided)
- Status-specific guidance
- Contact information

## Implementation Details

### EmailService Class

Located at `src/lib/services/email.ts`, this class handles all email functionality:

```typescript
import { EmailService } from '@/lib/services/email'

const emailService = new EmailService()

// Send booking confirmation
await emailService.sendBookingConfirmation(
  customerEmail,
  customerName, 
  booking
)

// Send admin notification
await emailService.sendAdminBookingNotification(
  booking,
  customerEmail,
  customerName  
)

// Send status update
await emailService.sendBookingStatusUpdate(
  customerEmail,
  customerName,
  booking,
  previousStatus,
  updateReason
)
```

### Automatic Integration

Emails are automatically sent during:

1. **Booking Creation** (`/api/bookings/create`)
   - Customer confirmation email
   - Admin notification email

2. **Status Updates** (`BookingService.updateBookingStatus()`)
   - Customer status update email (for significant status changes)

### Error Handling

The email system is designed to never fail booking operations:

- Email failures are logged but don't prevent booking creation
- Graceful fallbacks for missing customer information
- Retry logic for temporary email service issues
- Comprehensive error logging for troubleshooting

## Email Templates

### Design Features

- **Responsive Design**: Works on all devices and email clients
- **Professional Branding**: Consistent with Love4Detailing brand colors
- **Clear Information Hierarchy**: Important details highlighted
- **Call-to-Action**: Clear next steps for recipients
- **Accessibility**: Screen reader friendly with semantic HTML

### Template Structure

Each email includes:
- Header with branding
- Main content area with booking details
- Important information callouts
- Footer with contact information
- Plain text alternative for accessibility

## Testing

### Test Email Endpoint

Use the test endpoint to verify email functionality:

```bash
# Test booking confirmation email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking-confirmation",
    "email": "test@example.com",
    "name": "Test Customer"
  }'

# Test admin notification email  
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "admin-notification", 
    "email": "admin@example.com",
    "name": "Test Customer"
  }'

# Test status update email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "status-update",
    "email": "test@example.com", 
    "name": "Test Customer"
  }'
```

### Development Testing

In development, emails are sent to real email addresses. Make sure to:
1. Use test email addresses
2. Configure Resend with a test API key
3. Monitor email delivery in Resend dashboard

## Monitoring & Analytics

### Email Delivery Tracking

Monitor email delivery through:
- Resend dashboard for delivery status
- Application logs for send attempts
- Customer feedback for delivery issues

### Key Metrics to Track

- Email delivery rate
- Open rates (if configured in Resend)
- Click-through rates on action items
- Customer response times to confirmations

## Customization

### Adding New Email Types

1. Add new method to `EmailService` class
2. Create HTML and text templates
3. Integrate with relevant API endpoints
4. Add test case to test endpoint

### Template Customization

Templates can be customized by:
- Modifying HTML structure in `EmailService` methods
- Updating CSS styles in template methods
- Adding new template variables
- Including additional branding elements

## Troubleshooting

### Common Issues

**Emails not sending:**
- Check RESEND_API_KEY environment variable
- Verify Resend account configuration
- Check application logs for error messages

**Missing customer information:**
- Verify user profile data is complete
- Check getUserProfile function
- Ensure user authentication is working

**Template formatting issues:**
- Test in multiple email clients
- Validate HTML structure
- Check CSS compatibility

### Support

For email system issues:
1. Check application logs for error details
2. Verify Resend dashboard for delivery status
3. Test with the `/api/test-email` endpoint
4. Review environment variable configuration

## Security Considerations

- API keys stored securely in environment variables
- No sensitive customer data in email content
- Email addresses validated before sending
- Rate limiting implemented to prevent abuse
- GDPR compliance for customer communications

## Future Enhancements

Potential improvements:
- Email scheduling for reminders
- Rich media attachments (invoices, receipts)
- Email preference management for customers
- Advanced analytics and reporting
- A/B testing for email templates
- Integration with marketing automation tools