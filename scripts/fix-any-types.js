#!/usr/bin/env node

/**
 * Script to systematically replace 'any' types with proper TypeScript types
 * 
 * Usage: node scripts/fix-any-types.js
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Common any type patterns and their replacements
const TYPE_REPLACEMENTS = [
  {
    // Function parameters and return types
    from: /\(\s*([^)]*?):\s*any\s*\)/g,
    to: (match, paramName) => {
      // Determine better type based on parameter name
      if (paramName.includes('error') || paramName.includes('Error')) {
        return `(${paramName}: Error | unknown)`
      }
      if (paramName.includes('data') || paramName.includes('result') || paramName.includes('response')) {
        return `(${paramName}: unknown)`
      }
      if (paramName.includes('event') || paramName.includes('Event')) {
        return `(${paramName}: Event)`
      }
      if (paramName.includes('element') || paramName.includes('Element')) {
        return `(${paramName}: Element)`
      }
      if (paramName.includes('options') || paramName.includes('config')) {
        return `(${paramName}: Record<string, unknown>)`
      }
      return `(${paramName}: unknown)`
    },
    description: 'Function parameter any types'
  },
  {
    // Variable declarations
    from: /:\s*any(\s*[=;,\]])/g,
    to: ': unknown$1',
    description: 'Variable any types → unknown'
  },
  {
    // Array of any
    from: /:\s*any\[\]/g,
    to: ': unknown[]',
    description: 'any[] → unknown[]'
  },
  {
    // Generic any
    from: /<any>/g,
    to: '<unknown>',
    description: 'Generic <any> → <unknown>'
  },
  {
    // Object with any values
    from: /Record<([^,>]+),\s*any>/g,
    to: 'Record<$1, unknown>',
    description: 'Record<K, any> → Record<K, unknown>'
  },
  {
    // as any casts - be more careful with these
    from: /as\s+any(?!\w)/g,
    to: 'as unknown',
    description: 'as any → as unknown'
  }
]

// Files to exclude (testing files, etc.)
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/__tests__/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/scripts/**',
  '**/logger.ts' // Don't modify the logger itself
]

// More specific type improvements for common patterns
const SPECIFIC_IMPROVEMENTS = [
  {
    // Next.js config types
    pattern: /config:\s*any/g,
    replacement: 'config: Record<string, unknown>',
    description: 'Config objects'
  },
  {
    // Event handlers
    pattern: /\(event:\s*any\)/g,
    replacement: '(event: Event)',
    description: 'Event handlers'
  },
  {
    // Database result types
    pattern: /data:\s*any/g,
    replacement: 'data: unknown',
    description: 'Database results'
  },
  {
    // API response types
    pattern: /response:\s*any/g,
    replacement: 'response: unknown',
    description: 'API responses'
  },
  {
    // Error types
    pattern: /error:\s*any/g,
    replacement: 'error: Error | unknown',
    description: 'Error parameters'
  }
]

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let modifiedContent = content
    let hasChanges = false
    const changes = []

    // Apply specific improvements first
    for (const improvement of SPECIFIC_IMPROVEMENTS) {
      const newContent = modifiedContent.replace(improvement.pattern, improvement.replacement)
      if (newContent !== modifiedContent) {
        changes.push(improvement.description)
        modifiedContent = newContent
        hasChanges = true
      }
    }

    // Apply general replacements
    for (const replacement of TYPE_REPLACEMENTS) {
      let newContent
      if (typeof replacement.to === 'function') {
        newContent = modifiedContent.replace(replacement.from, replacement.to)
      } else {
        newContent = modifiedContent.replace(replacement.from, replacement.to)
      }
      
      if (newContent !== modifiedContent) {
        changes.push(replacement.description)
        modifiedContent = newContent
        hasChanges = true
      }
    }

    // Write back to file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      changes.forEach(change => console.log(`  - ${change}`))
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
    return regex.test(filePath)
  })
}

async function main() {
  console.log('🔧 Starting any type elimination...\n')
  
  const files = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })
  
  let totalFiles = 0
  let processedFiles = 0
  
  for (const file of files) {
    totalFiles++
    const filePath = path.resolve(file)
    
    // Skip excluded files
    if (shouldExclude(filePath)) {
      continue
    }
    
    console.log(`\n🔍 Processing: ${file}`)
    const wasModified = await processFile(filePath)
    
    if (wasModified) {
      processedFiles++
    }
  }
  
  console.log(`\n✨ Any type elimination complete!`)
  console.log(`📊 Processed ${processedFiles} out of ${totalFiles} files`)
  console.log('\n🎯 Next steps:')
  console.log('1. Review the changes for correctness')
  console.log('2. Run npm run build to check for type errors')
  console.log('3. Fix any remaining type issues manually')
  console.log('4. Run tests to ensure functionality')
}

main().catch(console.error)