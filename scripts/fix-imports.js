#!/usr/bin/env node

/**
 * Fix broken import statements
 * 
 * This script fixes import statements that were corrupted during editing
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Find files with broken import statements
const findBrokenImports = (dir) => {
  const results = []
  
  const findFiles = (currentDir) => {
    const files = fs.readdirSync(currentDir)
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        findFiles(fullPath)
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8')
        
        // Look for broken import patterns
        if (content.includes('import { \nimport { logger }') || 
            content.match(/import \{\s*\nimport \{ logger \}/)) {
          results.push(fullPath)
        }
      }
    }
  }
  
  findFiles(dir)
  return results
}

// Fix broken import in a file
const fixFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Replace various broken patterns
    const patterns = [
      {
        broken: /import { \nimport { logger } from '@\/lib\/utils\/logger'\n/g,
        fixed: "import { logger } from '@/lib/utils/logger'\nimport {\n"
      },
      {
        broken: /import \{\s*\nimport \{ logger \} from '@\/lib\/utils\/logger'/g,
        fixed: "import { logger } from '@/lib/utils/logger'\nimport {"
      }
    ]
    
    patterns.forEach(({ broken, fixed }) => {
      content = content.replace(broken, fixed)
    })
    
    // Write the fixed content back
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Fixed: ${filePath}`)
    
    return true
  } catch (error) {
    console.error(`❌ Failed to fix: ${filePath}`, error.message)
    return false
  }
}

// Main execution
const main = () => {
  console.log('🔍 Finding files with broken imports...')
  
  const srcDir = path.join(process.cwd(), 'src')
  const brokenFiles = findBrokenImports(srcDir)
  
  console.log(`📁 Found ${brokenFiles.length} files with broken imports`)
  
  if (brokenFiles.length === 0) {
    console.log('✨ No broken imports found!')
    return
  }
  
  console.log('🔧 Fixing imports...')
  
  let fixed = 0
  for (const file of brokenFiles) {
    if (fixFile(file)) {
      fixed++
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} out of ${brokenFiles.length} files`)
  
  if (fixed === brokenFiles.length) {
    console.log('🎉 All imports fixed successfully!')
  } else {
    console.log('⚠️  Some files could not be fixed automatically')
  }
}

// Run the script
main()