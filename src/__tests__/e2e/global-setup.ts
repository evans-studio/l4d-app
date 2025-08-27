/**
 * Playwright Global Setup
 * 
 * Sets up the test environment before running E2E tests,
 * including database seeding and authentication setup.
 */

import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')
  
  try {
    // Initialize Supabase client for test database setup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Clean and seed test data
    await seedTestData(supabase)
    
    // Set up admin authentication state
    await setupAuthenticationStates(config)
    
    console.log('✅ E2E test environment setup complete')
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)
    throw error
  }
}

/**
 * Seed test data for E2E tests
 */
async function seedTestData(supabase: any) {
  console.log('📦 Seeding test data...')
  
  try {
    // Clean existing test data
    await supabase.from('bookings').delete().like('customer_email', '%test%')
    await supabase.from('profiles').delete().like('email', '%test%')
    await supabase.from('available_time_slots').delete().gte('date', '2024-01-01')
    
    // Create test services if they don't exist
    const { data: existingServices } = await supabase
      .from('services')
      .select('id')
      .limit(1)
    
    if (!existingServices?.length) {
      await supabase.from('services').insert([
        {
          name: 'Exterior Detail Test',
          description: 'Test exterior cleaning service',
          base_price: 25,
          duration_minutes: 120,
          category: 'exterior',
          is_active: true
        },
        {
          name: 'Interior Detail Test',
          description: 'Test interior cleaning service',
          base_price: 30,
          duration_minutes: 90,
          category: 'interior',
          is_active: true
        }
      ])
    }
    
    // Create test time slots
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const timeSlots = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(tomorrow)
      date.setDate(date.getDate() + i)
      
      timeSlots.push({
        date: date.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '11:00',
        is_available: true,
        max_bookings: 1
      }, {
        date: date.toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        is_available: true,
        max_bookings: 1
      })
    }
    
    await supabase.from('available_time_slots').insert(timeSlots)
    
    console.log('✅ Test data seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed test data:', error)
    throw error
  }
}

/**
 * Set up authentication states for different user types
 */
async function setupAuthenticationStates(config: FullConfig) {
  console.log('🔐 Setting up authentication states...')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Navigate to the app
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:3000')
    
    // Create customer authentication state
    await setupCustomerAuth(page)
    
    // Create admin authentication state
    await setupAdminAuth(page)
    
    console.log('✅ Authentication states configured')
  } catch (error) {
    console.error('❌ Failed to setup authentication states:', error)
    throw error
  } finally {
    await browser.close()
  }
}

/**
 * Set up customer user authentication
 */
async function setupCustomerAuth(page: any) {
  // This would involve creating a test customer account
  // and saving the authentication state for reuse in tests
  
  // For now, we'll create the auth state programmatically
  const customerAuthState = {
    user: {
      id: 'test-customer-id',
      email: 'test.customer@example.com',
      role: 'customer'
    },
    session: {
      access_token: 'test-customer-token',
      refresh_token: 'test-customer-refresh-token'
    }
  }
  
  // Store auth state in a file that tests can load
  const fs = require('fs')
  const path = require('path')
  
  const authStateDir = path.join(__dirname, 'auth-states')
  if (!fs.existsSync(authStateDir)) {
    fs.mkdirSync(authStateDir, { recursive: true })
  }
  
  fs.writeFileSync(
    path.join(authStateDir, 'customer.json'),
    JSON.stringify(customerAuthState, null, 2)
  )
}

/**
 * Set up admin user authentication
 */
async function setupAdminAuth(page: any) {
  const adminAuthState = {
    user: {
      id: 'test-admin-id', 
      email: 'test.admin@example.com',
      role: 'admin'
    },
    session: {
      access_token: 'test-admin-token',
      refresh_token: 'test-admin-refresh-token'
    }
  }
  
  const fs = require('fs')
  const path = require('path')
  
  const authStateDir = path.join(__dirname, 'auth-states')
  fs.writeFileSync(
    path.join(authStateDir, 'admin.json'),
    JSON.stringify(adminAuthState, null, 2)
  )
}

export default globalSetup