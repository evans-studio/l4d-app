import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/direct'
import { ApiResponseHandler } from '@/lib/api/response'

// DANGER: This endpoint completely wipes all user data
// Only use in development/testing environments
export async function POST(request: NextRequest) {
  try {
    // Safety check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return ApiResponseHandler.error(
        'Data cleanup is not allowed in production environment',
        'PRODUCTION_SAFETY_BLOCK',
        403
      )
    }

    const body = await request.json()
    const { confirmationCode, preserveAdmins = true } = body

    // Require confirmation code to prevent accidental deletion
    if (confirmationCode !== 'DELETE_ALL_DATA_CONFIRM') {
      return ApiResponseHandler.error(
        'Invalid confirmation code. Use "DELETE_ALL_DATA_CONFIRM" to proceed.',
        'INVALID_CONFIRMATION',
        400
      )
    }

    console.log('🚨 Starting complete database cleanup...')

    const supabase = supabaseAdmin
    const deletionResults: { [key: string]: number } = {}

    // Admin emails to preserve (if preserveAdmins is true)
    const adminEmails = ['zell@love4detailing.com', 'paul@evans-studio.co.uk']

    // Get admin user IDs to preserve
    let adminUserIds: string[] = []
    if (preserveAdmins) {
      const { data: adminProfiles } = await supabase
        .from('user_profiles')
        .select('id')
        .in('email', adminEmails)
      
      adminUserIds = adminProfiles?.map(p => p.id) || []
      console.log('Preserving admin accounts:', adminUserIds)
    }

    // 1. Delete booking-related data first (due to foreign key constraints)
    console.log('Deleting booking-related data...')

    // Booking reschedule requests
    const { error: rescheduleError, count: rescheduleCount } = await supabase
      .from('booking_reschedule_requests')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (rescheduleError) console.error('Reschedule requests deletion error:', rescheduleError)
    deletionResults.reschedule_requests = rescheduleCount || 0

    // Booking status history
    const { error: historyError, count: historyCount } = await supabase
      .from('booking_status_history')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (historyError) console.error('Booking history deletion error:', historyError)
    deletionResults.booking_history = historyCount || 0

    // Booking services (junction table)
    const { error: bookingServicesError, count: bookingServicesCount } = await supabase
      .from('booking_services')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (bookingServicesError) console.error('Booking services deletion error:', bookingServicesError)
    deletionResults.booking_services = bookingServicesCount || 0

    // Main bookings
    let bookingsQuery = supabase
      .from('bookings')
      .delete()
      .neq('id', 'dummy') // Delete all

    // If preserving admins, exclude their bookings
    if (preserveAdmins && adminUserIds.length > 0) {
      bookingsQuery = bookingsQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }

    const { error: bookingsError, count: bookingsCount } = await bookingsQuery
    if (bookingsError) console.error('Bookings deletion error:', bookingsError)
    deletionResults.bookings = bookingsCount || 0

    // 2. Delete user-related data
    console.log('Deleting user-related data...')

    // Customer vehicles
    let vehiclesQuery = supabase
      .from('customer_vehicles')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (preserveAdmins && adminUserIds.length > 0) {
      vehiclesQuery = vehiclesQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }

    const { error: vehiclesError, count: vehiclesCount } = await vehiclesQuery
    if (vehiclesError) console.error('Vehicles deletion error:', vehiclesError)
    deletionResults.vehicles = vehiclesCount || 0

    // Customer addresses
    let addressesQuery = supabase
      .from('customer_addresses')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (preserveAdmins && adminUserIds.length > 0) {
      addressesQuery = addressesQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }

    const { error: addressesError, count: addressesCount } = await addressesQuery
    if (addressesError) console.error('Addresses deletion error:', addressesError)
    deletionResults.addresses = addressesCount || 0

    // Security events
    let securityQuery = supabase
      .from('security_events')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (preserveAdmins && adminUserIds.length > 0) {
      securityQuery = securityQuery.not('user_id', 'in', `(${adminUserIds.join(',')})`)
    }

    const { error: securityError, count: securityCount } = await securityQuery
    if (securityError) console.error('Security events deletion error:', securityError)
    deletionResults.security_events = securityCount || 0

    // Password reset tokens
    const { error: tokensError, count: tokensCount } = await supabase
      .from('password_reset_tokens')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (tokensError) console.error('Password tokens deletion error:', tokensError)
    deletionResults.password_tokens = tokensCount || 0

    // 3. Delete user profiles (but preserve admins if requested)
    console.log('Deleting user profiles...')

    let profilesQuery = supabase
      .from('user_profiles')
      .delete()
      .neq('id', 'dummy') // Delete all

    if (preserveAdmins) {
      profilesQuery = profilesQuery.not('email', 'in', `(${adminEmails.join(',')})`)
    }

    const { error: profilesError, count: profilesCount } = await profilesQuery
    if (profilesError) console.error('Profiles deletion error:', profilesError)
    deletionResults.user_profiles = profilesCount || 0

    // 4. Delete Supabase Auth users (DANGEROUS!)
    console.log('Deleting Supabase Auth users...')

    // Get all auth users first
    const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers()
    
    if (authListError) {
      console.error('Failed to list auth users:', authListError)
    } else {
      let deletedAuthUsers = 0
      
      for (const user of authUsers.users) {
        // Skip admin users if preserveAdmins is true
        if (preserveAdmins && user.email && adminEmails.includes(user.email.toLowerCase())) {
          console.log('Preserving admin auth user:', user.email)
          continue
        }

        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)
        if (deleteAuthError) {
          console.error(`Failed to delete auth user ${user.email}:`, deleteAuthError)
        } else {
          deletedAuthUsers++
          console.log(`Deleted auth user: ${user.email}`)
        }
      }
      
      deletionResults.auth_users = deletedAuthUsers
    }

    // 5. Reset time slots to available (optional)
    console.log('Resetting time slots to available...')
    const { error: slotsError, count: slotsCount } = await supabase
      .from('time_slots')
      .update({ is_available: true })
      .eq('is_available', false)

    if (slotsError) console.error('Time slots reset error:', slotsError)
    deletionResults.time_slots_reset = slotsCount || 0

    console.log('🧹 Database cleanup completed!')
    console.log('Deletion summary:', deletionResults)

    return ApiResponseHandler.success({
      message: 'Complete database cleanup successful',
      deletionSummary: deletionResults,
      preservedAdmins: preserveAdmins ? adminEmails : [],
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database cleanup error:', error)
    return ApiResponseHandler.serverError('Failed to cleanup database')
  }
}

