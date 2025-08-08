#!/usr/bin/env node

/**
 * Performance Budget Enforcer for Love4Detailing
 * 
 * Enforces performance budgets during build process and CI/CD pipeline.
 * Prevents deployments that exceed performance thresholds.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { PERFORMANCE_BUDGETS } = require('../performance.config.js')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

class PerformanceBudgetEnforcer {
  constructor() {
    this.violations = []
    this.warnings = []
    this.passed = []
    this.buildPath = '.next'
  }

  /**
   * Main execution method
   */
  async enforce() {
    console.log(`${colors.blue}${colors.bold}🚀 Performance Budget Enforcement${colors.reset}`)
    console.log('=' .repeat(50))
    console.log('')

    try {
      // Check if build exists
      if (!fs.existsSync(this.buildPath)) {
        throw new Error('Build directory not found. Please run "npm run build" first.')
      }

      // Run all budget checks
      await this.checkBundleSizes()
      await this.checkImageOptimization()
      await this.checkFontLoading()
      await this.runLighthouseCI()
      await this.checkThirdPartyScripts()

      // Generate report
      this.generateReport()

      // Exit with appropriate code
      if (this.violations.length > 0) {
        process.exit(1)
      }

    } catch (error) {
      console.error(`${colors.red}❌ Performance budget enforcement failed:${colors.reset}`, error.message)
      process.exit(1)
    }
  }

  /**
   * Check JavaScript and CSS bundle sizes
   */
  async checkBundleSizes() {
    console.log(`${colors.yellow}📦 Checking bundle sizes...${colors.reset}`)

    try {
      // Read Next.js build manifest
      const buildManifestPath = path.join(this.buildPath, 'static/chunks/pages/_app.js')
      const staticManifestPath = path.join(this.buildPath, 'static/css')

      // Check main bundle size
      if (fs.existsSync(buildManifestPath)) {
        const mainBundleSize = this.getFileSize(buildManifestPath)
        this.checkBudget('Main JS Bundle', mainBundleSize, PERFORMANCE_BUDGETS.bundles.mainBundle)
      }

      // Check CSS bundle sizes
      if (fs.existsSync(staticManifestPath)) {
        const cssFiles = fs.readdirSync(staticManifestPath).filter(f => f.endsWith('.css'))
        const totalCSSSize = cssFiles.reduce((total, file) => {
          return total + this.getFileSize(path.join(staticManifestPath, file))
        }, 0)
        this.checkBudget('Total CSS', totalCSSSize, PERFORMANCE_BUDGETS.bundles.cssBundle)
      }

      // Check individual page bundles
      const pagesPath = path.join(this.buildPath, 'static/chunks/pages')
      if (fs.existsSync(pagesPath)) {
        const pageFiles = fs.readdirSync(pagesPath).filter(f => f.endsWith('.js'))
        pageFiles.forEach(file => {
          const pageSize = this.getFileSize(path.join(pagesPath, file))
          this.checkBudget(`Page bundle (${file})`, pageSize, PERFORMANCE_BUDGETS.bundles.pageBundle, 'warning')
        })
      }

    } catch (error) {
      console.warn(`${colors.yellow}⚠️  Bundle size check failed: ${error.message}${colors.reset}`)
    }
  }

  /**
   * Check image optimization
   */
  async checkImageOptimization() {
    console.log(`${colors.yellow}🖼️  Checking image optimization...${colors.reset}`)

    const publicPath = 'public'
    if (!fs.existsSync(publicPath)) return

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif']
    const images = this.findFilesByExtensions(publicPath, imageExtensions)

    images.forEach(imagePath => {
      const imageSize = this.getFileSize(imagePath)
      const relativePath = path.relative(publicPath, imagePath)
      
      if (imageSize > PERFORMANCE_BUDGETS.bundles.images) {
        this.violations.push({
          type: 'Image Size',
          file: relativePath,
          current: this.formatBytes(imageSize),
          budget: this.formatBytes(PERFORMANCE_BUDGETS.bundles.images),
          message: 'Image exceeds size budget. Consider optimization or lazy loading.'
        })
      } else {
        this.passed.push({
          type: 'Image Size',
          file: relativePath,
          size: this.formatBytes(imageSize)
        })
      }
    })
  }

  /**
   * Check font loading optimization
   */
  async checkFontLoading() {
    console.log(`${colors.yellow}🔤 Checking font loading...${colors.reset}`)

    const publicPath = 'public'
    if (!fs.existsSync(publicPath)) return

    const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf']
    const fonts = this.findFilesByExtensions(publicPath, fontExtensions)

    const totalFontSize = fonts.reduce((total, fontPath) => {
      return total + this.getFileSize(fontPath)
    }, 0)

    this.checkBudget('Total Fonts', totalFontSize, PERFORMANCE_BUDGETS.bundles.fonts, 'warning')

    // Check for font-display CSS property
    const cssFiles = this.findFilesByExtensions('src', ['.css', '.scss'])
    const hasFontDisplay = cssFiles.some(cssFile => {
      const content = fs.readFileSync(cssFile, 'utf8')
      return content.includes('font-display')
    })

    if (!hasFontDisplay && fonts.length > 0) {
      this.warnings.push({
        type: 'Font Loading',
        message: 'Consider using font-display: swap for better loading performance',
        recommendation: 'Add font-display: swap to @font-face declarations'
      })
    }
  }

  /**
   * Run Lighthouse CI if available
   */
  async runLighthouseCI() {
    console.log(`${colors.yellow}🏠 Running Lighthouse performance audit...${colors.reset}`)

    try {
      // Check if Lighthouse CI is configured
      const lhciConfigExists = fs.existsSync('lighthouserc.js') || fs.existsSync('.lighthouserc.json')
      
      if (!lhciConfigExists) {
        console.log(`${colors.blue}ℹ️  Lighthouse CI not configured, skipping...${colors.reset}`)
        return
      }

      // Start local server for testing
      console.log('Starting local server for Lighthouse audit...')
      const serverProcess = execSync('npm run start &', { stdio: 'ignore' })
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Run Lighthouse CI
      const result = execSync('npx lhci autorun', { encoding: 'utf8' })
      console.log(result)

      this.passed.push({
        type: 'Lighthouse Audit',
        message: 'Performance audit passed all thresholds'
      })

    } catch (error) {
      // Lighthouse CI failure should be treated as a budget violation
      this.violations.push({
        type: 'Lighthouse Audit',
        message: 'Performance audit failed to meet thresholds',
        details: error.message.substring(0, 200) + '...'
      })
    } finally {
      // Clean up server process
      try {
        execSync('pkill -f "next start"', { stdio: 'ignore' })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Check for excessive third-party scripts
   */
  async checkThirdPartyScripts() {
    console.log(`${colors.yellow}🌐 Checking third-party scripts...${colors.reset}`)

    const srcFiles = this.findFilesByExtensions('src', ['.js', '.jsx', '.ts', '.tsx'])
    const thirdPartyDomains = new Set()

    srcFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Look for external script loading patterns
      const scriptPatterns = [
        /https?:\/\/(?:www\.)?googletagmanager\.com/g,
        /https?:\/\/(?:www\.)?google-analytics\.com/g,
        /https?:\/\/(?:js\.)?sentry-cdn\.com/g,
        /https?:\/\/(?:www\.)?facebook\.com/g,
        /https?:\/\/(?:connect\.)?facebook\.net/g,
        /https?:\/\/(?:www\.)?twitter\.com/g,
        /https?:\/\/platform\.twitter\.com/g,
      ]

      scriptPatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const domain = new URL(match).hostname
            thirdPartyDomains.add(domain)
          })
        }
      })
    })

    const thirdPartyCount = thirdPartyDomains.size

    if (thirdPartyCount > PERFORMANCE_BUDGETS.resources.maxThirdPartyScripts) {
      this.violations.push({
        type: 'Third-party Scripts',
        current: thirdPartyCount,
        budget: PERFORMANCE_BUDGETS.resources.maxThirdPartyScripts,
        message: `Too many third-party scripts detected: ${Array.from(thirdPartyDomains).join(', ')}`
      })
    } else {
      this.passed.push({
        type: 'Third-party Scripts',
        count: thirdPartyCount,
        domains: Array.from(thirdPartyDomains)
      })
    }
  }

  /**
   * Check a value against a budget
   */
  checkBudget(name, current, budget, severity = 'error') {
    const withinBudget = current <= budget
    const percentage = ((current / budget) * 100).toFixed(1)

    if (withinBudget) {
      this.passed.push({
        type: name,
        current: this.formatBytes(current),
        budget: this.formatBytes(budget),
        percentage: `${percentage}%`
      })
    } else {
      const violation = {
        type: name,
        current: this.formatBytes(current),
        budget: this.formatBytes(budget),
        percentage: `${percentage}%`,
        message: `Exceeds budget by ${this.formatBytes(current - budget)}`
      }

      if (severity === 'error') {
        this.violations.push(violation)
      } else {
        this.warnings.push(violation)
      }
    }
  }

  /**
   * Generate and display report
   */
  generateReport() {
    console.log('')
    console.log(`${colors.blue}${colors.bold}📊 Performance Budget Report${colors.reset}`)
    console.log('=' .repeat(50))

    // Show violations
    if (this.violations.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ BUDGET VIOLATIONS (${this.violations.length}):${colors.reset}`)
      this.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${colors.red}${violation.type}${colors.reset}`)
        console.log(`   Current: ${violation.current || violation.count}`)
        console.log(`   Budget:  ${violation.budget}`)
        if (violation.percentage) {
          console.log(`   Usage:   ${violation.percentage}`)
        }
        console.log(`   ${colors.red}${violation.message}${colors.reset}`)
        if (violation.details) {
          console.log(`   Details: ${violation.details}`)
        }
      })
    }

    // Show warnings
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  WARNINGS (${this.warnings.length}):${colors.reset}`)
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${colors.yellow}${warning.type || 'Warning'}${colors.reset}`)
        console.log(`   ${warning.message}`)
        if (warning.recommendation) {
          console.log(`   💡 ${warning.recommendation}`)
        }
      })
    }

    // Show passed checks
    if (this.passed.length > 0) {
      console.log(`\n${colors.green}${colors.bold}✅ PASSED CHECKS (${this.passed.length}):${colors.reset}`)
      this.passed.forEach((pass, index) => {
        console.log(`   ${colors.green}✓${colors.reset} ${pass.type}`)
      })
    }

    // Summary
    console.log(`\n${colors.blue}${colors.bold}📈 SUMMARY:${colors.reset}`)
    console.log(`   Total Checks: ${this.violations.length + this.warnings.length + this.passed.length}`)
    console.log(`   ${colors.green}✅ Passed: ${this.passed.length}${colors.reset}`)
    console.log(`   ${colors.yellow}⚠️  Warnings: ${this.warnings.length}${colors.reset}`)
    console.log(`   ${colors.red}❌ Violations: ${this.violations.length}${colors.reset}`)

    // Final verdict
    console.log('')
    if (this.violations.length === 0) {
      console.log(`${colors.green}${colors.bold}🎉 All performance budgets met!${colors.reset}`)
      console.log(`${colors.green}✅ Ready for deployment${colors.reset}`)
    } else {
      console.log(`${colors.red}${colors.bold}🚫 Performance budget violations detected!${colors.reset}`)
      console.log(`${colors.red}❌ Please fix violations before deploying${colors.reset}`)
    }
  }

  /**
   * Utility methods
   */
  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size
    } catch (error) {
      return 0
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  findFilesByExtensions(dir, extensions, files = []) {
    if (!fs.existsSync(dir)) return files

    const items = fs.readdirSync(dir)
    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.findFilesByExtensions(fullPath, extensions, files)
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase()
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    })

    return files
  }
}

// Main execution
if (require.main === module) {
  const enforcer = new PerformanceBudgetEnforcer()
  enforcer.enforce().catch(error => {
    console.error('Performance budget enforcement failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceBudgetEnforcer