import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// This script creates the initial admin users
// Run with: npm run create-admins

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

interface AdminUser {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'admin' | 'super_admin'
}

const adminUsers: AdminUser[] = [
  {
    email: 'zell@love4detailing.com',
    password: 'TempPass123!', // Client should change this immediately
    firstName: 'Zell',
    lastName: 'Love4Detailing',
    role: 'admin',
  },
  {
    email: 'paul@evans-studio.co.uk',
    password: 'DevPass123!', // You should change this immediately
    firstName: 'Paul',
    lastName: 'Evans',
    role: 'super_admin',
  },
]

async function createAdminUser(user: AdminUser) {
  try {
    console.log(`Creating admin user: ${user.email}`)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Skip email confirmation for admin users
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`❌ User ${user.email} already exists`)
        return false
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned')
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_active: true,
      })

    if (profileError) {
      console.error(`Profile creation failed for ${user.email}:`, profileError)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    console.log(`✅ Successfully created ${user.role}: ${user.email}`)
    return true

  } catch (error) {
    console.error(`❌ Failed to create user ${user.email}:`, error)
    return false
  }
}

export async function createAllAdminUsers() {
  console.log('🚀 Creating admin users...')
  
  let successCount = 0
  let failCount = 0

  for (const user of adminUsers) {
    const success = await createAdminUser(user)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`✅ Successfully created: ${successCount} users`)
  console.log(`❌ Failed: ${failCount} users`)

  if (successCount > 0) {
    console.log('\n🔐 Important Security Notes:')
    console.log('1. Admin users should change their passwords immediately after first login')
    console.log('2. Use strong, unique passwords for all admin accounts')
    console.log('3. Enable MFA if available in your authentication system')
    console.log('\n📧 Admin Login Credentials:')
    adminUsers.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`)
    })
    console.log('\n⚠️  Store these credentials securely and delete them from logs!')
  }

  return { successCount, failCount }
}

// Allow running directly with node
if (require.main === module) {
  createAllAdminUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}