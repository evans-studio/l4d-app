# Love4Detailing - Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the Love4Detailing platform, including environment setup, security configuration, monitoring, and post-deployment verification.

## 🚀 Deployment Checklist

### Pre-Deployment Requirements

- [ ] All environment variables configured in Vercel
- [ ] Database schema migrations completed
- [ ] SSL certificate configured
- [ ] Domain DNS settings updated
- [ ] Third-party integrations tested
- [ ] Performance tests passed
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured (Google Analytics 4)
- [ ] Email service tested (Resend)
- [ ] Payment integration verified (PayPal)

---

## 📋 Environment Configuration

### Required Environment Variables

```bash
# Core Application
NODE_ENV=production
NEXTAUTH_URL=https://love4detailing.com
NEXTAUTH_SECRET=your_nextauth_secret_key

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://vwejbgfiddltdqwhfjmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:[password]@db.vwejbgfiddltdqwhfjmt.supabase.co:5432/postgres

# Authentication & Security
ACCESS_TOKEN_SECRET=your_access_token_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
NEXT_PUBLIC_FROM_EMAIL=zell@love4detailing.com
ADMIN_EMAIL=zell@love4detailing.com
EMAIL_REPLY_TO=zell@love4detailing.com

# Payment Integration
# Use your real values in production; avoid committing secrets. Example placeholders:
PAYPAL_ME_USERNAME=mock
PAYPAL_BUSINESS_EMAIL=merchant@example.com

# Monitoring & Analytics (Optional)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Business Configuration
BUSINESS_NAME=Love 4 Detailing
BUSINESS_PHONE=+447908625581
BUSINESS_EMAIL=zell@love4detailing.com
SERVICE_RADIUS_MILES=25
```

### Vercel Environment Setup

1. **Access Vercel Dashboard**
   ```bash
   npx vercel login
   npx vercel
   ```

2. **Configure Environment Variables**
   ```bash
   # Set production environment variables
   npx vercel env add NEXTAUTH_SECRET production
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # ... repeat for all required variables
   ```

3. **Domain Configuration**
   ```bash
   npx vercel domains add love4detailing.com
   npx vercel domains add www.love4detailing.com
   ```

---

## 🗄️ Database Setup

### Supabase Configuration

1. **Enable Row Level Security**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE services ENABLE ROW LEVEL SECURITY;
   ```

2. **Create Production Policies**
   ```sql
   -- User access policy
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid() = id);
   
   -- Booking policies
   CREATE POLICY "Users can view own bookings" ON bookings
     FOR SELECT USING (auth.uid() = user_id);
   
   CREATE POLICY "Admins can view all bookings" ON bookings
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM users 
         WHERE id = auth.uid() 
         AND role IN ('admin', 'super_admin')
       )
     );
   ```

3. **Setup Database Functions**
   ```sql
   -- Function to handle user creation
   CREATE OR REPLACE FUNCTION handle_new_user() 
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO users (id, email, role, created_at)
     VALUES (NEW.id, NEW.email, 'customer', NOW());
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   -- Trigger for new user registration
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION handle_new_user();
   ```

### Database Migration Script

```bash
#!/bin/bash
# run-migrations.sh

echo "🗄️  Running database migrations..."

# 1. Apply schema changes
npx supabase db push

# 2. Seed initial data
psql $DATABASE_URL -f scripts/seed-services.sql
psql $DATABASE_URL -f scripts/create-admin-users.sql

# 3. Verify migrations
npm run test:database

echo "✅ Database migrations completed"
```

---

## 🛡️ Security Configuration

### 1. SSL Certificate Setup

Vercel automatically provides SSL certificates. Verify:

```bash
# Test SSL configuration
curl -I https://love4detailing.com
# Should return: HTTP/2 200
```

### 2. Security Headers

Configured in `next.config.ts`:

```typescript
// Security headers are automatically applied
const securityHeaders = [
  'X-DNS-Prefetch-Control: on',
  'X-XSS-Protection: 1; mode=block',
  'X-Frame-Options: DENY',
  'X-Content-Type-Options: nosniff',
  'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'
]
```

### 3. Environment Validation

```bash
# Run production readiness check
npm run production-ready

# Expected output:
# ✅ Environment variables: All required variables set
# ✅ Security configuration: Headers and policies configured  
# ✅ Build process: Application builds successfully
# ✅ Legal compliance: Privacy Policy and Terms exist
# 🎉 PRODUCTION READY! All checks passed.
```

---

## 🔧 Third-Party Integrations

### 1. Email Service (Resend)

Test email functionality:

```bash
# Test email sending
npm run test:email

# Expected output:
# ✅ SMTP connection successful
# ✅ Test email sent to admin
# ✅ Email templates rendered correctly
```

### 2. Payment Integration (PayPal)

Verify PayPal integration:

```bash
# Test PayPal configuration
curl -X POST https://love4detailing.com/api/payment/verify-config
```

### 3. Analytics (Google Analytics 4)

Verify GA4 setup:
- Check measurement ID configuration
- Test event tracking
- Verify cookie consent integration

---

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

Configure Sentry for production:

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure environment
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=love4detailing
SENTRY_PROJECT=website
```

### 2. Performance Monitoring

Built-in performance tracking:
- Core Web Vitals monitoring
- API response time tracking
- Booking flow performance metrics

### 3. Uptime Monitoring

Set up external monitoring:
- Use UptimeRobot or similar service
- Monitor critical endpoints:
  - `https://love4detailing.com/api/health`
  - `https://love4detailing.com/book`
  - `https://love4detailing.com/admin`

---

## 🚀 Deployment Process

### 1. Pre-Deployment Verification

```bash
# Run complete test suite
npm run test
npm run test:e2e

# Build and analyze bundle
npm run build
npm run analyze-bundle

# Check for security vulnerabilities
npm audit --production
```

### 2. Deploy to Production

```bash
# Deploy to Vercel
npx vercel --prod

# Or using GitHub integration:
# Push to main branch triggers automatic deployment
```

### 3. Post-Deployment Verification

```bash
# Health check script
#!/bin/bash
echo "🏥 Running post-deployment health checks..."

# Test critical endpoints
endpoints=(
  "https://love4detailing.com/api/health"
  "https://love4detailing.com/api/auth/user"
  "https://love4detailing.com/api/services"
  "https://love4detailing.com/book"
)

for endpoint in "${endpoints[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" $endpoint)
  if [ $response -eq 200 ]; then
    echo "✅ $endpoint - OK"
  else
    echo "❌ $endpoint - FAILED ($response)"
  fi
done

# Test database connectivity
npm run test:database-connection

# Verify email functionality
npm run test:email-production

echo "✅ Health checks completed"
```

---

## 🔒 DNS Configuration

### Cloudflare Setup (Recommended)

1. **Add Domain to Cloudflare**
   - Point nameservers to Cloudflare
   - Enable proxy (orange cloud)

2. **DNS Records**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Cloudflare Settings**
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Security Level: Medium
   - Browser Cache TTL: 4 hours

---

## 📈 Performance Optimization

### 1. Caching Strategy

```typescript
// API routes caching
export const revalidate = 3600 // 1 hour

// Static pages caching
export const metadata = {
  // Cached for 24 hours
  'cache-control': 'public, s-maxage=86400'
}
```

### 2. Image Optimization

```typescript
// Next.js Image optimization
export default {
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  }
}
```

### 3. Bundle Analysis

```bash
# Generate bundle analysis
npm run analyze-bundle

# Review recommendations:
# - Code splitting implemented ✅
# - Bundle size under 3MB ✅  
# - No duplicate dependencies ✅
```

---

## 🚨 Incident Response

### 1. Monitoring Alerts

Configure alerts for:
- Server errors (5xx responses)
- High response times (>2s)
- Failed payment transactions
- Database connection issues

### 2. Rollback Procedure

```bash
# Quick rollback to previous deployment
npx vercel rollback

# Or redeploy specific commit
npx vercel --prod --local-config vercel.json
```

### 3. Emergency Contacts

- **Technical Issues**: zell@love4detailing.com
- **Database Issues**: Contact Supabase support
- **DNS/CDN Issues**: Contact Cloudflare support
- **Email Issues**: Contact Resend support

---

## 📋 Post-Launch Tasks

### Week 1
- [ ] Monitor error rates and performance
- [ ] Verify all booking flows work correctly
- [ ] Check email deliverability
- [ ] Test mobile responsiveness
- [ ] Verify SEO meta tags

### Week 2
- [ ] Set up automated backups
- [ ] Configure log retention policies
- [ ] Create monitoring dashboards  
- [ ] Document any discovered issues
- [ ] Plan first maintenance window

### Month 1
- [ ] Review analytics data
- [ ] Optimize based on user behavior
- [ ] Update documentation
- [ ] Plan feature roadmap
- [ ] Conduct security review

---

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npx vercel build --force
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify all variables are set
   npx vercel env ls
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connectivity
   npm run test:db-connection
   ```

4. **Email Delivery Issues**
   ```bash
   # Check Resend dashboard
   # Verify DNS records for domain authentication
   ```

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## 📞 Support

For deployment assistance:
- **Email**: zell@love4detailing.com  
- **Phone**: +44 7908 625581

---

*This deployment guide is maintained as part of the Love4Detailing production infrastructure. Last updated: $(date)*