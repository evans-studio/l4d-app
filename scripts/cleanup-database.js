#!/usr/bin/env node

/**
 * Database Cleanup Script for Love4Detailing
 * 
 * This script provides a command-line interface to safely clean up
 * all user data from the database for testing purposes.
 * 
 * Usage:
 *   node scripts/cleanup-database.js --preview    # Preview what will be deleted
 *   node scripts/cleanup-database.js --execute    # Execute the cleanup
 *   node scripts/cleanup-database.js --help       # Show help
 */

const readline = require('readline')

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CLEANUP_ENDPOINT = `${API_BASE_URL}/api/admin/cleanup-all-data`

// ANSI color codes for better terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function showHelp() {
  console.log(colorize('\n🧹 Love4Detailing Database Cleanup Script', 'bold'))
  console.log(colorize('============================================', 'cyan'))
  
  console.log('\nThis script helps you clean up all user data for testing purposes.')
  console.log(colorize('⚠️  WARNING: This operation is IRREVERSIBLE!', 'red'))
  
  console.log('\nUsage:')
  console.log(colorize('  node scripts/cleanup-database.js --preview', 'green') + '  # Show what will be deleted')
  console.log(colorize('  node scripts/cleanup-database.js --execute', 'yellow') + '  # Execute the cleanup')
  console.log(colorize('  node scripts/cleanup-database.js --help', 'blue') + '     # Show this help message')
  
  console.log('\nSafety Features:')
  console.log('• Only works in development environment')
  console.log('• Preserves admin accounts by default')
  console.log('• Requires confirmation code to execute')
  console.log('• Shows preview of what will be deleted')
  
  console.log('\nAdmin accounts preserved:')
  console.log('• zell@love4detailing.com')
  console.log('• paul@evans-studio.co.uk')
  console.log('')
}

async function makeRequest(method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(CLEANUP_ENDPOINT, options)
    const data = await response.json()
    
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      data: { error: { message: `Failed to connect to ${CLEANUP_ENDPOINT}` } }
    }
  }
}

async function showPreview() {
  console.log(colorize('\n🔍 Database Cleanup Preview', 'bold'))
  console.log(colorize('============================', 'cyan'))
  
  const result = await makeRequest('GET')
  
  if (!result.success) {
    console.error(colorize(`❌ Error: ${result.data.error?.message || 'Unknown error'}`, 'red'))
    return
  }
  
  const { recordsToDelete, adminAccountsPreserved, environment } = result.data.data
  
  console.log(colorize(`\n📊 Environment: ${environment.toUpperCase()}`, 'blue'))
  
  console.log(colorize('\n📈 Records that will be DELETED:', 'yellow'))
  Object.entries(recordsToDelete).forEach(([table, count]) => {
    const icon = count > 0 ? '🗑️ ' : '✅ '
    const color = count > 0 ? 'red' : 'green'
    console.log(`${icon}${table.replace('_', ' ')}: ${colorize(count.toString(), color)}`)
  })
  
  console.log(colorize('\n🛡️  Admin accounts PRESERVED:', 'green'))
  adminAccountsPreserved.forEach(email => {
    console.log(`✅ ${email}`)
  })
  
  console.log(colorize('\n⚠️  WARNING:', 'red'))
  console.log('This operation is IRREVERSIBLE. All customer data will be permanently deleted.')
  console.log('Only use this for testing and development purposes.')
  
  console.log(colorize('\nTo execute cleanup, run:', 'cyan'))
  console.log(colorize('node scripts/cleanup-database.js --execute', 'yellow'))
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function executeCleanup() {
  console.log(colorize('\n🚨 Database Cleanup Execution', 'bold'))
  console.log(colorize('=============================', 'red'))
  
  // First show preview
  await showPreview()
  
  console.log(colorize('\n⚠️  FINAL WARNING:', 'red'))
  console.log('You are about to PERMANENTLY DELETE all customer data!')
  console.log('This action CANNOT be undone.')
  
  const confirm1 = await askQuestion('\nType "YES" to continue or anything else to cancel: ')
  
  if (confirm1.toUpperCase() !== 'YES') {
    console.log(colorize('\n✅ Cleanup cancelled. No data was deleted.', 'green'))
    return
  }
  
  const confirm2 = await askQuestion('\nType "DELETE_ALL_DATA_CONFIRM" to proceed: ')
  
  if (confirm2 !== 'DELETE_ALL_DATA_CONFIRM') {
    console.log(colorize('\n✅ Cleanup cancelled. Incorrect confirmation code.', 'green'))
    return
  }
  
  console.log(colorize('\n🧹 Executing database cleanup...', 'yellow'))
  
  const result = await makeRequest('POST', {
    confirmationCode: 'DELETE_ALL_DATA_CONFIRM',
    preserveAdmins: true
  })
  
  if (!result.success) {
    console.error(colorize(`❌ Cleanup failed: ${result.data.error?.message || 'Unknown error'}`, 'red'))
    return
  }
  
  const { deletionSummary, preservedAdmins, timestamp } = result.data.data
  
  console.log(colorize('\n✅ Database cleanup completed successfully!', 'green'))
  console.log(colorize(`🕒 Completed at: ${timestamp}`, 'blue'))
  
  console.log(colorize('\n📊 Deletion Summary:', 'cyan'))
  Object.entries(deletionSummary).forEach(([table, count]) => {
    console.log(`🗑️  ${table.replace('_', ' ')}: ${colorize(count.toString(), 'red')} deleted`)
  })
  
  console.log(colorize('\n🛡️  Preserved Accounts:', 'green'))
  preservedAdmins.forEach(email => {
    console.log(`✅ ${email}`)
  })
  
  console.log(colorize('\n🎉 Ready for fresh testing!', 'green'))
  console.log('You can now test the registration and booking flow from scratch.')
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }
  
  if (args.includes('--preview') || args.includes('-p')) {
    await showPreview()
    return
  }
  
  if (args.includes('--execute') || args.includes('-e')) {
    await executeCleanup()
    return
  }
  
  console.log(colorize('❌ Invalid arguments. Use --help for usage information.', 'red'))
}

// Check if we're running in Node.js (not imported as module)
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Script error: ${error.message}`, 'red'))
    process.exit(1)
  })
}

module.exports = { showPreview, executeCleanup }