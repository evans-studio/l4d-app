# Love4Detailing - Disaster Recovery Plan

## 🚨 Emergency Contacts

**Primary Contact**: Zell (Business Owner)
- **Phone**: +44 7908 625581
- **Email**: zell@love4detailing.com
- **Role**: Primary decision maker for all recovery operations

**Technical Support**:
- **Vercel Support**: https://vercel.com/help
- **Supabase Support**: https://supabase.com/support
- **Domain Support**: Contact domain registrar

---

## 📋 Disaster Recovery Overview

### Recovery Objectives
- **RTO (Recovery Time Objective)**: 4 hours maximum
- **RPO (Recovery Point Objective)**: 15 minutes maximum data loss
- **Availability Target**: 99.9% uptime

### Disaster Scenarios Covered
1. **Complete Website Outage**
2. **Database Failure/Corruption**
3. **DNS/Domain Issues**
4. **Third-party Service Failures**
5. **Code Repository Loss**
6. **Email Service Disruption**

---

## 🔄 Backup Strategy

### 1. Database Backups (Supabase)

**Automatic Backups**:
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Location**: Supabase managed backups
- **Access**: Via Supabase dashboard

**Manual Backup Process**:
```bash
#!/bin/bash
# Manual database backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="love4detailing_backup_$DATE.sql"

# Export database
pg_dump $DATABASE_URL > backups/$BACKUP_FILE

# Compress backup
gzip backups/$BACKUP_FILE

echo "✅ Database backup created: $BACKUP_FILE.gz"
```

**Backup Verification**:
```bash
# Test backup integrity weekly
pg_restore --list backups/latest_backup.sql.gz
```

### 2. Code Repository Backups (GitHub)

**Primary Repository**: https://github.com/[username]/love-4-detailing
- **Protection**: Branch protection rules on main
- **Mirrors**: Automatically mirrored to GitHub
- **Access Control**: Owner + collaborators only

**Local Backup Script**:
```bash
#!/bin/bash
# Create local backup of repository

git bundle create love4detailing_$(date +%Y%m%d).bundle --all
```

### 3. Configuration Backups

**Environment Variables**:
- **Location**: Encrypted file in secure storage
- **Update Frequency**: After any environment change
- **Access**: Business owner only

**DNS Configuration**:
- **Documented**: DNS_RECORDS.md (see below)
- **Screenshots**: Saved in secure storage
- **Provider**: Domain registrar backup

---

## 🚀 Recovery Procedures

### Scenario 1: Complete Website Outage

**Symptoms**:
- Website returns 5xx errors
- Users cannot access any pages
- Admin dashboard unavailable

**Immediate Response (0-15 minutes)**:
1. **Verify Outage**:
   ```bash
   # Check website status
   curl -I https://love4detailing.com
   # Expected: HTTP/2 200 (or redirect)
   ```

2. **Check Vercel Status**:
   - Visit: https://vercel.com/status
   - Check project status in Vercel dashboard

3. **Quick Rollback**:
   ```bash
   # Rollback to previous deployment
   npx vercel rollback --prod
   ```

**Detailed Recovery (15-60 minutes)**:
1. **Investigate Root Cause**:
   - Check Vercel deployment logs
   - Review error tracking (Sentry)
   - Check database connectivity

2. **Database Recovery** (if needed):
   ```bash
   # Connect to Supabase and verify
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM bookings;"
   ```

3. **Code Recovery** (if needed):
   ```bash
   # Deploy from last known good commit
   git checkout [last-good-commit]
   npx vercel deploy --prod
   ```

### Scenario 2: Database Failure

**Symptoms**:
- API endpoints returning database errors
- Unable to view/create bookings
- User authentication failing

**Recovery Steps**:
1. **Assess Damage**:
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "\dt"
   ```

2. **Restore from Backup**:
   ```bash
   # Using Supabase dashboard:
   # 1. Go to Database → Backups
   # 2. Select most recent backup
   # 3. Click "Restore"
   ```

3. **Verify Data Integrity**:
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM bookings WHERE created_at > NOW() - INTERVAL '24 hours';
   SELECT COUNT(*) FROM services WHERE active = true;
   ```

