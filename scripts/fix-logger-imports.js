#!/usr/bin/env node

/**
 * Script to fix missing logger imports
 * 
 * Usage: node scripts/fix-logger-imports.js
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if file uses logger but doesn't import it
    const hasLoggerUsage = /logger\.(debug|info|warn|error|security|business)\(/g.test(content)
    const hasLoggerImport = /import.*logger.*from.*logger/g.test(content)
    
    if (hasLoggerUsage && !hasLoggerImport) {
      console.log(`🔧 Adding logger import to: ${filePath}`)
      
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
      } else {
        // Add at beginning if no imports found
        lines.unshift("import { logger } from '@/lib/utils/logger'")
      }
      
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Starting logger import fixes...\n')
  
  const files = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })
  
  let processedFiles = 0
  
  for (const file of files) {
    // Skip certain files
    if (
      file.includes('node_modules') ||
      file.includes('.next') ||
      file.includes('__tests__') ||
      file.includes('logger.ts') ||
      file.includes('database.types.ts')
    ) {
      continue
    }
    
    const filePath = path.resolve(file)
    const wasModified = await processFile(filePath)
    
    if (wasModified) {
      processedFiles++
    }
  }
  
  console.log(`\n✨ Logger import fixes complete!`)
  console.log(`📊 Fixed ${processedFiles} files`)
}

main().catch(console.error)