// GET endpoint to check cleanup status and show what would be deleted
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return ApiResponseHandler.error(
        'Data cleanup is not allowed in production environment',
        'PRODUCTION_SAFETY_BLOCK',
        403
      )
    }

    const supabase = supabaseAdmin
    const adminEmails = ['zell@love4detailing.com', 'paul@evans-studio.co.uk']

    // Count all data that would be deleted
    const counts: { [key: string]: number } = {}

    // Get admin user IDs
    const { data: adminProfiles } = await supabase
      .from('user_profiles')
      .select('id')
      .in('email', adminEmails)
    const adminUserIds = adminProfiles?.map(p => p.id) || []

    // Count user profiles (excluding admins)
    const { count: profilesCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .not('email', 'in', `(${adminEmails.join(',')})`)
    counts.user_profiles = profilesCount || 0

    // Count bookings (excluding admin bookings)
    let bookingsCountQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    
    if (adminUserIds.length > 0) {
      bookingsCountQuery = bookingsCountQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }
    
    const { count: bookingsCount } = await bookingsCountQuery
    counts.bookings = bookingsCount || 0

    // Count vehicles
    let vehiclesCountQuery = supabase
      .from('customer_vehicles')
      .select('*', { count: 'exact', head: true })
    
    if (adminUserIds.length > 0) {
      vehiclesCountQuery = vehiclesCountQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }
    
    const { count: vehiclesCount } = await vehiclesCountQuery
    counts.vehicles = vehiclesCount || 0

    // Count addresses
    let addressesCountQuery = supabase
      .from('customer_addresses')
      .select('*', { count: 'exact', head: true })
    
    if (adminUserIds.length > 0) {
      addressesCountQuery = addressesCountQuery.not('customer_id', 'in', `(${adminUserIds.join(',')})`)
    }
    
    const { count: addressesCount } = await addressesCountQuery
    counts.addresses = addressesCount || 0

    // Count auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const nonAdminAuthUsers = authUsers?.users.filter(u => 
      !u.email || !adminEmails.includes(u.email.toLowerCase())
    ) || []
    counts.auth_users = nonAdminAuthUsers.length

    return ApiResponseHandler.success({
      message: 'Database cleanup preview',
      recordsToDelete: counts,
      adminAccountsPreserved: adminEmails,
      environment: process.env.NODE_ENV,
      warning: 'This operation is IRREVERSIBLE. All user data will be permanently deleted.',
      usage: {
        preview: 'GET /api/admin/cleanup-all-data',
        execute: 'POST /api/admin/cleanup-all-data with body: {"confirmationCode": "DELETE_ALL_DATA_CONFIRM", "preserveAdmins": true}'
      }
    })

  } catch (error) {
    console.error('Cleanup preview error:', error)
    return ApiResponseHandler.serverError('Failed to generate cleanup preview')
  }
}