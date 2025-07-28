import { NextRequest } from 'next/server'
import { createClientFromRequest, createAdminClient } from '@/lib/supabase/server'
import { ApiResponseHandler } from '@/lib/api/response'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request)
    
    // Get current user and verify super admin role
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return ApiResponseHandler.unauthorized('Authentication required')
    }

    // Check user role - only super admin can seed database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return ApiResponseHandler.forbidden('Super admin access required')
    }

    // Read the SQL seed file
    const sqlFilePath = path.join(process.cwd(), 'database-seed.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      return ApiResponseHandler.error('Database seed file not found')
    }

    const seedSQL = fs.readFileSync(sqlFilePath, 'utf8')

    // Use admin client to execute the SQL
    const adminClient = createAdminClient()
    
    // Execute the seeding script
    // Note: We'll execute this in chunks because some queries depend on others
    const sqlStatements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const statement of sqlStatements) {
      if (statement.includes('DELETE FROM') || 
          statement.includes('INSERT INTO') || 
          statement.includes('DO $$') ||
          statement.includes('ANALYZE')) {
        try {
          const { error } = await adminClient.rpc('exec_sql', { sql_query: statement })
          if (error) {
            console.error('SQL execution error:', error)
            errorCount++
            results.push({ statement: statement.substring(0, 100) + '...', success: false, error: error.message })
          } else {
            successCount++
            results.push({ statement: statement.substring(0, 100) + '...', success: true })
          }
        } catch (err) {
          console.error('Statement execution error:', err)
          errorCount++
          results.push({ statement: statement.substring(0, 100) + '...', success: false, error: String(err) })
        }
      }
    }

    // If we can't use exec_sql, let's try a simpler approach with individual queries
    if (errorCount > 0) {
      // Fallback: Execute essential inserts manually
      try {
        // Check if we have any data already
        const { data: existingServices } = await adminClient
          .from('services')
          .select('id')
          .limit(1)

        if (!existingServices || existingServices.length === 0) {
          // Database is empty, let's seed essential data manually
          
          // Insert service categories
          const { data: categories, error: catError } = await adminClient
            .from('service_categories')
            .insert([
              { name: 'Basic Services', description: 'Essential car detailing services', display_order: 1, is_active: true },
              { name: 'Premium Services', description: 'High-end detailing packages', display_order: 2, is_active: true },
              { name: 'Specialty Services', description: 'Specialized detailing treatments', display_order: 3, is_active: true }
            ])
            .select()

          if (catError) throw catError

          // Insert vehicle sizes
          const { error: sizeError } = await adminClient
            .from('vehicle_sizes')
            .insert([
              { name: 'Small', description: 'City cars and small hatchbacks', price_multiplier: 1.00, display_order: 1, is_active: true },
              { name: 'Medium', description: 'Family saloons and medium SUVs', price_multiplier: 1.25, display_order: 2, is_active: true },
              { name: 'Large', description: 'Large saloons and SUVs', price_multiplier: 1.50, display_order: 3, is_active: true },
              { name: 'Extra Large', description: 'Luxury cars and large SUVs', price_multiplier: 2.00, display_order: 4, is_active: true }
            ])

          if (sizeError) throw sizeError

          // Insert basic services
          const basicCategory = categories?.find(c => c.name === 'Basic Services')
          const premiumCategory = categories?.find(c => c.name === 'Premium Services')
          
          if (basicCategory && premiumCategory) {
            const { error: serviceError } = await adminClient
              .from('services')
              .insert([
                {
                  category_id: basicCategory.id,
                  name: 'Basic Wash & Vacuum',
                  slug: 'basic-wash-vacuum',
                  short_description: 'External wash and interior vacuum',
                  full_description: 'A thorough external wash including pre-wash, wash, and dry, plus a comprehensive interior vacuum.',
                  base_price: 25.00,
                  duration_minutes: 60,
                  is_active: true,
                  display_order: 1
                },
                {
                  category_id: basicCategory.id,
                  name: 'Interior Deep Clean',
                  slug: 'interior-deep-clean',
                  short_description: 'Comprehensive interior cleaning',
                  full_description: 'Deep cleaning of all interior surfaces including dashboard, door panels, seats, and carpets.',
                  base_price: 35.00,
                  duration_minutes: 90,
                  is_active: true,
                  display_order: 2
                },
                {
                  category_id: premiumCategory.id,
                  name: 'Full Service Detail',
                  slug: 'full-service-detail',
                  short_description: 'Complete interior and exterior detail',
                  full_description: 'Our most popular service combining thorough interior and exterior detailing.',
                  base_price: 65.00,
                  duration_minutes: 180,
                  is_active: true,
                  display_order: 3
                }
              ])

            if (serviceError) throw serviceError
          }

          // Create time slots for next 7 days
          const timeSlots = []
          const slots = ['09:00', '11:00', '13:00', '15:00', '17:00']
          
          for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            
            // Skip Sundays
            if (date.getDay() !== 0) {
              for (const time of slots) {
                timeSlots.push({
                  slot_date: dateStr,
                  start_time: time,
                  is_available: true,
                  created_by: session.user.id,
                  notes: 'Auto-generated slot'
                })
              }
            }
          }

          const { error: slotError } = await adminClient
            .from('time_slots')
            .insert(timeSlots)

          if (slotError) throw slotError

          return ApiResponseHandler.success({
            message: 'Database seeded successfully with essential data',
            seeded: {
              service_categories: 3,
              vehicle_sizes: 4,
              services: 3,
              time_slots: timeSlots.length
            }
          })
        } else {
          return ApiResponseHandler.success({
            message: 'Database already contains data',
            note: 'Seeding skipped to prevent duplicates'
          })
        }
      } catch (fallbackError) {
        console.error('Fallback seeding error:', fallbackError)
        return ApiResponseHandler.error('Failed to seed database: ' + String(fallbackError))
      }
    }

    return ApiResponseHandler.success({
      message: 'Database seeding completed',
      results: {
        successful_statements: successCount,
        failed_statements: errorCount,
        details: results
      }
    })

  } catch (error) {
    console.error('Database seeding error:', error)
    return ApiResponseHandler.serverError('Failed to seed database')
  }
}