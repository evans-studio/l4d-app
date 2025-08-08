#!/bin/bash

# Love4Detailing Production Deployment Script
# This script automates the production deployment process with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="love-4-detailing"
DOMAIN="love4detailing.com"

echo -e "${BLUE}🚀 Love4Detailing Production Deployment${NC}"
echo "=================================="
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: Must be on main branch for production deployment${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: Uncommitted changes detected${NC}"
    echo "Please commit all changes before deploying to production"
    git status --short
    exit 1
fi

# Check if main branch is up to date with remote
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${RED}❌ Error: Local main branch is not up to date with remote${NC}"
    echo "Please pull latest changes: git pull origin main"
    exit 1
fi

echo -e "${GREEN}✅ Git status checks passed${NC}"

# Step 2: Run tests
echo -e "${YELLOW}🧪 Running test suite...${NC}"

if ! npm test -- --watchAll=false; then
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All tests passed${NC}"

# Step 3: Build and analyze
echo -e "${YELLOW}🏗️  Building application...${NC}"

if ! npm run build; then
    echo -e "${RED}❌ Build failed. Deployment aborted.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 4: Run production readiness check
echo -e "${YELLOW}🔍 Running production readiness check...${NC}"

if ! node scripts/production-readiness-check.js; then
    echo -e "${RED}❌ Production readiness check failed${NC}"
    echo "Please fix all issues before deploying to production"
    exit 1
fi

echo -e "${GREEN}✅ Production readiness verified${NC}"

# Step 5: Security audit
echo -e "${YELLOW}🛡️  Running security audit...${NC}"

npm audit --audit-level=high --production
if [ $? -eq 1 ]; then
    echo -e "${YELLOW}⚠️  High severity vulnerabilities found${NC}"
    read -p "Do you want to continue deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Security audit completed${NC}"

# Step 6: Bundle analysis
echo -e "${YELLOW}📊 Analyzing bundle size...${NC}"

npm run analyze-bundle
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Bundle analysis warnings detected${NC}"
fi

# Step 7: Confirmation
echo ""
echo -e "${YELLOW}⚠️  Ready to deploy to production!${NC}"
echo "Domain: $DOMAIN"
echo "Branch: $CURRENT_BRANCH"
echo "Commit: $(git log -1 --format='%h %s')"
echo ""
read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Step 8: Deploy to Vercel
echo -e "${YELLOW}🚀 Deploying to production...${NC}"

if ! npx vercel deploy --prod; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"

# Step 9: Post-deployment verification
echo -e "${YELLOW}🏥 Running post-deployment health checks...${NC}"

# Wait for deployment to be ready
sleep 30

# Health check endpoints
endpoints=(
    "https://$DOMAIN/api/health"
    "https://$DOMAIN/"
    "https://$DOMAIN/book"
)

failed_checks=0

for endpoint in "${endpoints[@]}"; do
    echo "Checking $endpoint..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 30)
    if [ "$response" -eq 200 ] || [ "$response" -eq 204 ]; then
        echo -e "${GREEN}✅ $endpoint - OK ($response)${NC}"
    else
        echo -e "${RED}❌ $endpoint - FAILED ($response)${NC}"
        ((failed_checks++))
    fi
done

# Step 10: Database connectivity check
echo "Checking database connectivity..."
if npm run test:database-connection --silent; then
    echo -e "${GREEN}✅ Database connection - OK${NC}"
else
    echo -e "${RED}❌ Database connection - FAILED${NC}"
    ((failed_checks++))
fi

# Step 11: Email service check
echo "Checking email service..."
if npm run test:email --silent; then
    echo -e "${GREEN}✅ Email service - OK${NC}"
else
    echo -e "${YELLOW}⚠️  Email service - WARNING (check configuration)${NC}"
fi

# Step 12: Summary
echo ""
echo "=================================="
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "=================================="
echo "🌐 Website: https://$DOMAIN"
echo "⏰ Deployed: $(date)"
echo "🔗 Commit: $(git log -1 --format='%h %s')"

if [ $failed_checks -eq 0 ]; then
    echo -e "${GREEN}✅ All health checks passed${NC}"
    echo ""
    echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Monitor error rates and performance"
    echo "2. Verify all booking flows work correctly"  
    echo "3. Check email deliverability"
    echo "4. Test mobile responsiveness"
    echo ""
    echo "Monitoring:"
    echo "- Analytics: Google Analytics 4"
    echo "- Errors: Check browser console and server logs"
    echo "- Performance: Core Web Vitals in DevTools"
else
    echo -e "${RED}❌ $failed_checks health check(s) failed${NC}"
    echo ""
    echo "⚠️  Deployment completed but with issues"
    echo "Please investigate failed health checks immediately"
    echo ""
    echo "Quick rollback: npx vercel rollback"
fi

echo ""
echo "Support: zell@love4detailing.com | +44 7908 625581"