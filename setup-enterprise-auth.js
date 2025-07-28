#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function setupEnterpriseAuth() {
  console.log('🚀 Setting up Enterprise Authentication...\n')

  // 1. Check environment variables
  console.log('1. Checking environment variables...')
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
    process.exit(1)
  }

  // 2. Generate secrets if they don't exist
  console.log('2. Checking/generating auth secrets...')
  
  const envLocalPath = path.join(process.cwd(), '.env.local')
  let envContent = ''
  
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8')
  }

  let needsUpdate = false

  if (!process.env.ACCESS_TOKEN_SECRET) {
    const accessSecret = crypto.randomBytes(32).toString('base64')
    envContent += `\nACCESS_TOKEN_SECRET=${accessSecret}`
    needsUpdate = true
    console.log('✅ Generated ACCESS_TOKEN_SECRET')
  }

  if (!process.env.REFRESH_TOKEN_SECRET) {
    const refreshSecret = crypto.randomBytes(32).toString('base64')
    envContent += `\nREFRESH_TOKEN_SECRET=${refreshSecret}`
    needsUpdate = true
    console.log('✅ Generated REFRESH_TOKEN_SECRET')
  }

  if (needsUpdate) {
    fs.writeFileSync(envLocalPath, envContent)
    console.log('✅ Updated .env.local with new secrets')
  } else {
    console.log('✅ Auth secrets already configured')
  }

  // 3. Apply database schema
  console.log('3. Applying enterprise auth database schema...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const schemaPath = path.join(process.cwd(), 'enterprise-auth-schema.sql')
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ enterprise-auth-schema.sql not found')
    process.exit(1)
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql })
    if (error) {
      console.error('❌ Database schema error:', error.message)
    } else {
      console.log('✅ Enterprise auth schema applied successfully')
    }
  } catch (error) {
    // If exec_sql doesn't exist, we'll need to apply manually
    console.log('⚠️  Please apply the enterprise-auth-schema.sql manually in your Supabase dashboard')
    console.log('   Go to: SQL Editor > New Query > Paste the schema > Run')
  }

  // 4. Update middleware
  console.log('4. Switching to enterprise middleware...')
  
  const currentMiddleware = path.join(process.cwd(), 'src', 'middleware.ts')
  const enterpriseMiddleware = path.join(process.cwd(), 'src', 'middleware-enterprise.ts')
  const backupMiddleware = path.join(process.cwd(), 'src', 'middleware-simple.ts')

  if (fs.existsSync(currentMiddleware)) {
    fs.renameSync(currentMiddleware, backupMiddleware)
  }

  if (fs.existsSync(enterpriseMiddleware)) {
    fs.renameSync(enterpriseMiddleware, currentMiddleware)
    console.log('✅ Switched to enterprise middleware')
  } else {
    console.error('❌ Enterprise middleware not found')
  }

  // 5. Update layout to use enterprise auth
  console.log('5. Updating app layout...')
  
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx')
  
  if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8')
    
    // Replace auth import
    layoutContent = layoutContent.replace(
      "import { AuthProvider } from '@/lib/auth'",
      "import { EnterpriseAuthProvider } from '@/lib/auth/auth-enterprise'"
    )
    
    // Replace AuthProvider usage
    layoutContent = layoutContent.replace(
      '<AuthProvider>',
      '<EnterpriseAuthProvider>'
    )
    
    layoutContent = layoutContent.replace(
      '</AuthProvider>',
      '</EnterpriseAuthProvider>'
    )

    fs.writeFileSync(layoutPath, layoutContent)
    console.log('✅ Updated app layout to use enterprise auth')
  } else {
    console.error('❌ Layout file not found')
  }

  console.log('\n🎉 Enterprise Authentication setup complete!')
  console.log('\nNext steps:')
  console.log('1. If schema application failed, manually run enterprise-auth-schema.sql in Supabase')
  console.log('2. Update your components to use the new auth hooks from @/lib/auth/auth-enterprise')
  console.log('3. Test the login flow at /auth/login')
  console.log('4. Monitor security events in the new security_events table')
  
  console.log('\nNew endpoints available:')
  console.log('- POST /api/auth/enterprise/login')
  console.log('- POST /api/auth/enterprise/logout') 
  console.log('- POST /api/auth/enterprise/refresh')
  console.log('- GET  /api/auth/enterprise/validate')
}

setupEnterpriseAuth().catch(console.error)