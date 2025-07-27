# Email Setup Guide

The forgot password functionality is now implemented and working. Currently, emails are logged to console for development purposes. To enable actual email sending in production, follow this guide.

## Current Status

✅ **Implemented:**
- Forgot password flow with secure token generation
- Password reset page with token validation
- Professional email templates with purple brand styling
- Email API endpoint structure
- Console logging for development testing

📧 **Email Content:**
When you test the forgot password flow, check your server console to see the full HTML email that would be sent. It includes:
- Professional Love 4 Detailing branding
- Purple gradient design matching the website
- Secure reset button and backup link
- Security warnings and instructions
- 1-hour expiration notice

## Production Email Setup Options

### Option 1: Resend (Recommended - Modern & Simple)

1. **Install Resend:**
```bash
npm install resend
```

2. **Update `/src/app/api/email/send/route.ts`:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Replace the demo code with:
const { data, error } = await resend.emails.send({
  from: 'Love 4 Detailing <noreply@yourdomain.com>',
  to: [to],
  subject,
  html,
  text
})

if (error) {
  throw new Error(`Email send failed: ${error.message}`)
}
```

3. **Environment Variables:**
```env
RESEND_API_KEY=your_resend_api_key
```

### Option 2: SendGrid

1. **Install SendGrid:**
```bash
npm install @sendgrid/mail
```

2. **Update the email send route:**
```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const msg = {
  to,
  from: 'noreply@yourdomain.com',
  subject,
  html,
  text
}

await sgMail.send(msg)
```

### Option 3: AWS SES

1. **Install AWS SDK:**
```bash
npm install @aws-sdk/client-ses
```

2. **Configure SES client and update route accordingly**

### Option 4: Nodemailer (SMTP)

1. **Install Nodemailer:**
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

2. **Update the email route:**
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to,
  subject,
  html,
  text
})
```

## Testing the Current Implementation

1. **Start the development server:**
```bash
npm run dev
```

2. **Test forgot password:**
   - Go to `/auth/forgot-password`
   - Enter any email address
   - Check your server console for the email content
   - Copy the reset URL from the console
   - Visit the reset URL to test the full flow

3. **Console Output Example:**
```
=== EMAIL SEND REQUEST ===
To: user@example.com
Subject: Reset Your Password - Love 4 Detailing
HTML Content: <!DOCTYPE html><html><head>...
Text Content: PASSWORD RESET - Love 4 Detailing...
=========================
Password reset email sent successfully to: user@example.com
```

## Security Features (Already Implemented)

✅ **Token Security:**
- SHA-256 hashed tokens stored in database
- 1-hour expiration time
- Single-use tokens (deleted after successful reset)
- Automatic cleanup of expired tokens

✅ **Email Security:**
- No user enumeration (same response for existing/non-existing emails)
- Professional branded templates
- Clear security warnings and instructions
- Fallback text version for all HTML emails

## Database Requirements

The following table is already added to your schema:

```sql
CREATE TABLE password_reset_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Next Steps

1. Choose an email provider from the options above
2. Replace the demo email sending code in `/src/app/api/email/send/route.ts`
3. Add the required environment variables
4. Test with a real email address
5. Monitor email delivery rates and bounces in production

The forgot password system is production-ready and secure - you just need to connect it to a real email service!