4. **Test Application**:
   - User registration/login
   - Booking creation
   - Admin functions

### Scenario 3: DNS/Domain Issues

**Symptoms**:
- Domain not resolving
- SSL certificate errors
- Users seeing "site not found"

**Recovery Steps**:
1. **Check DNS Propagation**:
   ```bash
   # Check DNS resolution
   nslookup love4detailing.com
   dig love4detailing.com
   ```

2. **Verify DNS Records**:
   ```
   # Required DNS Records:
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Alternative Domain Setup**:
   - Use backup domain if available
   - Update social media links
   - Notify customers via email/phone

### Scenario 4: Third-Party Service Failures

**Email Service (Resend)**:
1. **Verify Service Status**:
   - Check Resend status page
   - Test email sending: `npm run test:email`

2. **Backup Email Solution**:
   ```javascript
   // Fallback to alternative email service
   // Configure backup SMTP settings
   ```

**Payment Processing (PayPal)**:
1. **Check PayPal Status**
2. **Manual Processing**:
   - Take payments over phone
   - Update bookings manually
   - Send confirmation emails

---

## 🔧 Recovery Scripts

### Complete System Restoration

```bash
#!/bin/bash
# complete-recovery.sh
# Full system recovery from backups

echo "🚨 Starting Love4Detailing disaster recovery..."

# 1. Restore code repository
echo "📥 Restoring code repository..."
git clone https://github.com/[username]/love-4-detailing.git recovery-temp
cd recovery-temp

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Configure environment
echo "⚙️ Setting up environment..."
# Restore environment variables from secure backup
# (This step requires manual intervention for security)

# 4. Test build
echo "🏗️ Testing build..."
npm run build

# 5. Deploy to new Vercel project if needed
echo "🚀 Deploying to production..."
npx vercel deploy --prod

# 6. Verify deployment
echo "🏥 Running health checks..."
curl -f https://love4detailing.com/api/health || exit 1

echo "✅ Recovery completed successfully!"
```

### Database Recovery

```bash
#!/bin/bash
# database-recovery.sh
# Restore database from backup

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./database-recovery.sh <backup-file>"
    exit 1
fi

echo "🗄️ Starting database recovery..."

# 1. Create recovery database
echo "Creating recovery database..."
# This would typically be done through Supabase dashboard

# 2. Restore data
echo "Restoring data from backup: $BACKUP_FILE"
pg_restore -d $DATABASE_URL $BACKUP_FILE

# 3. Verify restoration
echo "Verifying data integrity..."
psql $DATABASE_URL -c "
    SELECT 
        'users' as table_name, COUNT(*) as record_count 
    FROM users
    UNION ALL
    SELECT 
        'bookings' as table_name, COUNT(*) as record_count 
    FROM bookings
    UNION ALL
    SELECT 
        'services' as table_name, COUNT(*) as record_count 
    FROM services;
"

echo "✅ Database recovery completed!"
```

---

## 📊 Monitoring & Alerts

### Health Check Endpoints
- **Main Site**: `GET /api/health`
- **Database**: `GET /api/health/database`
- **Email**: `GET /api/health/email`

### Automated Monitoring
```bash
#!/bin/bash
# health-monitor.sh
# Run every 5 minutes via cron

ENDPOINTS=(
    "https://love4detailing.com/api/health"
    "https://love4detailing.com/api/health/database"
)

for endpoint in "${endpoints[@]}"; do
    if ! curl -f -s "$endpoint" > /dev/null; then
        echo "🚨 ALERT: $endpoint is down!"
        # Send alert email/SMS
    fi
done
```

---

## 📁 Critical Files Backup

### DNS Records Configuration
```
# DNS_RECORDS.md - Critical DNS Configuration

## Primary Domain: love4detailing.com
Type: CNAME | Name: @ | Value: cname.vercel-dns.com | TTL: 300
Type: CNAME | Name: www | Value: cname.vercel-dns.com | TTL: 300

## Email Records (if applicable)
Type: MX | Name: @ | Value: [email-provider-mx] | Priority: 10
Type: TXT | Name: @ | Value: v=spf1 include:[provider] ~all

## Verification Records
Type: TXT | Name: @ | Value: [domain-verification-token]
```

### Environment Variables Template
```bash
# .env.production.template
# Copy of all required environment variables (values redacted)

