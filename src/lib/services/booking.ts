import { BaseService, ServiceResponse } from './base'
import { PricingService, PricingCalculation } from './pricing'
import { EmailService } from './email'
import { getUserProfile, getDisplayName } from '@/lib/utils/user-helpers'
import { 
  Booking, 
  BookingStatus, 
  CustomerAddress, 
  CustomerVehicle, 
  TimeSlot,
  CreateBookingRequest,
  BookingCalendarDay
} from '@/lib/utils/booking-types'

export interface BookingFilters {
  status?: BookingStatus[]
  dateFrom?: string
  dateTo?: string
  userId?: string
  search?: string
}

export class BookingService extends BaseService {

  // Customer Address Management
  async getCustomerAddresses(userId: string): Promise<ServiceResponse<CustomerAddress[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
    }, 'Failed to fetch customer addresses')
  }

  async createCustomerAddress(userId: string, addressData: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<CustomerAddress>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // If this is set as default, unset others
      if (addressData.is_primary) {
        await supabase
          .from('customer_addresses')
          .update({ is_primary: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_addresses')
        .insert({
          ...addressData,
          user_id: userId,
        })
        .select()
        .single()
    }, 'Failed to create customer address')
  }

  async updateCustomerAddress(userId: string, addressId: string, addressData: Partial<CustomerAddress>): Promise<ServiceResponse<CustomerAddress>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // If this is set as default, unset others
      if (addressData.is_primary) {
        await supabase
          .from('customer_addresses')
          .update({ is_primary: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_addresses')
        .update(addressData)
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single()
    }, 'Failed to update customer address')
  }

  async deleteCustomerAddress(userId: string, addressId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      const result = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete customer address')
  }

  // Customer Vehicle Management
  async getCustomerVehicles(userId: string): Promise<ServiceResponse<CustomerVehicle[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('customer_vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
    }, 'Failed to fetch customer vehicles')
  }

  async getCustomerVehicleById(userId: string, vehicleId: string): Promise<ServiceResponse<CustomerVehicle>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('customer_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .single()
    }, 'Failed to fetch customer vehicle')
  }

  async createCustomerVehicle(userId: string, vehicleData: Omit<CustomerVehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<CustomerVehicle>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // If this is set as default, unset others
      if (vehicleData.is_primary) {
        await supabase
          .from('customer_vehicles')
          .update({ is_primary: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_vehicles')
        .insert({
          ...vehicleData,
          user_id: userId,
        })
        .select('*')
        .single()
    }, 'Failed to create customer vehicle')
  }

  async updateCustomerVehicle(userId: string, vehicleId: string, vehicleData: Partial<CustomerVehicle>): Promise<ServiceResponse<CustomerVehicle>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // If this is set as default, unset others
      if (vehicleData.is_primary) {
        await supabase
          .from('customer_vehicles')
          .update({ is_primary: false })
          .eq('user_id', userId)
      }

      return supabase
        .from('customer_vehicles')
        .update(vehicleData)
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select('*')
        .single()
    }, 'Failed to update customer vehicle')
  }

  async deleteCustomerVehicle(userId: string, vehicleId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      const result = await supabase
        .from('customer_vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', userId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete customer vehicle')
  }

  // Time Slot Management
  async getAvailableTimeSlots(): Promise<ServiceResponse<TimeSlot[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('time_slots')
        .select('*')
        .eq('is_available', true)
        .order('slot_date')
        .order('start_time')
    }, 'Failed to fetch time slots')
  }

  async createTimeSlotsBulk(slots: Array<{
    slot_date: string
    start_time: string
    is_available: boolean
    created_by: string
    notes?: string
  }>): Promise<ServiceResponse<TimeSlot[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      
      // Check for duplicate slots (same date and time)
      const duplicateCheck = await supabase
        .from('time_slots')
        .select('slot_date, start_time')
        .in('slot_date', [...new Set(slots.map(s => s.slot_date))])
      
      if (duplicateCheck.error) {
        return { data: null, error: duplicateCheck.error }
      }
      
      // Filter out duplicates
      const existingSlots = new Set(
        duplicateCheck.data?.map(slot => `${slot.slot_date}-${slot.start_time}`) || []
      )
      
      const uniqueSlots = slots.filter(slot => 
        !existingSlots.has(`${slot.slot_date}-${slot.start_time}`)
      )
      
      // Filter out past time slots - for admin operations, allow a small buffer (5 minutes)
      // This is more lenient than customer booking restrictions
      const now = new Date()
      const adminBufferMinutes = 5 // Only exclude slots that started more than 5 minutes ago
      const bufferTime = adminBufferMinutes * 60 * 1000
      
      const futureSlots = uniqueSlots.filter(slot => {
        const slotDateTime = new Date(`${slot.slot_date}T${slot.start_time}`)
        return slotDateTime.getTime() > (now.getTime() - bufferTime)
      })
      
      const pastSlotsCount = uniqueSlots.length - futureSlots.length
      
      if (futureSlots.length === 0) {
        const duplicateCount = slots.length - uniqueSlots.length
        const errorMessage = duplicateCount > 0 && pastSlotsCount > 0
          ? `All time slots are either duplicates (${duplicateCount}) or in the past (${pastSlotsCount} slots started more than ${adminBufferMinutes} minutes ago)`
          : duplicateCount > 0
          ? 'All specified time slots already exist'
          : pastSlotsCount > 0
          ? `All specified time slots are in the past (${pastSlotsCount} slots started more than ${adminBufferMinutes} minutes ago)`
          : 'No valid time slots to create'
        
        return { 
          data: [], 
          error: { message: errorMessage } 
        }
      }
      
      // Transform slots to match database schema (remove duration_minutes, add notes)
      const dbSlots = futureSlots.map(slot => ({
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        is_available: slot.is_available,
        created_by: slot.created_by,
        notes: slot.notes || null
      }))
      
      // Insert unique slots
      return supabase
        .from('time_slots')
        .insert(dbSlots)
        .select()
    }, 'Failed to create time slots in bulk')
  }

  async getAvailabilityForDateRange(startDate: string, endDate: string): Promise<ServiceResponse<BookingCalendarDay[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // Get time slots in date range that are available
      const { data: timeSlots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .gte('slot_date', startDate)
        .lte('slot_date', endDate)
        .eq('is_available', true)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (slotsError) return { data: null, error: slotsError }

      // Get existing bookings that are using time slots
      const slotIds = timeSlots?.map(slot => slot.id) || []
      let bookedSlotIds: string[] = []

      if (slotIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('time_slot_id')
          .in('time_slot_id', slotIds)
          .not('status', 'in', '(cancelled)')

        if (bookingsError) return { data: null, error: bookingsError }
        bookedSlotIds = bookings?.map(booking => booking.time_slot_id).filter(Boolean) || []
      }

      // Available slot interface for calendar
      interface AvailableSlot {
        id: string
        start_time: string
        end_time: string
        available: boolean
        booking_count: number
      }
      
      // Group slots by date
      const slotsByDate: Record<string, AvailableSlot[]> = {}
      
      timeSlots?.forEach(slot => {
        const isBooked = bookedSlotIds.includes(slot.id)
        
        if (!slotsByDate[slot.slot_date]) {
          slotsByDate[slot.slot_date] = []
        }
        
        slotsByDate[slot.slot_date]!.push({
          id: slot.id as string,
          start_time: slot.start_time as string,
          end_time: slot.start_time as string, // Will be calculated based on service duration
          available: !isBooked,
          booking_count: isBooked ? 1 : 0,
        })
      })

      // Build calendar days - include all dates in range even if no slots
      const calendarDays: BookingCalendarDay[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        if (!dateStr) continue
        const dayOfWeek = date.getDay()
        
        const daySlots = slotsByDate[dateStr] || []
        const availableSlots = daySlots.filter(slot => slot.available)

        calendarDays.push({
          date: dateStr,
          day_of_week: dayOfWeek,
          available_slots: availableSlots,
          is_available: availableSlots.length > 0,
        })
      }

      return { data: calendarDays, error: null }
    }, 'Failed to fetch availability')
  }

  // Booking Management
  async getBookings(filters: BookingFilters = {}): Promise<ServiceResponse<Booking[]>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      let query = supabase
        .from('bookings')
        .select(`
          *,
          booking_services(
            *,
            service:services(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('scheduled_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('scheduled_date', filters.dateTo)
      }

      if (filters.userId) {
        query = query.eq('customer_id', filters.userId)
      }

      if (filters.search) {
        query = query.or(`booking_reference.ilike.%${filters.search}%,special_instructions.ilike.%${filters.search}%`)
      }

      return query
    }, 'Failed to fetch bookings')
  }

  async getBookingById(bookingId: string): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      return supabase
        .from('bookings')
        .select(`
          *,
          booking_services(
            *,
            service:services(*)
          )
        `)
        .eq('id', bookingId)
        .single()
    }, 'Failed to fetch booking')
  }

  async createBooking(userId: string, bookingData: CreateBookingRequest): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // Validate and verify time slot availability
      const { data: timeSlot, error: slotError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('id', bookingData.time_slot_id)
        .eq('is_available', true)
        .single()

      if (slotError || !timeSlot) {
        return { data: null, error: new Error('Selected time slot is not available') }
      }

      // Check if slot is already booked
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('time_slot_id', bookingData.time_slot_id)
        .not('status', 'in', '(cancelled)')
        .single()

      if (existingBooking) {
        return { data: null, error: new Error('Selected time slot is already booked') }
      }

      // Generate unique booking reference
      const bookingReference = `L4D-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      // Calculate pricing
      const pricingService = new PricingService()
      const pricingResult = await pricingService.calculateMultipleServices(
        bookingData.services,
        bookingData.vehicle.size,
        undefined, // Will calculate distance from postcode
        bookingData.address.postcode
      )

      if (!pricingResult.success || !pricingResult.data) {
        return { data: null, error: new Error('Failed to calculate pricing') }
      }

      const calculations = pricingResult.data
      const totalPrice = calculations.reduce((sum, calc) => sum + calc.totalPrice, 0)
      const totalDuration = calculations.reduce((sum, calc) => {
        // Add estimatedDuration property if it exists, otherwise default to 60 minutes
        const calcWithDuration = calc as PricingCalculation & { estimatedDuration?: number }
        return sum + (calcWithDuration.estimatedDuration || 60)
      }, 0)
      const distanceSurcharge = calculations[0]?.distanceSurcharge || 0
      const distanceKm = calculations[0]?.distanceKm || 0

      // Map vehicle size letter to display name
      const sizeMapping = {
        'S': 'Small',
        'M': 'Medium',
        'L': 'Large',
        'XL': 'Extra Large'
      }
      const vehicleSizeName = sizeMapping[bookingData.vehicle.size] || 'Medium'

      // Calculate end time based on duration
      const startTime = new Date(`${timeSlot.slot_date}T${timeSlot.start_time}`)
      const endTime = new Date(startTime.getTime() + totalDuration * 60000)
      const endTimeStr = endTime.toTimeString().split(' ')[0]?.substring(0, 5) || '00:00' // HH:MM format

      // Create booking with time slot integration
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingReference,
          customer_id: userId,
          time_slot_id: bookingData.time_slot_id,
          vehicle_details: {
            ...bookingData.vehicle,
            size_name: vehicleSizeName,
            size_multiplier: 1, // No longer using multipliers with direct pricing
          },
          service_address: bookingData.address,
          distance_km: distanceKm,
          // Scheduling from time slot
          scheduled_date: timeSlot.slot_date,
          scheduled_start_time: timeSlot.start_time,
          scheduled_end_time: endTimeStr,
          // Pricing
          base_price: totalPrice - distanceSurcharge,
          vehicle_size_multiplier: 1, // No longer using multipliers
          distance_surcharge: distanceSurcharge,
          total_price: totalPrice,
          estimated_duration: totalDuration,
          pricing_breakdown: {
            services: calculations.map(calc => ({
              service_id: calc.serviceId,
              service_name: calc.serviceName,
              base_price: calc.basePrice,
              vehicle_adjustment: calc.subtotal - calc.basePrice,
              final_price: calc.totalPrice - calc.distanceSurcharge,
            })),
            subtotal: totalPrice - distanceSurcharge,
            vehicle_multiplier: 1, // No longer using multipliers
            distance_surcharge: distanceSurcharge,
            total: totalPrice,
          },
          special_instructions: bookingData.customer_notes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single()

      if (bookingError) return { data: null, error: bookingError }

      // Create booking services
      const bookingServices = calculations.map(calc => ({
        booking_id: booking.id,
        service_id: calc.serviceId,
        service_details: {
          name: calc.serviceName,
          short_description: '', // Will be filled from service data
          base_price: calc.basePrice,
          estimated_duration: 60, // Default, will be updated
          category_name: '', // Will be filled from service data
        },
        price: calc.totalPrice - calc.distanceSurcharge,
        estimated_duration: 60, // Default duration
      }))

      const { error: servicesError } = await supabase
        .from('booking_services')
        .insert(bookingServices)

      if (servicesError) {
        // Cleanup: delete the booking if service insertion fails
        await supabase.from('bookings').delete().eq('id', booking.id)
        return { data: null, error: servicesError }
      }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          to_status: 'pending',
          changed_by: userId,
          reason: 'Booking created',
        })

      return { data: booking, error: null }
    }, 'Failed to create booking')
  }

  async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    changedBy: string,
    reason?: string,
    notes?: string,
    sendEmail: boolean = true
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      // Get current booking with customer info
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('status, customer_id')
        .eq('id', bookingId)
        .single()

      if (fetchError) return { data: null, error: fetchError }

      const updateData: Record<string, unknown> = { status }
      
      // Set timestamps for status changes
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        if (reason) {
          updateData.cancellation_reason = reason
        }
      }

      // Update booking
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          from_status: currentBooking.status,
          to_status: status,
          changed_by: changedBy,
          reason,
          notes,
        })

      // Send email notification if requested and status is significant
      if (sendEmail && ['confirmed', 'cancelled', 'completed'].includes(status)) {
        try {
          const userProfile = await getUserProfile(currentBooking.customer_id)
          if (userProfile) {
            const emailService = new EmailService()
            const customerName = getDisplayName(userProfile)
            
            await emailService.sendBookingStatusUpdate(
              userProfile.email,
              customerName,
              booking,
              currentBooking.status,
              reason
            )
            console.log(`Status update email sent for booking ${booking.booking_reference}`)
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError)
          // Don't fail the status update for email errors
        }
      }

      return { data: booking, error: null }
    }, 'Failed to update booking status')
  }

  async confirmBooking(
    bookingId: string,
    confirmedDate: string,
    confirmedTimeStart: string,
    confirmedTimeEnd: string,
    adminId: string,
    adminNotes?: string
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_date: confirmedDate,
          confirmed_time_start: confirmedTimeStart,
          confirmed_time_end: confirmedTimeEnd,
          confirmed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) return { data: null, error }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          to_status: 'confirmed',
          changed_by: adminId,
          reason: 'Booking confirmed by admin',
          notes: adminNotes,
        })

      return { data: booking, error: null }
    }, 'Failed to confirm booking')
  }

  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason: string,
    refundAmount?: number
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) return { data: null, error }

      // Add status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: bookingId,
          to_status: 'cancelled',
          changed_by: cancelledBy,
          reason,
          notes: refundAmount ? `Refund amount: £${refundAmount}` : undefined,
        })

      return { data: booking, error: null }
    }, 'Failed to cancel booking')
  }

  // Time Slot Management (Admin)
  async createTimeSlot(
    slotDate: string,
    startTime: string,
    createdBy: string,
    notes?: string
  ): Promise<ServiceResponse<TimeSlot>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      return supabase
        .from('time_slots')
        .insert({
          slot_date: slotDate,
          start_time: startTime,
          created_by: createdBy,
          notes,
          is_available: true,
        })
        .select()
        .single()
    }, 'Failed to create time slot')
  }

  async updateTimeSlot(
    slotId: string,
    updates: Partial<TimeSlot>
  ): Promise<ServiceResponse<TimeSlot>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      return supabase
        .from('time_slots')
        .update(updates)
        .eq('id', slotId)
        .select()
        .single()
    }, 'Failed to update time slot')
  }

  async deleteTimeSlot(slotId: string): Promise<ServiceResponse<void>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      const result = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId)
      return { data: undefined, error: result.error }
    }, 'Failed to delete time slot')
  }

  // Generic booking update method
  async updateBooking(
    bookingId: string,
    updates: Record<string, unknown>
  ): Promise<ServiceResponse<Booking>> {
    return this.executeQuery(async () => {
      const supabase = this.supabase
      
      return supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single()
    }, 'Failed to update booking')
  }
}