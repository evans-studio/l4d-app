/**
 * Playwright Global Teardown
 * 
 * Cleans up test environment after running E2E tests,
 * including database cleanup and removing test artifacts.
 */

import { createClient } from '@supabase/supabase-js'

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...')
  
  try {
    // Initialize Supabase client for cleanup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Clean up test data
    await cleanupTestData(supabase)
    
    // Clean up authentication states
    await cleanupAuthStates()
    
    console.log('✅ E2E test environment cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup E2E test environment:', error)
    // Don't throw error to avoid failing the test suite
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData(supabase: any) {
  console.log('🗑️ Cleaning up test data...')
  
  try {
    // Remove test bookings
    await supabase
      .from('bookings')
      .delete()
      .like('customer_email', '%test%')
    
    // Remove test user profiles
    await supabase
      .from('profiles')
      .delete()
      .like('email', '%test%')
    
    // Remove test time slots (only future dates to avoid affecting real data)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    
    await supabase
      .from('available_time_slots')
      .delete()
      .gte('date', futureDate.toISOString().split('T')[0])
    
    // Remove test services if they exist
    await supabase
      .from('services')
      .delete()
      .like('name', '%Test%')
    
    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error)
  }
}

/**
 * Clean up authentication state files
 */
async function cleanupAuthStates() {
  const fs = require('fs')
  const path = require('path')
  
  const authStateDir = path.join(__dirname, 'auth-states')
  
  if (fs.existsSync(authStateDir)) {
    try {
      // Remove all auth state files
      const files = fs.readdirSync(authStateDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(authStateDir, file))
        }
      }
      
      // Remove the directory if empty
      if (fs.readdirSync(authStateDir).length === 0) {
        fs.rmdirSync(authStateDir)
      }
      
      console.log('✅ Authentication states cleaned up')
    } catch (error) {
      console.error('❌ Failed to cleanup auth states:', error)
    }
  }
}

export default globalTeardown