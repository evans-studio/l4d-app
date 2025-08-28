#!/usr/bin/env node

/**
 * Script to systematically replace console.* statements with production-safe logging
 * 
 * Usage: node scripts/fix-console-logs.js
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

// Files to search and replace
const SEARCH_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx'
]

// Console statement patterns to replace
const REPLACEMENTS = [
  {
    // console.log -> logger.debug (development only)
    from: /console\.log\(/g,
    to: 'logger.debug(',
    description: 'console.log -> logger.debug'
  },
  {
    // console.error -> logger.error
    from: /console\.error\(/g,
    to: 'logger.error(',
    description: 'console.error -> logger.error'
  },
  {
    // console.warn -> logger.warn
    from: /console\.warn\(/g,
    to: 'logger.warn(',
    description: 'console.warn -> logger.warn'
  },
  {
    // console.info -> logger.info
    from: /console\.info\(/g,
    to: 'logger.info(',
    description: 'console.info -> logger.info'
  }
]

// Files that already have logger imported (to avoid duplicate imports)
const filesWithLogger = new Set()

// Add logger import to files that need it
function addLoggerImport(filePath, content) {
  // Check if already has logger import
  if (content.includes("import { logger }") || content.includes("from '@/lib/utils/logger'")) {
    return content
  }
  
  // Check if file has any console statements that need replacing
  const needsLogger = REPLACEMENTS.some(replacement => replacement.from.test(content))
  
  if (!needsLogger) {
    return content
  }
  
  // Find the last import statement
  const lines = content.split('\n')
  let lastImportIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('type ')) {
      lastImportIndex = i
    }
  }
  
  // Add logger import after last import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/lib/utils/logger'")
    return lines.join('\n')
  } else {
    // Add at beginning if no imports found
    return "import { logger } from '@/lib/utils/logger'\n\n" + content
  }
}

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let modifiedContent = content
    let hasChanges = false
    
    // Apply replacements
    for (const replacement of REPLACEMENTS) {
      const newContent = modifiedContent.replace(replacement.from, replacement.to)
      if (newContent !== modifiedContent) {
        console.log(`  ${replacement.description}`)
        modifiedContent = newContent
        hasChanges = true
      }
    }
    
    // Add logger import if needed
    if (hasChanges) {
      modifiedContent = addLoggerImport(filePath, modifiedContent)
      
      // Write back to file
      fs.writeFileSync(filePath, modifiedContent, 'utf8')
      console.log(`✅ Fixed: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Starting console.* statement cleanup...\n')
  
  let totalFiles = 0
  let processedFiles = 0
  
  for (const pattern of SEARCH_PATTERNS) {
    const files = await glob(pattern, { cwd: process.cwd() })
    
    for (const file of files) {
      totalFiles++
      const filePath = path.resolve(file)
      
      // Skip certain files
      if (
        filePath.includes('node_modules') ||
        filePath.includes('.next') ||
        filePath.includes('dist') ||
        filePath.includes('__tests__') ||
        filePath.includes('.test.') ||
        filePath.includes('.spec.') ||
        filePath.includes('logger.ts') // Don't modify the logger itself
      ) {
        continue
      }
      
      console.log(`\n🔍 Processing: ${file}`)
      const wasModified = await processFile(filePath)
      
      if (wasModified) {
        processedFiles++
      }
    }
  }
  
  console.log(`\n✨ Cleanup complete!`)
  console.log(`📊 Processed ${processedFiles} out of ${totalFiles} files`)
  console.log('\n🎯 Next steps:')
  console.log('1. Test the application to ensure logging works correctly')
  console.log('2. Run npm run build to check for any issues')
  console.log('3. Commit the changes')
}

main().catch(console.error)