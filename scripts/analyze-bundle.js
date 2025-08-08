#!/usr/bin/env node

/**
 * Bundle Analysis Script for Love4Detailing
 * 
 * Provides comprehensive bundle size analysis and optimization recommendations.
 * Integrates with Next.js bundle analyzer and custom analysis tools.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

// Bundle size thresholds (in bytes)
const THRESHOLDS = {
  // Next.js recommended limits
  FIRST_LOAD_JS: 128 * 1024, // 128kb
  PAGE_CHUNK: 244 * 1024,     // 244kb
  
  // Our production targets
  TOTAL_BUNDLE: 3 * 1024 * 1024, // 3MB
  DEVELOPMENT_BUNDLE: 10 * 1024 * 1024, // 10MB
  
  // Individual file thresholds
  LARGE_FILE: 100 * 1024,     // 100kb
  HUGE_FILE: 500 * 1024       // 500kb
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function analyzeNextBuildOutput() {
  log('\n📊 Running Next.js build analysis...', 'blue')
  
  try {
    // Run Next.js build with size analysis
    const buildOutput = execSync('npm run build', { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'] 
    })
    
    log('✅ Build completed successfully', 'green')
    
    // Parse build output for bundle information
    const lines = buildOutput.split('\n')
    const bundleInfo = []
    let inBundleSection = false
    
    lines.forEach(line => {
      if (line.includes('First Load JS')) {
        inBundleSection = true
      }
      
      if (inBundleSection && line.trim()) {
        if (line.includes('kB') || line.includes('MB') || line.includes('B ')) {
          bundleInfo.push(line.trim())
        }
      }
    })
    
    if (bundleInfo.length > 0) {
      log('\n📦 Bundle Size Analysis:', 'cyan')
      bundleInfo.forEach(info => {
        const isLarge = info.includes('MB') || 
                       (info.includes('kB') && parseInt(info.match(/\d+/)?.[0] || 0) > 200)
        log(`  ${info}`, isLarge ? 'yellow' : 'reset')
      })
    }
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, 'red')
    return false
  }
  
  return true
}

function analyzeBundleFiles() {
  log('\n🔍 Analyzing bundle files...', 'blue')
  
  const buildDir = path.join(process.cwd(), '.next')
  if (!fs.existsSync(buildDir)) {
    log('❌ Build directory not found. Run `npm run build` first.', 'red')
    return
  }
  
  // Find all JavaScript files in build output
  const jsFiles = []
  
  function findJSFiles(dir, relativePath = '') {
    try {
      const files = fs.readdirSync(dir)
      
      files.forEach(file => {
        const fullPath = path.join(dir, file)
        const relPath = path.join(relativePath, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory() && !file.startsWith('.')) {
          findJSFiles(fullPath, relPath)
        } else if (file.endsWith('.js') && !file.endsWith('.map')) {
          jsFiles.push({
            path: relPath,
            size: stat.size,
            fullPath
          })
        }
      })
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  findJSFiles(buildDir)
  
  // Sort by size (largest first)
  jsFiles.sort((a, b) => b.size - a.size)
  
  log(`\n📂 JavaScript Files (${jsFiles.length} total):`, 'cyan')
  
  let totalSize = 0
  const largeFiles = []
  const hugeFiles = []
  
  jsFiles.slice(0, 20).forEach((file, index) => {
    totalSize += file.size
    const sizeStr = formatBytes(file.size)
    const isHuge = file.size > THRESHOLDS.HUGE_FILE
    const isLarge = file.size > THRESHOLDS.LARGE_FILE
    
    if (isHuge) hugeFiles.push(file)
    else if (isLarge) largeFiles.push(file)
    
    const color = isHuge ? 'red' : isLarge ? 'yellow' : 'reset'
    const indicator = isHuge ? '🔥' : isLarge ? '⚠️' : '  '
    
    log(`  ${indicator} ${sizeStr.padEnd(8)} ${file.path}`, color)
  })
  
  if (jsFiles.length > 20) {
    const remaining = jsFiles.slice(20)
    const remainingSize = remaining.reduce((sum, file) => sum + file.size, 0)
    log(`  ... and ${remaining.length} more files (${formatBytes(remainingSize)})`, 'reset')
    totalSize += remainingSize
  }
  
  log(`\n📊 Bundle Statistics:`, 'cyan')
  log(`  Total JS Size: ${formatBytes(totalSize)}`, 'bright')
  log(`  Large Files (>100kb): ${largeFiles.length}`, largeFiles.length > 5 ? 'yellow' : 'green')
  log(`  Huge Files (>500kb): ${hugeFiles.length}`, hugeFiles.length > 0 ? 'red' : 'green')
  
  // Check against thresholds
  const isProduction = process.env.NODE_ENV === 'production'
  const threshold = isProduction ? THRESHOLDS.TOTAL_BUNDLE : THRESHOLDS.DEVELOPMENT_BUNDLE
  
  if (totalSize > threshold) {
    log(`\n⚠️  Bundle size exceeds ${isProduction ? 'production' : 'development'} threshold:`, 'yellow')
    log(`   Current: ${formatBytes(totalSize)}`, 'yellow')
    log(`   Limit:   ${formatBytes(threshold)}`, 'yellow')
  } else {
    log(`\n✅ Bundle size within limits (${formatBytes(totalSize)} < ${formatBytes(threshold)})`, 'green')
  }
  
  return {
    totalSize,
    fileCount: jsFiles.length,
    largeFiles: largeFiles.length,
    hugeFiles: hugeFiles.length
  }
}

function generateOptimizationRecommendations(stats) {
  log('\n💡 Optimization Recommendations:', 'magenta')
  
  const recommendations = []
  
  if (stats.hugeFiles > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: `${stats.hugeFiles} files are larger than 500KB`,
      solutions: [
        'Consider code splitting for large components',
        'Use dynamic imports for heavy libraries',
        'Check for duplicate dependencies',
        'Optimize large JSON or data files'
      ]
    })
  }
  
  if (stats.largeFiles > 5) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `${stats.largeFiles} files are larger than 100KB`,
      solutions: [
        'Enable tree shaking for unused exports',
        'Use Next.js dynamic imports',
        'Consider lazy loading for non-critical components',
        'Optimize third-party library usage'
      ]
    })
  }
  
  if (stats.totalSize > THRESHOLDS.TOTAL_BUNDLE) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Total bundle size exceeds production target',
      solutions: [
        'Enable compression in production',
        'Use Next.js Image optimization',
        'Implement proper code splitting',
        'Remove unused dependencies',
        'Use CDN for large assets'
      ]
    })
  }
  
  if (recommendations.length === 0) {
    log('  ✅ No major optimization issues detected!', 'green')
    log('  📈 Consider these general improvements:', 'blue')
    log('     • Enable compression middleware', 'reset')
    log('     • Use Next.js Image component for all images', 'reset')
    log('     • Implement service worker for caching', 'reset')
    log('     • Use dynamic imports for route components', 'reset')
  } else {
    recommendations.forEach((rec, index) => {
      const color = rec.priority === 'HIGH' ? 'red' : 'yellow'
      log(`\n  ${rec.priority === 'HIGH' ? '🔴' : '🟡'} ${rec.issue}`, color)
      rec.solutions.forEach(solution => {
        log(`     • ${solution}`, 'reset')
      })
    })
  }
}

function checkDependencies() {
  log('\n📦 Checking package dependencies...', 'blue')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    const heavyPackages = [
      'lodash', 'moment', 'react-dom', '@types/node',
      'typescript', 'eslint', 'jest', '@testing-library'
    ]
    
    const unusedPackages = []
    const heavyFound = []
    
    Object.keys(deps).forEach(dep => {
      if (heavyPackages.some(heavy => dep.includes(heavy))) {
        heavyFound.push(dep)
      }
    })
    
    if (heavyFound.length > 0) {
      log('\n⚠️  Heavy packages detected:', 'yellow')
      heavyFound.forEach(pkg => {
        log(`   • ${pkg}`, 'yellow')
      })
      
      log('\n💡 Consider alternatives:', 'blue')
      if (heavyFound.includes('lodash')) {
        log('   • Replace lodash with native JS methods or lodash-es', 'reset')
      }
      if (heavyFound.includes('moment')) {
        log('   • Replace moment with date-fns or dayjs', 'reset')
      }
    }
    
  } catch (error) {
    log('❌ Could not read package.json', 'red')
  }
}

function generateReport(stats) {
  log('\n📋 Generating detailed report...', 'blue')
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    bundleStats: stats,
    thresholds: THRESHOLDS,
    recommendations: 'See console output above'
  }
  
  const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  log(`✅ Report saved to: ${reportPath}`, 'green')
}

// Main execution
async function main() {
  log('🚀 Love4Detailing Bundle Analyzer', 'bright')
  log('==================================', 'bright')
  
  const buildSuccess = analyzeNextBuildOutput()
  if (!buildSuccess) {
    process.exit(1)
  }
  
  const stats = analyzeBundleFiles()
  generateOptimizationRecommendations(stats)
  checkDependencies()
  generateReport(stats)
  
  log('\n✨ Analysis complete!', 'green')
  log('\n📚 Additional tools:', 'blue')
  log('   • Run `npm run analyze` to open bundle visualizer', 'reset')
  log('   • Use `npm run build-stats` for detailed build analysis', 'reset')
  log('   • Check `bundle-analysis-report.json` for detailed metrics', 'reset')
}

// Run the analyzer
if (require.main === module) {
  main().catch(error => {
    log(`❌ Analysis failed: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { analyzeBundleFiles, formatBytes, THRESHOLDS }