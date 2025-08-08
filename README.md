# Love4Detailing - Production Ready Mobile Car Detailing Platform

A professional, full-stack mobile car detailing booking platform built with Next.js 14, TypeScript, and Supabase. Features real-time booking management, customer dashboard, admin portal, and comprehensive business analytics.

## 🚀 Production Features

- **📱 Mobile-First Design**: Responsive PWA-ready interface
- **🔐 Secure Authentication**: Supabase Auth with role-based access control  
- **📊 Real-Time Dashboard**: Live booking updates and business analytics
- **💳 Payment Integration**: PayPal integration for seamless payments
- **📧 Email Notifications**: Automated booking confirmations and reminders
- **🌍 Location Services**: Postcode-based service area validation
- **📈 Performance Monitoring**: Core Web Vitals tracking and alerting
- **🛡️ Security Hardened**: CSP headers, RLS policies, input sanitization
- **🎯 GDPR Compliant**: Cookie consent and privacy controls

## 🏗️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Authentication**: Supabase Auth + JWT
- **Database**: PostgreSQL with Row Level Security
- **Email**: Resend API
- **Analytics**: Google Analytics 4 + Custom tracking
- **Monitoring**: Custom alerting system + Lighthouse CI
- **Deployment**: Vercel with automated performance budgets

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- Resend API key for emails

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd love-4-detailing
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   # Configure all required environment variables
   ```

3. **Database Setup**:
   ```bash
   # Run database migrations
   psql $DATABASE_URL -f scripts/run-migrations.sql
   
   # For fresh start, reset database
   npm run reset-database
   ```

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

## 🔧 Available Scripts

### Core Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Production Scripts  
- `npm run production-ready` - Full production readiness check
- `npm run performance-check` - Run performance budget enforcement
- `npm run reset-database` - Reset database for fresh production deployment
- `npm run analyze-bundle` - Analyze bundle size and optimization

### Database Scripts
- `npm run generate-types` - Generate TypeScript types from Supabase schema
- `npm run reset-database` - Complete database reset (CAUTION: Deletes all user data)

## 📁 Project Structure

```
love-4-detailing/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/              # Authentication pages
│   │   ├── book/              # Booking flow
│   │   └── dashboard/         # Customer dashboard
│   ├── components/            # React components
│   │   ├── ui/               # Design system components
│   │   ├── admin/            # Admin-specific components
│   │   └── booking/          # Booking flow components
│   ├── lib/                  # Utilities and services
│   │   ├── analytics/        # GA4 and consent management
│   │   ├── monitoring/       # Performance monitoring
│   │   ├── services/         # Business logic services
│   │   └── supabase/         # Database clients
│   └── hooks/                # Custom React hooks
├── scripts/                  # Build and deployment scripts
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🗄️ Database Schema

### Core Tables
- **users** - User authentication and basic info
- **user_profiles** - Extended user profile data  
- **customer_addresses** - Customer service addresses
- **customer_vehicles** - Customer vehicle information
- **bookings** - Service bookings and appointments
- **time_slots** - Available appointment slots
- **services** - Service definitions and pricing

### Business Tables
- **service_pricing** - Dynamic pricing rules
- **booking_history** - Audit trail of booking changes
- **notification_preferences** - User communication preferences

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **Content Security Policy**: Prevents XSS attacks
- **Input Sanitization**: All user inputs validated and sanitized
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete action history tracking
- **GDPR Compliance**: Cookie consent and data protection

## 📊 Monitoring & Performance

- **Core Web Vitals**: LCP, FID, CLS tracking
- **Performance Budgets**: Automated bundle size enforcement
- **Real-time Alerts**: Email notifications for issues
- **Business Metrics**: Booking conversion and revenue tracking
- **Error Tracking**: Comprehensive error logging

## 🚢 Deployment

### Production Deployment (Vercel)

1. **Pre-deployment Check**:
   ```bash
   npm run production-ready
   ```

2. **Automated Deployment**:
   ```bash
   ./scripts/deploy-production.sh
   ```

3. **Manual Deployment**:
   ```bash
   npx vercel --prod
   ```

### Environment Configuration

Required environment variables for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `PAYPAL_ME_USERNAME`
- `PAYPAL_BUSINESS_EMAIL`
- `NEXTAUTH_SECRET`
- And more... (see `.env.example`)

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Disaster Recovery Plan](DISASTER_RECOVERY_PLAN.md)** - Business continuity procedures  
- **[Production Launch Checklist](PRODUCTION_LAUNCH_CHECKLIST.md)** - Pre-launch verification
- **[Architecture Guide](CLAUDE.md)** - Technical architecture and patterns

## 🔧 Maintenance

### Regular Tasks
- **Weekly**: Review performance metrics and error logs
- **Monthly**: Update dependencies and security patches  
- **Quarterly**: Audit user permissions and data cleanup

### Database Maintenance
```bash
# Reset for fresh production deployment
npm run reset-database

# Generate updated TypeScript types
npm run generate-types
```

## 📞 Support

- **Business Owner**: zell@love4detailing.com | +44 7908 625581
- **Technical Issues**: Check error logs and monitoring dashboard
- **Emergency**: Follow disaster recovery procedures in documentation

## 📄 License

This project is proprietary software for Love4Detailing business operations.

---

**Love4Detailing** - Professional mobile car detailing services across the UK.
*Built with ❤️ for exceptional customer experience.*