# Core Application
NODE_ENV=production
NEXTAUTH_URL=https://love4detailing.com
NEXTAUTH_SECRET=[REDACTED]

# Database
NEXT_PUBLIC_SUPABASE_URL=[REDACTED]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
DATABASE_URL=[REDACTED]

# Authentication
ACCESS_TOKEN_SECRET=[REDACTED]
REFRESH_TOKEN_SECRET=[REDACTED]

# Email
RESEND_API_KEY=[REDACTED]
NEXT_PUBLIC_FROM_EMAIL=zell@love4detailing.com
ADMIN_EMAIL=zell@love4detailing.com
EMAIL_REPLY_TO=zell@love4detailing.com

# Payment
# Example placeholders; configure real secrets in CI/CD, not in code/docs
PAYPAL_ME_USERNAME=mock
PAYPAL_BUSINESS_EMAIL=merchant@example.com

# Monitoring
SENTRY_DSN=[REDACTED]
NEXT_PUBLIC_GA4_MEASUREMENT_ID=[REDACTED]
```

---

## 🏥 Post-Recovery Verification

### Verification Checklist
- [ ] Website loads correctly
- [ ] User registration/login works
- [ ] Booking system functional
- [ ] Admin dashboard accessible
- [ ] Email notifications sending
- [ ] Payment processing working
- [ ] SSL certificate valid
- [ ] DNS resolution correct
- [ ] Analytics tracking active
- [ ] Error monitoring operational

### Performance Verification
```bash
# performance-check.sh
echo "🔍 Running performance verification..."

# 1. Page load time
curl -o /dev/null -s -w "Load time: %{time_total}s\n" https://love4detailing.com

# 2. API response time
curl -o /dev/null -s -w "API response: %{time_total}s\n" https://love4detailing.com/api/health

# 3. Database query time
npm run test:database-performance

echo "✅ Performance verification completed"
```

---

## 📞 Communication Plan

### During Incident
1. **Internal Communication**:
   - Business owner notified immediately
   - Technical team (if applicable) updated hourly
   
2. **Customer Communication**:
   - Social media status update
   - Email to active customers (if > 2 hour outage)
   - Phone message for critical bookings

### Post-Recovery
1. **Incident Report**:
   - Root cause analysis
   - Timeline of events
   - Lessons learned
   - Preventive measures

2. **Customer Notification**:
   - "All systems restored" announcement
   - Apology if service was significantly impacted
   - Any required customer actions

---

## 🔒 Security Considerations

### Access Control
- **Recovery passwords**: Stored in secure password manager
- **API keys**: Encrypted backup in separate location
- **Database access**: Limited to business owner
- **Domain access**: Protected with 2FA

### Data Protection
- **Customer data**: Never stored in plain text backups
- **Payment info**: Not stored (PayPal handles this)
- **Personal data**: GDPR compliant handling during recovery

---

## 📅 Testing & Maintenance

### Regular Testing Schedule
- **Monthly**: Backup restoration test
- **Quarterly**: Full disaster recovery drill
- **Semi-annually**: Update emergency contacts
- **Annually**: Review and update entire plan

### Maintenance Tasks
```bash
# Weekly backup verification
./scripts/verify-backups.sh

# Monthly DR drill
./scripts/disaster-recovery-test.sh

# Quarterly plan review
echo "Review and update disaster recovery plan"
```

---

## 📚 Additional Resources

### Documentation Links
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments)
- [Supabase Backup & Restore](https://supabase.com/docs/guides/platform/backups)
- [GitHub Repository Management](https://docs.github.com/en/repositories)

### Emergency Procedures Quick Reference
```
1. Website Down → Check Vercel → Rollback if needed
2. Database Issue → Check Supabase → Restore from backup
3. DNS Problem → Check registrar → Verify DNS records
4. Email Down → Check Resend → Use phone for urgent comms
5. Complete Failure → Run complete-recovery.sh
```

---

**Emergency Hotline**: +44 7908 625581
**Last Updated**: $(date)
**Next Review**: $(date -d "+3 months")

*This disaster recovery plan should be reviewed and tested regularly to ensure its effectiveness.*