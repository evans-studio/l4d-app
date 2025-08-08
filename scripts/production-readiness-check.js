#!/usr/bin/env node

/**
 * Production Readiness Check for Love4Detailing
 * 
 * Comprehensive script to verify the application is ready for production deployment.
 * Checks environment variables, security configuration, performance metrics, and more.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

class ProductionReadinessChecker {
  constructor() {
    this.checks = []
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    }
  }

  addCheck(name, category, checkFn, required = true) {
    this.checks.push({
      name,
      category,
      checkFn,
      required,
      result: null
    })
  }

  async runCheck(check) {
    try {
      const result = await check.checkFn()
      check.result = {
        status: result.success ? 'passed' : 'failed',
        message: result.message,
        details: result.details || [],
        recommendations: result.recommendations || []
      }
      
      if (result.success) {
        this.results.passed++
      } else {
        if (check.required) {
          this.results.failed++
        } else {
          this.results.warnings++
        }
      }
    } catch (error) {
      check.result = {
        status: 'failed',
        message: `Check failed: ${error.message}`,
        details: [],
        recommendations: []
      }
      
      if (check.required) {
        this.results.failed++
      } else {
        this.results.warnings++
      }
    }
    
    this.results.total++
  }

  async runAllChecks() {
    log('🔍 Running Production Readiness Checks...', 'bright')
    log('==========================================', 'bright')

    const categories = [...new Set(this.checks.map(c => c.category))]

    for (const category of categories) {
      log(`\n📋 ${category}`, 'cyan')
      log('-'.repeat(category.length + 4), 'cyan')

      const categoryChecks = this.checks.filter(c => c.category === category)
      
      for (const check of categoryChecks) {
        process.stdout.write(`  ${check.name}... `)
        await this.runCheck(check)
        
        const result = check.result
        if (result.status === 'passed') {
          log('✅', 'green')
        } else {
          const color = check.required ? 'red' : 'yellow'
          const icon = check.required ? '❌' : '⚠️'
          log(`${icon}`, color)
          
          if (result.message) {
            log(`     ${result.message}`, color)
          }
          
          if (result.recommendations.length > 0) {
            log(`     💡 Recommendations:`, 'blue')
            result.recommendations.forEach(rec => {
              log(`        • ${rec}`, 'blue')
            })
          }
        }
      }
    }
  }

  generateReport() {
    log('\n📊 Production Readiness Summary', 'bright')
    log('==============================', 'bright')
    
    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1)
    
    log(`\n  Total Checks: ${this.results.total}`, 'white')
    log(`  ✅ Passed: ${this.results.passed}`, 'green')
    log(`  ❌ Failed: ${this.results.failed}`, 'red')
    log(`  ⚠️  Warnings: ${this.results.warnings}`, 'yellow')
    log(`  📈 Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red')

    // Overall status
    if (this.results.failed === 0) {
      if (this.results.warnings === 0) {
        log('\n🎉 PRODUCTION READY! All checks passed.', 'green')
        log('   Your application is ready for production deployment.', 'green')
      } else {
        log('\n✅ PRODUCTION READY (with warnings)', 'yellow')
        log('   Your application is ready for production with some recommendations.', 'yellow')
      }
    } else {
      log('\n🚫 NOT PRODUCTION READY', 'red')
      log('   Please fix the failed checks before deploying to production.', 'red')
    }

    return this.results.failed === 0
  }

  // Individual check implementations
  checkEnvironmentVariables() {
    return new Promise((resolve) => {
      const requiredProdVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'RESEND_API_KEY',
        'NEXT_PUBLIC_FROM_EMAIL',
        'ADMIN_EMAIL',
        'EMAIL_REPLY_TO',
        'PAYPAL_ME_USERNAME',
        'PAYPAL_BUSINESS_EMAIL'
      ]

      const missing = []
      const weak = []

      // Check if .env.example exists
      if (!fs.existsSync('.env.example')) {
        resolve({
          success: false,
          message: '.env.example file missing',
          recommendations: ['Create .env.example with all required variables documented']
        })
        return
      }

      // Check each required variable
      requiredProdVars.forEach(varName => {
        const value = process.env[varName]
        if (!value) {
          missing.push(varName)
        } else if (value.includes('your_') || value.includes('test') || value.length < 8) {
          weak.push(varName)
        }
      })

      if (missing.length > 0) {
        resolve({
          success: false,
          message: `Missing required variables: ${missing.join(', ')}`,
          recommendations: [
            'Set all required environment variables for production',
            'Use strong, unique values for secrets',
            'Never commit real environment values to version control'
          ]
        })
      } else if (weak.length > 0) {
        resolve({
          success: false,
          message: `Weak or placeholder values detected: ${weak.join(', ')}`,
          recommendations: [
            'Replace placeholder values with real production values',
            'Ensure secrets are at least 32 characters long',
            'Use unique values for each environment'
          ]
        })
      } else {
        resolve({
          success: true,
          message: 'All required environment variables are set'
        })
      }
    })
  }

  checkSecurityConfiguration() {
    return new Promise((resolve) => {
      const issues = []
      const recommendations = []

      // Check if security headers are configured
      if (!fs.existsSync('next.config.ts')) {
        issues.push('next.config.ts not found')
        recommendations.push('Create next.config.ts with security headers')
      } else {
        const configContent = fs.readFileSync('next.config.ts', 'utf8')
        
        if (!configContent.includes('Content-Security-Policy')) {
          issues.push('CSP headers not configured')
          recommendations.push('Add Content-Security-Policy headers')
        }
        
        if (!configContent.includes('Strict-Transport-Security')) {
          issues.push('HSTS headers not configured')
          recommendations.push('Add Strict-Transport-Security headers')
        }
      }

      // Check if error boundaries exist
      const errorBoundaryExists = fs.existsSync('src/components/error/ErrorBoundary.tsx')
      if (!errorBoundaryExists) {
        issues.push('Error boundaries not implemented')
        recommendations.push('Implement React error boundaries for graceful error handling')
      }

      // Check if API response sanitization exists
      const apiSanitationExists = fs.existsSync('src/lib/utils/api-response.ts')
      if (!apiSanitationExists) {
        issues.push('API response sanitization not implemented')
        recommendations.push('Implement API response sanitization to prevent data leakage')
      }

      resolve({
        success: issues.length === 0,
        message: issues.length > 0 ? `Security issues: ${issues.join(', ')}` : 'Security configuration looks good',
        recommendations
      })
    })
  }

  checkTestCoverage() {
    return new Promise((resolve) => {
      try {
        // Check if test files exist
        const testFiles = []
        
        function findTestFiles(dir) {
          try {
            const files = fs.readdirSync(dir)
            files.forEach(file => {
              const fullPath = path.join(dir, file)
              const stat = fs.statSync(fullPath)
              
              if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                findTestFiles(fullPath)
              } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.spec.ts')) {
                testFiles.push(fullPath)
              }
            })
          } catch (error) {
            // Skip directories we can't read
          }
        }
        
        findTestFiles('src')
        
        if (testFiles.length === 0) {
          resolve({
            success: false,
            message: 'No test files found',
            recommendations: [
              'Create unit tests for critical business logic',
              'Add integration tests for API endpoints',
              'Implement end-to-end tests for user flows'
            ]
          })
        } else {
          // Check if Jest is configured
          const jestConfigExists = fs.existsSync('jest.config.js') || fs.existsSync('jest.setup.js')
          
          resolve({
            success: true,
            message: `Found ${testFiles.length} test files`,
            details: [`Jest configured: ${jestConfigExists ? 'Yes' : 'No'}`]
          })
        }
      } catch (error) {
        resolve({
          success: false,
          message: `Test check failed: ${error.message}`,
          recommendations: ['Set up testing framework and create test files']
        })
      }
    })
  }

  checkBuildConfiguration() {
    return new Promise((resolve) => {
      try {
        // Try to run build
        log('    Building application for production check...', 'blue')
        execSync('npm run build', { stdio: ['pipe', 'pipe', 'pipe'] })
        
        // Check if build outputs exist
        const buildExists = fs.existsSync('.next')
        const staticExists = fs.existsSync('.next/static')
        
        if (!buildExists) {
          resolve({
            success: false,
            message: 'Build output not found',
            recommendations: ['Fix build errors and ensure .next directory is created']
          })
        } else {
          resolve({
            success: true,
            message: 'Application builds successfully',
            details: [`Static assets: ${staticExists ? 'Generated' : 'Missing'}`]
          })
        }
      } catch (error) {
        resolve({
          success: false,
          message: 'Build failed',
          recommendations: [
            'Fix TypeScript compilation errors',
            'Resolve missing dependencies',
            'Check for syntax errors'
          ]
        })
      }
    })
  }

  checkLegalCompliance() {
    return new Promise((resolve) => {
      const privacyPolicyExists = fs.existsSync('src/app/privacy-policy/page.tsx')
      const termsExists = fs.existsSync('src/app/terms-of-service/page.tsx')
      
      const missing = []
      if (!privacyPolicyExists) missing.push('Privacy Policy')
      if (!termsExists) missing.push('Terms of Service')
      
      if (missing.length > 0) {
        resolve({
          success: false,
          message: `Missing legal pages: ${missing.join(', ')}`,
          recommendations: [
            'Create Privacy Policy page with UK GDPR compliance',
            'Create Terms of Service page covering booking and cancellation policies',
            'Ensure legal pages are accessible from the website footer'
          ]
        })
      } else {
        resolve({
          success: true,
          message: 'Legal compliance pages exist'
        })
      }
    })
  }

  checkMonitoringSetup() {
    return new Promise((resolve) => {
      const sentryConfigExists = fs.existsSync('sentry.client.config.ts') && 
                                fs.existsSync('sentry.server.config.ts')
      
      const performanceTracking = fs.existsSync('src/lib/utils/performance.ts')
      
      const issues = []
      const recommendations = []
      
      if (!sentryConfigExists) {
        issues.push('Error tracking not configured')
        recommendations.push('Set up Sentry for error tracking and monitoring')
      }
      
      if (!performanceTracking) {
        issues.push('Performance monitoring not implemented')
        recommendations.push('Implement performance monitoring for Core Web Vitals')
      }
      
      resolve({
        success: issues.length === 0,
        message: issues.length > 0 ? issues.join(', ') : 'Monitoring setup looks good',
        recommendations
      })
    })
  }
}

// Main execution
async function main() {
  const checker = new ProductionReadinessChecker()

  // Add all checks
  checker.addCheck('Environment Variables', 'Configuration', () => checker.checkEnvironmentVariables())
  checker.addCheck('Security Headers', 'Security', () => checker.checkSecurityConfiguration())
  checker.addCheck('Test Coverage', 'Quality Assurance', () => checker.checkTestCoverage(), false)
  checker.addCheck('Build Process', 'Build & Deploy', () => checker.checkBuildConfiguration())
  checker.addCheck('Legal Compliance', 'Compliance', () => checker.checkLegalCompliance())
  checker.addCheck('Monitoring Setup', 'Monitoring', () => checker.checkMonitoringSetup(), false)

  // Run all checks
  await checker.runAllChecks()
  
  // Generate report
  const isReady = checker.generateReport()

  // Additional recommendations
  log('\n📚 Additional Production Recommendations:', 'blue')
  log('   • Set up domain and SSL certificate', 'reset')
  log('   • Configure CDN for static assets', 'reset')
  log('   • Set up automated backups', 'reset')
  log('   • Configure monitoring alerts', 'reset')
  log('   • Plan deployment pipeline', 'reset')
  log('   • Prepare rollback procedures', 'reset')

  log('\n🚀 Next Steps:', 'magenta')
  if (isReady) {
    log('   1. Deploy to staging environment for final testing', 'reset')
    log('   2. Configure production domain and DNS', 'reset')
    log('   3. Set up monitoring and alerting', 'reset')
    log('   4. Deploy to production', 'reset')
  } else {
    log('   1. Fix all failed checks listed above', 'reset')
    log('   2. Run this script again to verify fixes', 'reset')
    log('   3. Address any remaining warnings', 'reset')
    log('   4. Proceed with deployment once all checks pass', 'reset')
  }

  process.exit(isReady ? 0 : 1)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`❌ Production readiness check failed: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { ProductionReadinessChecker }